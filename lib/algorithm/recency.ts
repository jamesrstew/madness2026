import type { GameResult } from '@/lib/types';

const HALF_LIFE_DAYS = 30;
const LAMBDA = Math.LN2 / HALF_LIFE_DAYS;
const CONF_TOURNEY_MULTIPLIER = 1.5;
const MARGIN_CAP = 20;

export function getDecayWeight(daysAgo: number, isConfTourney = false): number {
  const base = Math.exp(-LAMBDA * daysAgo);
  return isConfTourney ? base * CONF_TOURNEY_MULTIPLIER : base;
}

function capMargin(margin: number): number {
  return Math.max(-MARGIN_CAP, Math.min(MARGIN_CAP, margin));
}

export function calculateRecentForm(
  games: GameResult[],
  referenceDate: Date = new Date(),
): number {
  if (games.length === 0) return 0;

  let weightedSum = 0;
  let totalWeight = 0;

  for (const game of games) {
    const gameDate = new Date(game.date);
    const daysAgo = (referenceDate.getTime() - gameDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysAgo < 0) continue;

    const margin = capMargin(game.score - game.oppScore);
    const weight = getDecayWeight(daysAgo);

    weightedSum += margin * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}
