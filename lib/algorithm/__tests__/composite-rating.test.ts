import { describe, it, expect } from 'vitest';
import {
  WEIGHTS,
  normalizeToScale,
  calculateCoachingScore,
  calculateVariance,
  getContextualWeights,
} from '@/lib/algorithm/composite-rating';
import type { CompositeWeights } from '@/lib/algorithm/types';

describe('WEIGHTS', () => {
  it('sums to 1.0', () => {
    const sum = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0);
  });

  it('does not include tempo (removed — style not quality)', () => {
    expect('tempo' in WEIGHTS).toBe(false);
  });

  it('includes variance weight at 10%', () => {
    expect(WEIGHTS.variance).toBeCloseTo(0.10);
  });

  it('has 10 factors', () => {
    expect(Object.keys(WEIGHTS)).toHaveLength(10);
  });

  it('adjEM is the dominant factor', () => {
    const keys = Object.keys(WEIGHTS) as (keyof CompositeWeights)[];
    for (const key of keys) {
      if (key !== 'adjEM') {
        expect(WEIGHTS.adjEM).toBeGreaterThan(WEIGHTS[key]);
      }
    }
  });

  it('oEFG and dEFG are reduced to avoid multicollinearity with adjEM', () => {
    expect(WEIGHTS.oEFG).toBeLessThanOrEqual(0.06);
    expect(WEIGHTS.dEFG).toBeLessThanOrEqual(0.06);
  });
});

describe('calculateCoachingScore', () => {
  it('gives high score to elite tournament coach', () => {
    const score = calculateCoachingScore({
      name: 'Test Coach',
      tournamentAppearances: 25,
      sweetSixteens: 10,
      finalFours: 5,
      championships: 2,
      yearsAsHeadCoach: 30,
    });
    // +3.0 (FF>=4) + 3.0 (champ*1.5 capped) + 1.5 (app>=15) = 7.5
    expect(score).toBeCloseTo(7.5);
  });

  it('penalizes first-time tournament coach', () => {
    const score = calculateCoachingScore({
      name: 'Rookie Coach',
      tournamentAppearances: 1,
      sweetSixteens: 0,
      finalFours: 0,
      championships: 0,
      yearsAsHeadCoach: 2,
    });
    expect(score).toBe(-1.0);
  });

  it('gives moderate score to mid-career coach', () => {
    const score = calculateCoachingScore({
      name: 'Mid Coach',
      tournamentAppearances: 8,
      sweetSixteens: 3,
      finalFours: 1,
      championships: 0,
      yearsAsHeadCoach: 12,
    });
    // +1.0 (FF>=1) + 0 (champ) + 1.0 (app>=8) = 2.0
    expect(score).toBeCloseTo(2.0);
  });
});

describe('normalizeToScale', () => {
  it('maps z-score 0 to midpoint', () => {
    expect(normalizeToScale(0, 0, 100)).toBeCloseTo(50);
  });

  it('maps z-score -3 to min', () => {
    expect(normalizeToScale(-3, 0, 100)).toBeCloseTo(0);
  });

  it('maps z-score +3 to max', () => {
    expect(normalizeToScale(3, 0, 100)).toBeCloseTo(100);
  });

  it('clamps values beyond ±3', () => {
    expect(normalizeToScale(-10, 0, 100)).toBeCloseTo(0);
    expect(normalizeToScale(10, 0, 100)).toBeCloseTo(100);
  });

  it('works with custom range', () => {
    expect(normalizeToScale(0, 20, 80)).toBeCloseTo(50);
  });
});

describe('calculateVariance', () => {
  it('returns 0 for fewer than 3 games', () => {
    expect(calculateVariance([])).toBe(0);
    expect(calculateVariance([
      { date: '2026-01-01', opponent: 'A', score: 80, oppScore: 70, location: 'home', result: 'W' },
    ])).toBe(0);
  });

  it('returns 0 (negative stddev) for perfectly consistent team', () => {
    const games = Array.from({ length: 10 }, () => ({
      date: '2026-01-01',
      opponent: 'Opp',
      score: 75,
      oppScore: 70,
      location: 'home' as const,
      result: 'W' as const,
    }));
    // All margins are +5, stddev = 0, so -0 = 0
    expect(calculateVariance(games)).toBe(-0);
  });

  it('returns a negative value for inconsistent team (lower is worse)', () => {
    const games = [
      { date: '2026-01-01', opponent: 'A', score: 90, oppScore: 50, location: 'home' as const, result: 'W' as const },
      { date: '2026-01-02', opponent: 'B', score: 60, oppScore: 80, location: 'away' as const, result: 'L' as const },
      { date: '2026-01-03', opponent: 'C', score: 100, oppScore: 60, location: 'home' as const, result: 'W' as const },
      { date: '2026-01-04', opponent: 'D', score: 55, oppScore: 70, location: 'away' as const, result: 'L' as const },
    ];
    // Margins: +40, -20, +40, -15 → high stddev → large negative number
    const variance = calculateVariance(games);
    expect(variance).toBeLessThan(-10);
  });

  it('consistent team scores better than inconsistent team', () => {
    const consistent = Array.from({ length: 10 }, () => ({
      date: '2026-01-01', opponent: 'Opp', score: 75, oppScore: 70,
      location: 'home' as const, result: 'W' as const,
    }));
    const volatile = [
      { date: '2026-01-01', opponent: 'A', score: 90, oppScore: 50, location: 'home' as const, result: 'W' as const },
      { date: '2026-01-02', opponent: 'B', score: 55, oppScore: 80, location: 'away' as const, result: 'L' as const },
      { date: '2026-01-03', opponent: 'C', score: 95, oppScore: 60, location: 'home' as const, result: 'W' as const },
    ];
    // Consistent team has higher (less negative) variance score
    expect(calculateVariance(consistent)).toBeGreaterThan(calculateVariance(volatile));
  });
});

describe('getContextualWeights', () => {
  it('returns base weights for large seed differential (1 vs 16)', () => {
    const weights = getContextualWeights(1, 16);
    expect(weights.adjEM).toBeCloseTo(WEIGHTS.adjEM, 2);
    expect(weights.coaching).toBeCloseTo(WEIGHTS.coaching, 2);
  });

  it('boosts intangibles for tight matchups (8 vs 9)', () => {
    const weights = getContextualWeights(8, 9);
    // Coaching, recentForm, variance should all be boosted
    expect(weights.coaching).toBeGreaterThan(WEIGHTS.coaching);
    expect(weights.recentForm).toBeGreaterThan(WEIGHTS.recentForm);
    expect(weights.variance).toBeGreaterThan(WEIGHTS.variance);
  });

  it('still sums to 1.0 after contextual adjustment', () => {
    const weights = getContextualWeights(5, 12);
    const sum = Object.values(weights).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0);
  });

  it('returns base weights for same seed (no boost needed)', () => {
    const weights = getContextualWeights(4, 4);
    // Seed diff 0 → max boost, but still sums to 1
    const sum = Object.values(weights).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0);
    // Intangibles should be significantly boosted
    expect(weights.coaching).toBeGreaterThan(WEIGHTS.coaching);
  });

  it('moderate boost for mid-range seed differential (4 vs 5)', () => {
    const tight = getContextualWeights(4, 5);
    const wide = getContextualWeights(1, 16);
    // Tight matchup should have more coaching weight than wide
    expect(tight.coaching).toBeGreaterThan(wide.coaching);
  });
});
