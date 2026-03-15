import { describe, it, expect } from 'vitest';
import { WEIGHTS, normalizeToScale } from '@/lib/algorithm/composite-rating';

describe('WEIGHTS', () => {
  it('sums to 1.0', () => {
    const sum = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0);
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
