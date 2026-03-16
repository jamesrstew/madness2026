import type { TeamStats, GameResult } from '@/lib/types';
import type { CompositeFactors, CompositeWeights, TeamRating } from './types';
import type { CoachProfile } from '@/lib/data/coaching-data';

/**
 * Revised weights after Socratic analysis:
 * - tempo removed (style, not quality — kept only in matchup adjustments)
 * - oEFG/dEFG reduced from 0.09→0.05 each to address multicollinearity with adjEM
 * - adjEM increased to 0.32 as the primary quality signal
 * - variance added at 0.10 to capture performance consistency
 * - recentForm kept at 0.12, coaching at 0.08
 */
export const WEIGHTS: CompositeWeights = {
  adjEM: 0.32,
  oEFG: 0.05,
  dEFG: 0.05,
  tov: 0.07,
  orb: 0.06,
  ftr: 0.05,
  sos: 0.10,
  recentForm: 0.10,
  coaching: 0.10,
  variance: 0.10,
};

/**
 * Calculate a coaching tournament pedigree score.
 * Range: roughly -1 to +7 (gets z-score normalized like all other factors).
 */
export function calculateCoachingScore(coach: CoachProfile): number {
  let score = 0;

  // Final Four experience (tiered)
  if (coach.finalFours >= 4) score += 3.0;
  else if (coach.finalFours >= 2) score += 2.0;
  else if (coach.finalFours >= 1) score += 1.0;

  // Championships (capped at 3.0)
  score += Math.min(coach.championships * 1.5, 3.0);

  // Tournament appearances (tiered)
  if (coach.tournamentAppearances >= 15) score += 1.5;
  else if (coach.tournamentAppearances >= 8) score += 1.0;
  else if (coach.tournamentAppearances >= 3) score += 0.5;

  // First-time penalty
  if (coach.tournamentAppearances <= 1) score -= 1.0;

  return score;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stddev(values: number[], avg: number): number {
  if (values.length < 2) return 1;
  const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance) || 1;
}

/**
 * Calculate performance variance from game results.
 * Returns *negative* stddev of game margins so that lower variance = higher score
 * (consistent teams are rewarded in z-score normalization).
 */
export function calculateVariance(games: GameResult[]): number {
  if (games.length < 3) return 0;
  const margins = games.map((g) => g.score - g.oppScore);
  const avg = margins.reduce((a, b) => a + b, 0) / margins.length;
  const variance = margins.reduce((sum, m) => sum + (m - avg) ** 2, 0) / margins.length;
  // Negate: lower stddev (more consistent) should yield a HIGHER factor value
  return -Math.sqrt(variance);
}

function extractFactors(
  stats: TeamStats,
  recentForm = 0,
  coachingScore = 0,
  varianceScore = 0,
): CompositeFactors {
  return {
    adjEM: stats.adjEM,
    oEFG: stats.oEFG,
    dEFG: -stats.dEFG, // lower defensive eFG% is better, so negate
    tov: -stats.oTOV + stats.dTOV, // fewer own turnovers + more forced turnovers is better
    orb: stats.oORB - stats.dORB, // more own ORB + fewer opponent ORB is better
    ftr: stats.oFTR - stats.dFTR, // more own FT attempts + fewer opponent is better
    sos: stats.sos,
    recentForm,
    coaching: coachingScore,
    variance: varianceScore,
  };
}

/**
 * Adjust weights based on how close the matchup is.
 *
 * In tight matchups (seed diff ≤ 4 or rating gap < 10), intangible factors
 * (coaching, recentForm, variance) are amplified because the talent gap is small
 * and "X-factors" become decisive. In mismatches, raw efficiency dominates.
 *
 * The boost is a smooth function of seed differential:
 * - Seeds 8 vs 9 (diff=1): max boost (1.5x for intangibles)
 * - Seeds 1 vs 16 (diff=15): no boost (standard weights)
 *
 * Weights are renormalized to sum to 1.0 after adjustment.
 */
