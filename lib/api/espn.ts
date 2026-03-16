import type { Team } from '../types/team';
import type { TeamStats, GameResult, GameLeader } from '../types/stats';
import { cachedFetch, ESPN_TEAMS_TTL, ESPN_SCORES_TTL } from './cache';

const BASE =
  'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball';

export async function getTeams(): Promise<Team[]> {
  return cachedFetch('espn:teams', async () => {
    const res = await fetch(`${BASE}/teams?limit=400`);
    if (!res.ok) throw new Error(`ESPN teams request failed: ${res.status}`);
    const json = await res.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (json.sports?.[0]?.leagues?.[0]?.teams ?? []).map((entry: any) => {
      const t = entry.team;
      const record = t.record?.items?.[0]?.summary?.split('-') ?? ['0', '0'];
      return {
        id: Number(t.id),
        name: t.displayName,
        shortName: t.shortDisplayName,
        abbreviation: t.abbreviation,
        conference: t.groups?.name ?? '',
        record: { wins: Number(record[0]), losses: Number(record[1]) },
        color: `#${t.color ?? '000000'}`,
        alternateColor: `#${t.alternateColor ?? '333333'}`,
        logo: t.logos?.[0]?.href ?? '',
      } satisfies Team;
    });
  }, ESPN_TEAMS_TTL);
}

export async function getTeamStats(teamId: number): Promise<TeamStats> {
  return cachedFetch(`espn:stats:${teamId}`, async () => {
    const res = await fetch(`${BASE}/teams/${teamId}/statistics`);
    if (!res.ok) throw new Error(`ESPN stats request failed: ${res.status}`);
    const json = await res.json();

    const stats = json.results?.stats?.categories ?? json.categories ?? [];
    const find = (category: string, name: string): number => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cat = stats.find((c: any) => c.name === category);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stat = cat?.stats?.find((s: any) => s.name === name);
      return stat ? Number(stat.value) : 0;
    };

    // Parse record from team summary if available
    const recordSummary = json.results?.team?.record?.items?.[0]?.summary
      ?? json.team?.record?.items?.[0]?.summary;
    const recordParts = recordSummary?.split('-') ?? ['0', '0'];

    return {
      adjOE: 0,
      adjDE: 0,
      adjEM: 0,
      tempo: 0,
      sos: 0,
      oEFG: 0,
      dEFG: 0,
      oTOV: find('general', 'turnovers'),
      dTOV: 0,
      oORB: find('general', 'offRebounds'),
      dORB: find('general', 'defRebounds'),
      oFTR: 0,
      dFTR: 0,
      ppg: find('general', 'avgPoints'),
      oppg: 0,
      fgPct: find('general', 'fieldGoalPct'),
      fg3Pct: find('general', 'threePointFieldGoalPct'),
      ftPct: find('general', 'freeThrowPct'),
      rpg: find('general', 'avgRebounds'),
      apg: find('general', 'avgAssists'),
      spg: find('general', 'avgSteals'),
      bpg: find('general', 'avgBlocks'),
      record: { wins: Number(recordParts[0]), losses: Number(recordParts[1]) },
    } satisfies TeamStats;
  }, ESPN_TEAMS_TTL);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseScore(score: any): number {
  if (score == null) return 0;
  if (typeof score === 'object') return Number(score.value ?? score.displayValue ?? 0);
  return Number(score) || 0;
}

export async function getTeamSchedule(teamId: number): Promise<GameResult[]> {
  return cachedFetch(`espn:schedule:${teamId}`, async () => {
    const res = await fetch(`${BASE}/teams/${teamId}/schedule`);
    if (!res.ok) throw new Error(`ESPN schedule request failed: ${res.status}`);
    const json = await res.json();

    const events = json.events ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return events.flatMap((event: any) => {
      try {
        const competition = event.competitions?.[0];
        if (!competition || competition.status?.type?.name !== 'STATUS_FINAL') return [];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const teamEntry = competition.competitors?.find((c: any) => Number(c.id) === teamId);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const oppEntry = competition.competitors?.find((c: any) => Number(c.id) !== teamId);
        if (!teamEntry || !oppEntry) return [];

        const teamScore = parseScore(teamEntry.score);
        const oppScore = parseScore(oppEntry.score);
        const isWin = teamScore > oppScore;

        // Extract per-game leaders (points, rebounds, assists)
        const leaders: GameLeader[] = [];
        const validCategories = ['points', 'rebounds', 'assists'] as const;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const cat of (teamEntry.leaders ?? []) as any[]) {
          const catName = cat.name as string;
          if (!validCategories.includes(catName as typeof validCategories[number])) continue;
          const top = cat.leaders?.[0];
          if (!top?.athlete) continue;
          leaders.push({
            name: top.athlete.displayName ?? top.athlete.lastName ?? 'Unknown',
            shortName: top.athlete.shortName ?? top.athlete.lastName ?? '',
            value: Number(top.value ?? 0),
            headshot: top.athlete.headshot?.href
              ?? (top.athlete.id ? `https://a.espncdn.com/combiner/i?img=/i/headshots/mens-college-basketball/players/full/${top.athlete.id}.png&w=96&h=70` : undefined),
            category: catName as GameLeader['category'],
          });
        }

        return [{
          date: event.date?.split('T')[0] ?? '',
          opponent: oppEntry.team?.shortDisplayName ?? oppEntry.team?.displayName ?? 'Unknown',
          score: teamScore,
          oppScore,
          location: teamEntry.homeAway === 'home' ? 'home' as const
            : teamEntry.homeAway === 'away' ? 'away' as const
            : 'neutral' as const,
          result: isWin ? 'W' as const : 'L' as const,
          leaders,
        }];
      } catch {
        return [];
      }
    });
  }, ESPN_TEAMS_TTL);
}

export async function getScoreboard(): Promise<unknown> {
  return cachedFetch('espn:scoreboard', async () => {
    const res = await fetch(`${BASE}/scoreboard`);
    if (!res.ok)
      throw new Error(`ESPN scoreboard request failed: ${res.status}`);
    return res.json();
  }, ESPN_SCORES_TTL);
}
