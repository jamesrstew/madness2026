/**
 * Unified tournament data provider.
 *
 * Merges real data from ESPN (basic stats, teams, records) and
 * CBBD (advanced efficiency metrics) with a graceful fallback
 * to the mock data when APIs are unavailable.
 */
import type { Team } from '../types/team';
import type { TeamStats } from '../types/stats';
import { TOURNAMENT_SEEDS, TOURNAMENT_TEAM_IDS, DUPLICATE_OVERRIDES } from '../tournament-seeds';
import { getTeams as getEspnTeams, getTeamStats as getEspnStats } from './espn';
import { getAdjustedRatings, getSrsRatings, getTeamSeasonStats } from './cbbd';
import { getCbbdName } from './team-mapping';
import { cachedFetch } from './cache';
import { MOCK_TEAMS, MOCK_STATS } from '../mock-data';

const TOURNAMENT_TTL = 6 * 60 * 60 * 1000; // 6 hours

// ---------------------------------------------------------------------------
// Tournament Teams
// ---------------------------------------------------------------------------

/**
 * Returns the 64-team tournament field with real ESPN data (names, records,
 * colors, logos) enriched with Selection Committee seed/region assignments.
 * Falls back to MOCK_TEAMS on failure.
 */
export async function getTournamentTeams(): Promise<Team[]> {
  try {
    return await cachedFetch('tournament:teams', async () => {
      // Fetch ESPN teams and CBBD season stats in parallel so we can
      // enrich Team records with real win/loss data.
      const [espnTeams, seasonStats] = await Promise.all([
        getEspnTeams(),
        getTeamSeasonStats().catch(() => null),
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
          // Resolve record: prefer ESPN (if non-zero) > CBBD season > mock
          let record = espn.record;
          if (record.wins === 0 && record.losses === 0) {
            const cbbdName = getCbbdName(id);
            const season = cbbdName ? seasonByTeam.get(cbbdName.toLowerCase()) : undefined;
            if (season && season.wins + season.losses > 0) {
              record = { wins: season.wins, losses: season.losses };
            } else {
              const mock = MOCK_TEAMS.find(
                (t) => t.id === id && t.region === seed.region,
              );
              if (mock && mock.record.wins + mock.record.losses > 0) {
                record = mock.record;
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
          // ESPN didn't return this team — use mock entry as fallback
          const mock = MOCK_TEAMS.find(
            (t) => t.id === id && t.region === seed.region,
          );
          if (mock) teams.push(mock);
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
 * ESPN basic stats. Falls back to MOCK_STATS for any missing values.
 */
export async function getTeamStatsReal(teamId: number): Promise<TeamStats> {
  const allStats = await getAllTournamentStats();
  return allStats.get(teamId) ?? MOCK_STATS.get(teamId) ?? fallbackStats();
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
      // Fetch all CBBD data in parallel
      const [adjRatings, srsRatings, seasonStats] = await Promise.all([
        getAdjustedRatings(),
        getSrsRatings(),
        getTeamSeasonStats(),
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

      // For each tournament team, merge CBBD + ESPN + mock
      for (const id of TOURNAMENT_TEAM_IDS) {
        const cbbdName = getCbbdName(id);
        const key = cbbdName?.toLowerCase();

        const adj = key ? adjByTeam.get(key) : undefined;
        const srs = key ? srsByTeam.get(key) : undefined;
        const season = key ? seasonByTeam.get(key) : undefined;
        const mock = MOCK_STATS.get(id);

        // Use pre-fetched ESPN stats
        const espn = espnStatsMap.get(id) ?? null;

        const games = season?.games || 0;

        // Merge: prefer CBBD > ESPN > mock > 0
        const mergedAdjOE = adj?.adjustedOffense ?? mock?.adjOE ?? 0;
        const mergedAdjDE = adj?.adjustedDefense ?? mock?.adjDE ?? 0;

        const stats: TeamStats = {
          // Advanced metrics from CBBD adjusted ratings
          adjOE: mergedAdjOE,
          adjDE: mergedAdjDE,
          adjEM:
            adj != null && adj.adjustedOffense != null && adj.adjustedDefense != null
              ? Math.round((adj.adjustedOffense - adj.adjustedDefense) * 10) / 10
              : mock?.adjEM ??
                (mergedAdjOE && mergedAdjDE
                  ? Math.round((mergedAdjOE - mergedAdjDE) * 10) / 10
                  : 0),
          tempo: adj?.adjustedTempo ?? mock?.tempo ?? 0,
          sos: srs?.sos ?? mock?.sos ?? 0,

          // Four factors — derive from CBBD season stats if available
          oEFG: deriveEfg(season) ?? mock?.oEFG ?? 0,
          dEFG: mock?.dEFG ?? 0, // CBBD doesn't provide opponent shooting splits easily
          oTOV:
            season && games > 0
              ? round3(season.turnovers / games)
              : espn?.oTOV ?? mock?.oTOV ?? 0,
          dTOV: mock?.dTOV ?? 0,
          oORB:
            season && games > 0
              ? round3(season.offensiveRebounds / games)
              : espn?.oORB ?? mock?.oORB ?? 0,
          dORB:
            season && games > 0
              ? round3(season.defensiveRebounds / games)
              : espn?.dORB ?? mock?.dORB ?? 0,
          oFTR: deriveFtr(season) ?? mock?.oFTR ?? 0,
          dFTR: mock?.dFTR ?? 0,

          // Basic per-game stats: prefer ESPN (real-time) > CBBD season > mock
          ppg:
            (espn?.ppg ||
            (season && games > 0 ? round1(season.points / games) : 0) ||
            mock?.ppg) ??
            0,
          oppg:
            ((season && games > 0
              ? round1(season.opponentPoints / games)
              : 0) ||
            mock?.oppg) ??
            0,
          fgPct:
            (espn?.fgPct ||
            (season && season.fieldGoalsAttempted > 0
              ? round3(
                  season.fieldGoalsMade / season.fieldGoalsAttempted,
                )
              : 0) ||
            mock?.fgPct) ??
            0,
          fg3Pct:
            (espn?.fg3Pct ||
            (season && season.threePointFieldGoalsAttempted > 0
              ? round3(
                  season.threePointFieldGoalsMade /
                    season.threePointFieldGoalsAttempted,
                )
              : 0) ||
            mock?.fg3Pct) ??
            0,
          ftPct:
            (espn?.ftPct ||
            (season && season.freeThrowsAttempted > 0
              ? round3(
                  season.freeThrowsMade / season.freeThrowsAttempted,
                )
              : 0) ||
            mock?.ftPct) ??
            0,
          rpg:
            (espn?.rpg ||
            (season && games > 0
              ? round1(
                  (season.offensiveRebounds + season.defensiveRebounds) /
                    games,
                )
              : 0) ||
            mock?.rpg) ??
            0,
          apg:
            (espn?.apg ||
            (season && games > 0 ? round1(season.assists / games) : 0) ||
            mock?.apg) ??
            0,
          spg:
            (espn?.spg ||
            (season && games > 0 ? round1(season.steals / games) : 0) ||
            mock?.spg) ??
            0,
          bpg:
            (espn?.bpg ||
            (season && games > 0 ? round1(season.blocks / games) : 0) ||
            mock?.bpg) ??
            0,

          // Record: prefer CBBD season > ESPN > mock
          record:
            season && season.wins + season.losses > 0
              ? { wins: season.wins, losses: season.losses }
              : espn?.record?.wins
                ? espn.record
                : mock?.record ?? { wins: 0, losses: 0 },
        };

        result.set(id, stats);
      }

      return result;
    }, TOURNAMENT_TTL);
  } catch (err) {
    console.warn('[tournament] Failed to fetch stats, using mock:', err);
    return MOCK_STATS;
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

/** eFG% = (FGM + 0.5 * 3PM) / FGA */
function deriveEfg(
  season: { fieldGoalsMade: number; threePointFieldGoalsMade: number; fieldGoalsAttempted: number } | undefined,
): number | null {
  if (!season || season.fieldGoalsAttempted === 0) return null;
  return round3(
    (season.fieldGoalsMade + 0.5 * season.threePointFieldGoalsMade) /
      season.fieldGoalsAttempted,
  );
}

/** FTR = FTA / FGA */
function deriveFtr(
  season: { freeThrowsAttempted: number; fieldGoalsAttempted: number } | undefined,
): number | null {
  if (!season || season.fieldGoalsAttempted === 0) return null;
  return round3(season.freeThrowsAttempted / season.fieldGoalsAttempted);
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