export function getContextualWeights(
  team1Seed: number,
  team2Seed: number,
): CompositeWeights {
  const seedDiff = Math.abs(team1Seed - team2Seed);

  // Boost factor: max 0.5 (50% boost) for seed diff of 0-1, tapering to 0 at diff ≥ 8
  const boostFactor = Math.max(0, 1 - seedDiff / 8) * 0.5;

  if (boostFactor <= 0) return { ...WEIGHTS };

  const intangibleKeys: (keyof CompositeWeights)[] = ['coaching', 'recentForm', 'variance'];
  const adjusted = { ...WEIGHTS };

  // Boost intangibles
  for (const key of intangibleKeys) {
    adjusted[key] = WEIGHTS[key] * (1 + boostFactor);
  }

  // Renormalize so weights sum to 1.0
  const sum = Object.values(adjusted).reduce((a, b) => a + b, 0);
  const keys = Object.keys(adjusted) as (keyof CompositeWeights)[];
  for (const key of keys) {
    adjusted[key] /= sum;
  }

  return adjusted;
}

export function normalizeToScale(zScore: number, min: number, max: number): number {
  // Map z-score (typically -3 to +3) to [min, max]
  const clamped = Math.max(-3, Math.min(3, zScore));
  return min + ((clamped + 3) / 6) * (max - min);
}

/**
 * @param stats - The team's stats to rate
 * @param allTeamsStats - All teams' stats for z-score normalization context
 * @param recentForm - Recent form score for this team
 * @param coachingScore - Coaching pedigree score for this team
 * @param allCoachingScores - Coaching scores for ALL teams (for z-score normalization).
 *                           When omitted, coaching z-score is computed against a distribution
 *                           of all-zeros, which effectively passes the raw score through.
 * @param varianceScore - Performance variance score for this team (negative stddev of margins)
 * @param allVarianceScores - Variance scores for ALL teams (for z-score normalization).
 */
export function calculateCompositeRating(
  stats: TeamStats,
  allTeamsStats?: TeamStats[],
  recentForm = 0,
  coachingScore = 0,
  allCoachingScores?: number[],
  varianceScore = 0,
  allVarianceScores?: number[],
): TeamRating {
  const factors = extractFactors(stats, recentForm, coachingScore, varianceScore);

  if (!allTeamsStats || allTeamsStats.length < 2) {
    // Without league context, return raw factors scaled simply
    const raw = Object.keys(WEIGHTS).reduce((sum, key) => {
      const k = key as keyof CompositeWeights;
      return sum + factors[k] * WEIGHTS[k];
    }, 0);
    return {
      overall: normalizeToScale(raw, 0, 100),
      offense: normalizeToScale(stats.adjOE / 10, 0, 100),
      defense: normalizeToScale(-stats.adjDE / 10, 0, 100),
      factors,
    };
  }

  // Build per-team coaching and variance scores for the normalization population.
  // Default to zeros when not provided (backward-compatible).
  const popCoaching = allCoachingScores ?? allTeamsStats.map(() => 0);
  const popVariance = allVarianceScores ?? allTeamsStats.map(() => 0);

  // Collect all factor vectors for z-score normalization
  const allFactors = allTeamsStats.map((s, i) =>
    extractFactors(s, 0, popCoaching[i] ?? 0, popVariance[i] ?? 0),
  );
  const keys = Object.keys(WEIGHTS) as (keyof CompositeWeights)[];

  const means: Record<string, number> = {};
  const stddevs: Record<string, number> = {};

  for (const key of keys) {
    const values = allFactors.map((f) => f[key]);
    means[key] = mean(values);
    stddevs[key] = stddev(values, means[key]);
  }

  // Calculate weighted z-score sum
  let weightedSum = 0;
  for (const key of keys) {
    const zScore = (factors[key] - means[key]) / stddevs[key];
    weightedSum += zScore * WEIGHTS[key];
  }

  // Offense/defense sub-ratings
  const allAdjOE = allTeamsStats.map((s) => s.adjOE);
  const allAdjDE = allTeamsStats.map((s) => s.adjDE);
  const oeMean = mean(allAdjOE);
  const oeSd = stddev(allAdjOE, oeMean);
  const deMean = mean(allAdjDE);
  const deSd = stddev(allAdjDE, deMean);

  const offenseZ = (stats.adjOE - oeMean) / oeSd;
  const defenseZ = -(stats.adjDE - deMean) / deSd; // negate: lower DE is better

  return {
    overall: normalizeToScale(weightedSum, 0, 100),
    offense: normalizeToScale(offenseZ, 0, 100),
    defense: normalizeToScale(defenseZ, 0, 100),
    factors,
  };
}
