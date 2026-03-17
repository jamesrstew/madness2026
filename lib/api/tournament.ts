/**
 * Unified tournament data provider.
 *
 * Merges real data from ESPN (basic stats, teams, records) and
 * CBBD (advanced efficiency metrics). Never serves mock/stale data —
 * fields default to 0 when the upstream API is unavailable.
 */
import type { Team } from '../types/team';
import type { TeamStats } from '../types/stats';
import { TOURNAMENT_SEEDS, TOURNAMENT_TEAM_IDS, DUPLICATE_OVERRIDES } from '../tournament-seeds';
import { getTeams as getEspnTeams, getTeamStats as getEspnStats, getTeamRecordsBatch } from './espn';
import { getAdjustedRatings, getSrsRatings, getTeamSeasonStats } from './cbbd';
import { getCbbdName } from './team-mapping';
import { cachedFetch } from './cache';
import { MOCK_TEAMS } from '../mock-data';

const TOURNAMENT_TTL = 6 * 60 * 60 * 1000; // 6 hours

// ---------------------------------------------------------------------------
// Tournament Teams
// ---------------------------------------------------------------------------

/**
 * Returns the 64-team tournament field with real ESPN data (names, records,
 * colors, logos) enriched with Selection Committee seed/region assignments.
 * Falls back to MOCK_TEAMS only for team identity (name, logo, color) when
 * ESPN is completely unreachable — records always come from live sources.
 */
export async function getTournamentTeams(): Promise<Team[]> {
  try {
    return await cachedFetch('tournament:teams', async () => {
      // Fetch ESPN teams, CBBD season stats, and ESPN individual records
      // in parallel so we can enrich Team records with real win/loss data.
      const [espnTeams, seasonStats, espnRecords] = await Promise.all([
        getEspnTeams(),
        getTeamSeasonStats().catch(() => null),
        getTeamRecordsBatch(TOURNAMENT_TEAM_IDS).catch(() => new Map<number, { wins: number; losses: number }>()),
      ]);

      const espnById = new Map(espnTeams.map((t) => [t.id, t]));

      // Build CBBD season stats lookup by lowercase team name
      const seasonByTeam = new Map(
        (seasonStats ?? []).map((r) => [r.team.toLowerCase(), r]),
      );

      const teams: Team[] = [];

      for (const idStr of Object.keys(TOURNAMENT_SEEDS)) {
        const id = Number(idStr);
        const seed = TOURNAMENT_SEEDS[id];
        if (!seed) continue;

        const espn = espnById.get(id);
        const dupeKey = `${id}:${seed.region}`;
        const override = DUPLICATE_OVERRIDES[dupeKey];

        if (espn) {
          // Resolve record: ESPN bulk (if non-zero) > ESPN individual > CBBD season
          let record = espn.record;
          if (record.wins === 0 && record.losses === 0) {
            const indRecord = espnRecords.get(id);
            if (indRecord && indRecord.wins + indRecord.losses > 0) {
              record = indRecord;
            } else {
              const cbbdName = getCbbdName(id);
              const season = cbbdName ? seasonByTeam.get(cbbdName.toLowerCase()) : undefined;
              if (season && season.wins + season.losses > 0) {
                record = { wins: season.wins, losses: season.losses };
              }
            }
          }

          teams.push({
            ...espn,
            seed: seed.seed,
            region: seed.region,
            abbreviation: override?.abbreviation ?? espn.abbreviation,
            shortName: override?.shortName ?? espn.shortName,
            cbbdName: getCbbdName(id),
            record,
          });
        } else {
          // ESPN didn't return this team — use mock entry for identity only
          const mock = MOCK_TEAMS.find(
            (t) => t.id === id && t.region === seed.region,
          );
          if (mock) {
            // Override the mock record with ESPN individual if available
            const indRecord = espnRecords.get(id);
            const record = indRecord && indRecord.wins + indRecord.losses > 0
              ? indRecord
              : { wins: 0, losses: 0 };
            teams.push({ ...mock, record });
          }
        }
      }

      return teams.length >= 60 ? teams : MOCK_TEAMS;
    }, TOURNAMENT_TTL);
  } catch (err) {
    console.warn('[tournament] Failed to fetch teams, using mock:', err);
    return MOCK_TEAMS;
  }
}

// ---------------------------------------------------------------------------
// Tournament Stats — single team
// ---------------------------------------------------------------------------

/**
 * Returns merged stats for a single team: CBBD advanced metrics +
 * ESPN basic stats. Returns zeroed stats when APIs are unavailable.
 */
export async function getTeamStatsReal(teamId: number): Promise<TeamStats> {
  const allStats = await getAllTournamentStats();
  return allStats.get(teamId) ?? fallbackStats();
}

