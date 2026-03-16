/**
 * Shared utility for computing season leaders from game-by-game data.
 *
 * Used by both the SeasonLeaders UI component and the health algorithm.
 */

import type { GameResult, SeasonLeader } from '@/lib/types/stats';

const CATEGORIES = [
  { key: 'points' as const },
  { key: 'rebounds' as const },
  { key: 'assists' as const },
];

/**
 * Compute the season leader for each category (points, rebounds, assists)
 * by tallying how many games each player led the team.
 */
export function computeLeaders(games: GameResult[]): SeasonLeader[] {
  const finishedGames = games.filter((g) => g.leaders && g.leaders.length > 0);
  const totalGames = finishedGames.length;
  if (totalGames === 0) return [];

  const leaders: SeasonLeader[] = [];

  for (const cat of CATEGORIES) {
    // Tally how many times each player led the team in this category + their total
    const playerMap = new Map<
      string,
      { name: string; shortName: string; headshot?: string; gamesLed: number; totalValue: number }
    >();

    for (const game of finishedGames) {
      const leader = game.leaders?.find((l) => l.category === cat.key);
      if (!leader) continue;

      const existing = playerMap.get(leader.name);
      if (existing) {
        existing.gamesLed += 1;
        existing.totalValue += leader.value;
      } else {
        playerMap.set(leader.name, {
          name: leader.name,
          shortName: leader.shortName,
          headshot: leader.headshot,
          gamesLed: 1,
          totalValue: leader.value,
        });
      }
    }

    // Pick the player who led the most games
    let best: (typeof playerMap extends Map<string, infer V> ? V : never) | null = null;
    for (const player of playerMap.values()) {
      if (
        !best ||
        player.gamesLed > best.gamesLed ||
        (player.gamesLed === best.gamesLed && player.totalValue > best.totalValue)
      ) {
        best = player;
      }
    }

    if (best) {
      leaders.push({
        ...best,
        category: cat.key,
      });
    }
  }

  return leaders;
}
