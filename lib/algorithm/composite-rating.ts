import type { TeamStats } from '@/lib/types';
import type { CompositeFactors, CompositeWeights, TeamRating } from './types';

export const WEIGHTS: CompositeWeights = {
  adjEM: 0.30,
  oEFG: 0.10,
  dEFG: 0.10,
  tov: 0.08,
  orb: 0.07,
  ftr: 0.05,
  tempo: 0.08,
  sos: 0.10,
  recentForm: 0.12,
};

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stddev(values: number[], avg: number): number {
  if (values.length < 2) return 1;
  const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance) || 1;
}

function extractFactors(stats: TeamStats, recentForm = 0): CompositeFactors {
  return {
    adjEM: stats.adjEM,
    oEFG: stats.oEFG,
    dEFG: -stats.dEFG, // lower defensive eFG% is better, so negate
    tov: -stats.oTOV + stats.dTOV, // fewer own turnovers + more forced turnovers is better
    orb: stats.oORB - stats.dORB, // more own ORB + fewer opponent ORB is better
    ftr: stats.oFTR - stats.dFTR, // more own FT attempts + fewer opponent is better
    tempo: stats.tempo,
    sos: stats.sos,
    recentForm,
  };
}

export function normalizeToScale(zScore: number, min: number, max: number): number {
  // Map z-score (typically -3 to +3) to [min, max]
  const clamped = Math.max(-3, Math.min(3, zScore));
  return min + ((clamped + 3) / 6) * (max - min);
}

export function calculateCompositeRating(
  stats: TeamStats,
  allTeamsStats?: TeamStats[],
  recentForm = 0,
): TeamRating {
  const factors = extractFactors(stats, recentForm);

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

  // Collect all factor vectors for z-score normalization
  const allFactors = allTeamsStats.map((s) => extractFactors(s, 0));
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
