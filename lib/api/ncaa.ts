import { cachedFetch, ESPN_SCORES_TTL, ESPN_TEAMS_TTL } from './cache';

const BASE = 'https://ncaa-api.henrygd.me';

export async function getScoreboard(): Promise<unknown> {
  return cachedFetch('ncaa:scoreboard', async () => {
    const res = await fetch(`${BASE}/scoreboard/basketball-men/d1`);
    if (!res.ok)
      throw new Error(`NCAA scoreboard request failed: ${res.status}`);
    return res.json();
  }, ESPN_SCORES_TTL);
}

export async function getRankings(): Promise<unknown> {
  return cachedFetch('ncaa:rankings', async () => {
    const res = await fetch(`${BASE}/rankings/basketball-men/d1`);
    if (!res.ok)
      throw new Error(`NCAA rankings request failed: ${res.status}`);
    return res.json();
  }, ESPN_TEAMS_TTL);
}
