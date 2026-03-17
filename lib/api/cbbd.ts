/**
 * CBBD (College Basketball Data) provider.
 *
 * Reads from a pre-fetched static cache (lib/data/cbbd-cache.json) to avoid
 * API quota issues and network dependencies. The cache was pulled from
 * the CBBD API on 2026-03-17 and contains adjusted ratings, SRS ratings,
 * and full season stats for all D1 teams.
 *
 * To refresh: run `node scripts/refresh-cbbd.js` (or re-fetch manually).
 */

import cbbdCache from '../data/cbbd-cache.json';

interface CbbdCacheTeam {
  team: string;
  conference?: string;
  adjOE?: number;
  adjDE?: number;
  adjEM?: number;
  srsRating?: number;
  games?: number;
  wins?: number;
  losses?: number;
  pace?: number;
  assists?: number;
  blocks?: number;
  steals?: number;
  possessions?: number;
  turnovers?: number;
  fgMade?: number;
  fgAttempted?: number;
  fg3Made?: number;
  fg3Attempted?: number;
  ftMade?: number;
  ftAttempted?: number;
  offReb?: number;
  defReb?: number;
  totalReb?: number;
  points?: number;
  oppPoints?: number;
  oppOffReb?: number;
  oppTurnovers?: number;
  oppFgMade?: number;
  oppFgAttempted?: number;
  oppFg3Made?: number;
  oppFtAttempted?: number;
}

// Build lookup once at import time
const teamsByName = new Map<string, CbbdCacheTeam>();
for (const [key, value] of Object.entries(
  (cbbdCache as { teams: Record<string, CbbdCacheTeam> }).teams,
)) {
  teamsByName.set(key.toLowerCase(), value as CbbdCacheTeam);
}

/** Response shapes expected by tournament.ts */
export interface CbbdAdjustedRating {
  team: string;
  conference: string;
  year: number;
  adjustedOffense: number;
  adjustedDefense: number;
  adjustedTempo: number;
}

export interface CbbdSrsRating {
  team: string;
  conference: string;
  year: number;
  rating: number;
  ranking: number;
  sos: number;
}

export interface CbbdSeasonStats {
  team: string;
  conference: string;
  year: number;
  games: number;
  wins: number;
  losses: number;
  points: number;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  threePointFieldGoalsMade: number;
  threePointFieldGoalsAttempted: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  offensiveRebounds: number;
  defensiveRebounds: number;
  turnovers: number;
  assists: number;
  steals: number;
  blocks: number;
  personalFouls: number;
  opponentPoints: number;
  possessions: number;
}

/**
 * Returns adjusted ratings from the static cache, mapped to the old interface
 * that tournament.ts expects.
 */
export async function getAdjustedRatings(): Promise<CbbdAdjustedRating[]> {
  const result: CbbdAdjustedRating[] = [];
  for (const [, t] of teamsByName) {
    if (t.adjOE == null) continue;
    result.push({
      team: t.team,
      conference: t.conference ?? '',
      year: 2026,
      adjustedOffense: t.adjOE ?? 0,
      adjustedDefense: t.adjDE ?? 0,
      adjustedTempo: t.pace ?? 0,
    });
  }
  return result;
}

/**
 * Returns SRS ratings from the static cache.
 */
export async function getSrsRatings(): Promise<CbbdSrsRating[]> {
  const result: CbbdSrsRating[] = [];
  for (const [, t] of teamsByName) {
    if (t.srsRating == null) continue;
    result.push({
      team: t.team,
      conference: t.conference ?? '',
      year: 2026,
      rating: t.srsRating,
      ranking: 0,
      sos: t.srsRating, // SRS rating approximates SOS
    });
  }
  return result;
}

/**
 * Returns season stats from the static cache.
 */
export async function getTeamSeasonStats(): Promise<CbbdSeasonStats[]> {
  const result: CbbdSeasonStats[] = [];
  for (const [, t] of teamsByName) {
    if (!t.games) continue;
    result.push({
      team: t.team,
      conference: t.conference ?? '',
      year: 2026,
      games: t.games ?? 0,
      wins: t.wins ?? 0,
      losses: t.losses ?? 0,
      points: t.points ?? 0,
      fieldGoalsMade: t.fgMade ?? 0,
      fieldGoalsAttempted: t.fgAttempted ?? 0,
      threePointFieldGoalsMade: t.fg3Made ?? 0,
      threePointFieldGoalsAttempted: t.fg3Attempted ?? 0,
      freeThrowsMade: t.ftMade ?? 0,
      freeThrowsAttempted: t.ftAttempted ?? 0,
      offensiveRebounds: t.offReb ?? 0,
      defensiveRebounds: t.defReb ?? 0,
      turnovers: t.turnovers ?? 0,
      assists: t.assists ?? 0,
      steals: t.steals ?? 0,
      blocks: t.blocks ?? 0,
      personalFouls: 0,
      opponentPoints: t.oppPoints ?? 0,
      possessions: t.possessions ?? 0,
    });
  }
  return result;
}
