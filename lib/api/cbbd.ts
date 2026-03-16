import { cachedFetch, CBBD_TTL } from './cache';

const BASE = 'https://api.collegebasketballdata.com';

/** Response shape from CBBD /ratings/adjusted endpoint */
export interface CbbdAdjustedRating {
  team: string;
  conference: string;
  year: number;
  rating: number;          // overall SRS-style rating
  adjustedOffense: number; // adjOE (points per 100 possessions)
  adjustedDefense: number; // adjDE (points per 100 possessions)
  adjustedTempo: number;   // possessions per 40 minutes
}

/** Response shape from CBBD /stats/season endpoint */
export interface CbbdSeasonStats {
  team: string;
  conference: string;
  year: number;
  games: number;
  wins: number;
  losses: number;
  // offensive
  points: number;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  threePointFieldGoalsMade: number;
  threePointFieldGoalsAttempted: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  offensiveRebounds: number;
  turnovers: number;
  assists: number;
  // defensive
  opponentPoints: number;
  defensiveRebounds: number;
  steals: number;
  blocks: number;
  personalFouls: number;
  // possessions & tempo
  possessions: number;
  // derived fields may vary; we compute what we need
}

/** Response shape from CBBD /ratings/srs endpoint */
export interface CbbdSrsRating {
  team: string;
  conference: string;
  year: number;
  rating: number;            // SRS rating
  ranking: number;
  sos: number;               // strength of schedule
}

function hasApiKey(): boolean {
  return !!process.env.CBBD_API_KEY;
}

function headers(): HeadersInit {
  return {
    Authorization: `Bearer ${process.env.CBBD_API_KEY}`,
    Accept: 'application/json',
  };
}

async function cbbdFetch<T>(path: string, key: string): Promise<T | null> {
  if (!hasApiKey()) return null;
  try {
    return await cachedFetch(
      key,
      async () => {
        const res = await fetch(`${BASE}${path}`, { headers: headers() });
        if (!res.ok) throw new Error(`CBBD request failed: ${res.status} ${path}`);
        return res.json() as Promise<T>;
      },
      CBBD_TTL,
    );
  } catch (err) {
    console.warn(`[CBBD] Failed to fetch ${path}:`, err);
    return null;
  }
}

export async function getAdjustedRatings(
  year = 2026,
): Promise<CbbdAdjustedRating[] | null> {
  return cbbdFetch<CbbdAdjustedRating[]>(
    `/ratings/adjusted?year=${year}`,
    `cbbd:adjusted:${year}`,
  );
}

export async function getSrsRatings(
  year = 2026,
): Promise<CbbdSrsRating[] | null> {
  return cbbdFetch<CbbdSrsRating[]>(
    `/ratings/srs?year=${year}`,
    `cbbd:srs:${year}`,
  );
}

export async function getTeamSeasonStats(
  year = 2026,
): Promise<CbbdSeasonStats[] | null> {
  return cbbdFetch<CbbdSeasonStats[]>(
    `/stats/season?year=${year}`,
    `cbbd:seasonStats:${year}`,
  );
}

export async function getTeamGames(
  team: string,
  year = 2026,
): Promise<unknown> {
  return cbbdFetch(
    `/games?year=${year}&team=${encodeURIComponent(team)}`,
    `cbbd:games:${team}:${year}`,
  );
}
