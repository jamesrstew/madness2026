/**
 * Key player availability / team health assessment.
 *
 * Detects when a team's star players stop appearing in recent game leader
 * data — a strong proxy for injury or suspension. Adjusts prediction
 * probability by up to ±4%.
 *
 * Applied post-log5, between location adjustment and market ensemble blend.
 */

import type { GameResult } from '@/lib/types/stats';
import type {
  PlayerHealthAssessment,
  TeamHealthAssessment,
  PlayerStatus,
  TeamHealthStatus,
} from '@/lib/types/stats';
import { computeLeaders } from '@/lib/leaders';

const MAX_HEALTH_ADJ = 0.08; // ±8% max adjustment (increased from 4% — Socratic analysis found star injuries worth 10-15%)
export const RECENCY_WINDOW = 5; // last 5 games
const MIN_GAMES_FOR_ANALYSIS = 8; // need at least 8 games with leader data

const CATEGORY_WEIGHTS: Record<string, number> = {
  points: 0.55,
  rebounds: 0.25,
  assists: 0.20,
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Count how many times a player appears as leader in a category
 * within the last N finished games (most recent first).
 */
function countRecentAppearances(
  games: GameResult[],
  playerName: string,
  category: 'points' | 'rebounds' | 'assists',
  window: number,
): number {
  const finishedGames = games.filter((g) => g.leaders && g.leaders.length > 0);
  const recent = finishedGames.slice(-window);
  let count = 0;
  for (const game of recent) {
    const leader = game.leaders?.find((l) => l.category === category);
    if (leader && leader.name === playerName) {
      count++;
    }
  }
  return count;
}

/**
 * Assess team health based on the availability of key players in recent
 * games. Returns a health score (0-1) and per-player assessments.
 *
 * Graceful degradation: if fewer than 8 games have leader data,
 * returns score=1.0, status='unknown' — no adjustment applied.
 */
export function assessTeamHealth(games: GameResult[]): TeamHealthAssessment {
  const finishedGames = games.filter((g) => g.leaders && g.leaders.length > 0);
  const totalGamesWithData = finishedGames.length;

  // Not enough data — assume healthy
  if (totalGamesWithData < MIN_GAMES_FOR_ANALYSIS) {
    return { score: 1.0, status: 'unknown', players: [] };
  }

  const leaders = computeLeaders(games);
  const players: PlayerHealthAssessment[] = [];
  let totalImpact = 0;

  for (const leader of leaders) {
    const dominance = leader.gamesLed / totalGamesWithData;
    const expectedRecent = dominance * RECENCY_WINDOW;
    const recentAppearances = countRecentAppearances(
      games,
      leader.name,
      leader.category,
      RECENCY_WINDOW,
    );

    const absenceRatio =
      expectedRecent > 0
        ? clamp(1 - recentAppearances / expectedRecent, 0, 1)
        : 0;

    const catWeight = CATEGORY_WEIGHTS[leader.category] ?? 0;
    const impact = absenceRatio * catWeight * clamp(dominance * 1.5, 0, 1);
    totalImpact += impact;

    let status: PlayerStatus;
    if (absenceRatio >= 0.8) {
      status = 'likely_out';
    } else if (absenceRatio >= 0.4) {
      status = 'questionable';
    } else {
      status = 'available';
    }

    players.push({
      name: leader.name,
      shortName: leader.shortName,
      headshot: leader.headshot,
      category: leader.category,
      gamesLed: leader.gamesLed,
      totalGamesWithData,
      recentAppearances,
      dominance,
      absenceRatio,
      impact,
      status,
    });
  }

  const score = clamp(1.0 - totalImpact, 0, 1);

  let status: TeamHealthStatus;
  if (score >= 0.95) {
    status = 'healthy';
  } else if (score >= 0.80) {
    status = 'minor_concern';
  } else if (score >= 0.60) {
    status = 'degraded';
  } else {
    status = 'significant_concern';
  }

  return { score, status, players };
}

export interface HealthAdjustmentResult {
  team1Adj: number;
  team2Adj: number;
}

/**
 * Calculate the health-based probability adjustment for a matchup.
 *
 * The adjustment is differential: if both teams are equally healthy,
 * it cancels to zero. Max adjustment is ±4%.
 *
 * Returns { team1Adj: 0, team2Adj: 0 } when either team has unknown status.
 */
export function calculateHealthAdjustment(
  health1: TeamHealthAssessment,
  health2: TeamHealthAssessment,
): HealthAdjustmentResult {
  // No adjustment if either team lacks sufficient data
  if (health1.status === 'unknown' || health2.status === 'unknown') {
    return { team1Adj: 0, team2Adj: 0 };
  }

  const rawDiff = health1.score - health2.score;
  const team1Adj = rawDiff * MAX_HEALTH_ADJ;
  const team2Adj = -rawDiff * MAX_HEALTH_ADJ;

  return {
    team1Adj: clamp(team1Adj, -MAX_HEALTH_ADJ, MAX_HEALTH_ADJ),
    team2Adj: clamp(team2Adj, -MAX_HEALTH_ADJ, MAX_HEALTH_ADJ),
  };
}
