import { cachedFetch, CBBD_TTL } from './cache';

const BASE = 'https://api.collegebasketballdata.com';

function headers(): HeadersInit {
  const key = process.env.CBBD_API_KEY;
  if (!key) throw new Error('CBBD_API_KEY environment variable is not set');
  return {
    Authorization: `Bearer ${key}`,
    Accept: 'application/json',
  };
}

async function cbbdFetch<T>(path: string, key: string): Promise<T> {
  return cachedFetch(
    key,
    async () => {
      const res = await fetch(`${BASE}${path}`, { headers: headers() });
      if (!res.ok) throw new Error(`CBBD request failed: ${res.status} ${path}`);
      return res.json() as Promise<T>;
    },
    CBBD_TTL,
  );
}

export async function getAdjustedRatings(year = 2026): Promise<unknown> {
  return cbbdFetch(
    `/ratings/adjusted?year=${year}`,
    `cbbd:adjusted:${year}`,
  );
}

export async function getSrsRatings(year = 2026): Promise<unknown> {
  return cbbdFetch(`/ratings/srs?year=${year}`, `cbbd:srs:${year}`);
}

export async function getTeamSeasonStats(year = 2026): Promise<unknown> {
  return cbbdFetch(
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
