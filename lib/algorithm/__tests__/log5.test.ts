import { describe, it, expect } from 'vitest';
import { log5 } from '@/lib/algorithm/log5';

describe('log5', () => {
  it('returns 0.5 for two equally matched teams', () => {
    expect(log5(0.5, 0.5)).toBeCloseTo(0.5);
  });

  it('returns ~0.988 for 0.9 vs 0.1', () => {
    const result = log5(0.9, 0.1);
    expect(result).toBeCloseTo(0.988, 2);
  });

  it('satisfies symmetry: log5(a,b) + log5(b,a) = 1.0', () => {
    const pairs = [
      [0.7, 0.3],
      [0.9, 0.1],
      [0.6, 0.5],
      [0.85, 0.45],
    ];
    for (const [a, b] of pairs) {
      expect(log5(a, b) + log5(b, a)).toBeCloseTo(1.0);
    }
  });

  it('clamps very small values to avoid division by zero', () => {
    const result = log5(0, 0.5);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(1);
    expect(Number.isFinite(result)).toBe(true);
  });

  it('clamps very large values correctly', () => {
    const result = log5(1.0, 0.5);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(1);
    expect(Number.isFinite(result)).toBe(true);
  });

  it('handles both values at extremes', () => {
    const result = log5(0, 1);
    expect(Number.isFinite(result)).toBe(true);
    expect(result).toBeGreaterThan(0);
  });
});
