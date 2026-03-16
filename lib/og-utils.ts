import { getTournamentTeams, getAllTournamentStats } from './api/tournament';
import { MOCK_TEAMS, MOCK_STATS } from './mock-data';
import type { Team } from './types/team';
import type { TeamStats } from './types/stats';

/**
 * OG-image helpers. These run server-side during image generation.
 * They attempt to fetch real data first, falling back to mock.
 */

export async function findTeamsBySlug(
  slug: string,
): Promise<{ team1?: Team; team2?: Team }> {
  const parts = slug.split('-vs-');
  const normalize = (s: string) =>
    decodeURIComponent(s).toLowerCase().replace(/\s+/g, '-');

  let teams: Team[];
  try {
    teams = await getTournamentTeams();
  } catch {
    teams = MOCK_TEAMS;
  }

  return {
    team1: teams.find((t) => normalize(t.shortName) === normalize(parts[0] ?? '')),
    team2: teams.find((t) => normalize(t.shortName) === normalize(parts[1] ?? '')),
  };
}

export async function findTeamById(id: number): Promise<Team | undefined> {
  let teams: Team[];
  try {
    teams = await getTournamentTeams();
  } catch {
    teams = MOCK_TEAMS;
  }
  return teams.find((t) => t.id === id);
}

export async function getTeamStats(id: number): Promise<TeamStats | undefined> {
  try {
    const statsMap = await getAllTournamentStats();
    return statsMap.get(id);
  } catch {
    return MOCK_STATS.get(id);
  }
}

/** Quick server-side win probability using adjEM + log5. */
export async function quickWinProb(
  team1Id: number,
  team2Id: number,
): Promise<number> {
  let statsMap: Map<number, TeamStats>;
  try {
    statsMap = await getAllTournamentStats();
  } catch {
    statsMap = MOCK_STATS;
  }

  const s1 = statsMap.get(team1Id);
  const s2 = statsMap.get(team2Id);
  if (!s1 || !s2) return 0.5;

  const p1 = Math.max(0.01, Math.min(0.99, 0.5 + s1.adjEM / 60));
  const p2 = Math.max(0.01, Math.min(0.99, 0.5 + s2.adjEM / 60));

  // log5 model
  return (p1 * (1 - p2)) / (p1 * (1 - p2) + p2 * (1 - p1));
}

export function ensureHash(color: string): string {
  return color.startsWith('#') ? color : `#${color}`;
}
