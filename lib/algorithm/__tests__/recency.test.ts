import { describe, it, expect } from 'vitest';
import { getDecayWeight, calculateRecentForm } from '@/lib/algorithm/recency';
import type { GameResult } from '@/lib/types';

describe('getDecayWeight', () => {
  it('returns ~1.0 for a game 0 days ago', () => {
    expect(getDecayWeight(0)).toBeCloseTo(1.0);
  });

  it('returns ~0.5 for a game 30 days ago (half-life)', () => {
    expect(getDecayWeight(30)).toBeCloseTo(0.5, 1);
  });

  it('applies 1.5x conference tourney multiplier', () => {
    const base = getDecayWeight(10);
    const conf = getDecayWeight(10, true);
    expect(conf).toBeCloseTo(base * 1.5);
  });
});

describe('calculateRecentForm', () => {
  const referenceDate = new Date('2026-03-15');

  it('returns 0 for empty game list', () => {
    expect(calculateRecentForm([], referenceDate)).toBe(0);
  });

  it('caps margin at ±20', () => {
    const games: GameResult[] = [
      {
        date: '2026-03-15',
        opponent: 'Test',
        score: 100,
        oppScore: 50,
        location: 'home',
        result: 'W',
      },
    ];
    const result = calculateRecentForm(games, referenceDate);
    // Margin is 50 but should be capped at 20
    expect(result).toBeCloseTo(20);
  });

  it('weights recent games more heavily', () => {
    const games: GameResult[] = [
      {
        date: '2026-03-14',
        opponent: 'Recent',
        score: 80,
        oppScore: 70,
        location: 'home',
        result: 'W',
      },
      {
        date: '2026-02-13',
        opponent: 'Old',
        score: 70,
        oppScore: 80,
        location: 'away',
        result: 'L',
      },
    ];
    // Recent win (+10) should outweigh old loss (-10)
    const result = calculateRecentForm(games, referenceDate);
    expect(result).toBeGreaterThan(0);
  });
});