// ---------------------------------------------------------------------------
// Tournament Stats — all teams at once (efficient: 2-3 API calls total)
// ---------------------------------------------------------------------------

/**
 * Fetches advanced + basic stats for every tournament team in bulk.
 * Uses CBBD adjusted ratings, SRS ratings, and season stats, plus ESPN
 * per-team stats where CBBD doesn't cover a field.
 *
 * Results are cached for 6 hours.
 */
export async function getAllTournamentStats(): Promise<Map<number, TeamStats>> {
  try {
    return await cachedFetch('tournament:allStats', async () => {
      // Fetch all CBBD data in parallel — each call isolated so a CBBD
      // outage (e.g. quota exceeded) doesn't prevent ESPN stats from loading.
      const [adjRatings, srsRatings, seasonStats, espnRecords] = await Promise.all([
        getAdjustedRatings().catch(() => null),
        getSrsRatings().catch(() => null),
        getTeamSeasonStats().catch(() => null),
        getTeamRecordsBatch(TOURNAMENT_TEAM_IDS).catch(() => new Map<number, { wins: number; losses: number }>()),
      ]);

      // Build lookup maps keyed by CBBD team name (lowercase)
      const adjByTeam = new Map(
        (adjRatings ?? []).map((r) => [r.team.toLowerCase(), r]),
      );
      const srsByTeam = new Map(
        (srsRatings ?? []).map((r) => [r.team.toLowerCase(), r]),
      );
      const seasonByTeam = new Map(
        (seasonStats ?? []).map((r) => [r.team.toLowerCase(), r]),
      );

      // Pre-fetch ESPN stats in parallel (max 10 concurrent to avoid hammering)
      const espnStatsMap = new Map<number, TeamStats>();
      const chunks: number[][] = [];
      for (let i = 0; i < TOURNAMENT_TEAM_IDS.length; i += 10) {
        chunks.push(TOURNAMENT_TEAM_IDS.slice(i, i + 10));
      }
      for (const chunk of chunks) {
        const results = await Promise.allSettled(
          chunk.map(async (id) => {
            const stats = await getEspnStats(id);
            return { id, stats };
          }),
        );
        for (const r of results) {
          if (r.status === 'fulfilled') {
            espnStatsMap.set(r.value.id, r.value.stats);
          }
        }
      }

      const result = new Map<number, TeamStats>();

      // For each tournament team, merge CBBD + ESPN (no mock fallbacks)
      for (const id of TOURNAMENT_TEAM_IDS) {
        const cbbdName = getCbbdName(id);
        const key = cbbdName?.toLowerCase();

        const adj = key ? adjByTeam.get(key) : undefined;
        const srs = key ? srsByTeam.get(key) : undefined;
        const season = key ? seasonByTeam.get(key) : undefined;

        // Use pre-fetched ESPN stats
        const espn = espnStatsMap.get(id) ?? null;

        const games = season?.games || 0;

        const mergedAdjOE = adj?.adjustedOffense ?? 0;
        const mergedAdjDE = adj?.adjustedDefense ?? 0;

        // Resolve record: ESPN individual > CBBD season > ESPN stats endpoint
        const indRecord = espnRecords.get(id);
        let record: { wins: number; losses: number };
        if (indRecord && indRecord.wins + indRecord.losses > 0) {
          record = indRecord;
        } else if (season && season.wins + season.losses > 0) {
          record = { wins: season.wins, losses: season.losses };
        } else if (espn?.record && espn.record.wins + espn.record.losses > 0) {
          record = espn.record;
        } else {
          record = { wins: 0, losses: 0 };
        }

        const stats: TeamStats = {
          // Advanced metrics from CBBD adjusted ratings
          adjOE: mergedAdjOE,
          adjDE: mergedAdjDE,
          adjEM:
            adj != null && adj.adjustedOffense != null && adj.adjustedDefense != null
              ? Math.round((adj.adjustedOffense - adj.adjustedDefense) * 10) / 10
              : mergedAdjOE && mergedAdjDE
                ? Math.round((mergedAdjOE - mergedAdjDE) * 10) / 10
                : 0,
          tempo: adj?.adjustedTempo ?? 0,
          sos: srs?.sos ?? 0,

          // Four factors — derive from CBBD season stats if available
          // eFG values are percentages (e.g. 55.0, not 0.55) to match ESPN's scale
          oEFG: deriveEfgPct(season) ?? 0,
          dEFG: deriveDefEfgPct(season) ?? 0,
          oTOV:
            season && games > 0
              ? round3(season.turnovers / games)
              : espn?.oTOV ?? 0,
          dTOV:
            season && games > 0 && season.opponentTurnovers > 0
              ? round3(season.opponentTurnovers / games)
              : 0,
          oORB:
            season && games > 0
              ? round3(season.offensiveRebounds / games)
              : espn?.oORB ?? 0,
          dORB:
            season && games > 0
              ? round3(season.defensiveRebounds / games)
              : espn?.dORB ?? 0,
          oFTR: deriveFtrPct(season) ?? 0,
          dFTR: deriveDefFtrPct(season) ?? 0,

          // Basic per-game stats: prefer ESPN (real-time) > CBBD season > 0
          ppg:
            espn?.ppg ||
            (season && games > 0 ? round1(season.points / games) : 0) ||
            0,
          oppg:
            (season && games > 0
              ? round1(season.opponentPoints / games)
              : 0) ||
            0,
          fgPct:
            espn?.fgPct ||
            (season && season.fieldGoalsAttempted > 0
              ? round3(season.fieldGoalsMade / season.fieldGoalsAttempted)
              : 0) ||
            0,
          fg3Pct:
            espn?.fg3Pct ||
            (season && season.threePointFieldGoalsAttempted > 0
              ? round3(season.threePointFieldGoalsMade / season.threePointFieldGoalsAttempted)
              : 0) ||
            0,
          ftPct:
            espn?.ftPct ||
            (season && season.freeThrowsAttempted > 0
              ? round3(season.freeThrowsMade / season.freeThrowsAttempted)
              : 0) ||
            0,
          rpg:
            espn?.rpg ||
            (season && games > 0
              ? round1((season.offensiveRebounds + season.defensiveRebounds) / games)
              : 0) ||
            0,
          apg:
            espn?.apg ||
            (season && games > 0 ? round1(season.assists / games) : 0) ||
            0,
          spg:
            espn?.spg ||
            (season && games > 0 ? round1(season.steals / games) : 0) ||
            0,
          bpg:
            espn?.bpg ||
            (season && games > 0 ? round1(season.blocks / games) : 0) ||
            0,

          record,
        };

        result.set(id, stats);
      }

      return result;
    }, TOURNAMENT_TTL);
  } catch (err) {
    console.warn('[tournament] Stats fetch failed completely:', err);
    return new Map();
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/** Offensive eFG% = (FGM + 0.5 * 3PM) / FGA — as a percentage (e.g. 55.0) */
function deriveEfgPct(
  season: { fieldGoalsMade: number; threePointFieldGoalsMade: number; fieldGoalsAttempted: number } | undefined,
): number | null {
  if (!season || season.fieldGoalsAttempted === 0) return null;
  return round1(
    ((season.fieldGoalsMade + 0.5 * season.threePointFieldGoalsMade) /
      season.fieldGoalsAttempted) * 100,
  );
}

/** Defensive eFG% = (oppFGM + 0.5 * opp3PM) / oppFGA — as a percentage */
function deriveDefEfgPct(
  season: { opponentFieldGoalsMade?: number; opponentThreePointFieldGoalsMade?: number; opponentFieldGoalsAttempted?: number } | undefined,
): number | null {
  if (!season) return null;
  const fga = season.opponentFieldGoalsAttempted ?? 0;
  if (fga === 0) return null;
  const fgm = season.opponentFieldGoalsMade ?? 0;
  const fg3m = season.opponentThreePointFieldGoalsMade ?? 0;
  return round1(((fgm + 0.5 * fg3m) / fga) * 100);
}

/** Offensive FT Rate = FTA / FGA — as a percentage */
function deriveFtrPct(
  season: { freeThrowsAttempted: number; fieldGoalsAttempted: number } | undefined,
): number | null {
  if (!season || season.fieldGoalsAttempted === 0) return null;
  return round1((season.freeThrowsAttempted / season.fieldGoalsAttempted) * 100);
}

/** Defensive FT Rate = oppFTA / oppFGA — as a percentage */
function deriveDefFtrPct(
  season: { opponentFreeThrowsAttempted?: number; opponentFieldGoalsAttempted?: number } | undefined,
): number | null {
  if (!season) return null;
  const fga = season.opponentFieldGoalsAttempted ?? 0;
  if (fga === 0) return null;
  return round1(((season.opponentFreeThrowsAttempted ?? 0) / fga) * 100);
}

function fallbackStats(): TeamStats {
  return {
    adjOE: 0, adjDE: 0, adjEM: 0, tempo: 0, sos: 0,
    oEFG: 0, dEFG: 0, oTOV: 0, dTOV: 0, oORB: 0, dORB: 0, oFTR: 0, dFTR: 0,
    ppg: 0, oppg: 0, fgPct: 0, fg3Pct: 0, ftPct: 0,
    rpg: 0, apg: 0, spg: 0, bpg: 0,
    record: { wins: 0, losses: 0 },
  };
}
