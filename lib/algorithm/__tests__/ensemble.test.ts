import { describe, it, expect } from 'vitest';
import { ensembleBlend } from '@/lib/algorithm/ensemble';

describe('ensembleBlend', () => {
  it('blends model and market at default 70/30 split', () => {
    const result = ensembleBlend(0.60, 0.80, true);
    // 0.70 * 0.60 + 0.30 * 0.80 = 0.42 + 0.24 = 0.66
    expect(result.finalProb).toBeCloseTo(0.66, 2);
    expect(result.marketAvailable).toBe(true);
    expect(result.alpha).toBe(0.70);
  });

  it('returns model-only when market unavailable', () => {
    const result = ensembleBlend(0.65, NaN, false);
    expect(result.finalProb).toBeCloseTo(0.65, 2);
    expect(result.marketAvailable).toBe(false);
    expect(result.alpha).toBe(1.0);
  });

  it('returns model-only when marketProb is NaN', () => {
    const result = ensembleBlend(0.55, NaN, true);
    expect(result.finalProb).toBeCloseTo(0.55, 2);
    expect(result.marketAvailable).toBe(false);
  });

  it('clamps to minimum 0.01', () => {
    const result = ensembleBlend(0.0, 0.0, true);
    expect(result.finalProb).toBe(0.01);
  });

  it('clamps to maximum 0.99', () => {
    const result = ensembleBlend(1.0, 1.0, true);
    expect(result.finalProb).toBe(0.99);
  });

  it('supports custom alpha', () => {
    const result = ensembleBlend(0.50, 0.80, true, 0.50);
    // 0.50 * 0.50 + 0.50 * 0.80 = 0.25 + 0.40 = 0.65
    expect(result.finalProb).toBeCloseTo(0.65, 2);
    expect(result.alpha).toBe(0.50);
  });

  it('preserves model and market probabilities in result', () => {
    const result = ensembleBlend(0.70, 0.40, true);
    expect(result.modelProb).toBe(0.70);
    expect(result.marketProb).toBe(0.40);
  });

  it('handles edge case where model and market agree', () => {
    const result = ensembleBlend(0.75, 0.75, true);
    expect(result.finalProb).toBeCloseTo(0.75, 2);
  });

  it('handles edge case where model and market disagree strongly', () => {
    const result = ensembleBlend(0.90, 0.30, true);
    // 0.70 * 0.90 + 0.30 * 0.30 = 0.63 + 0.09 = 0.72
    expect(result.finalProb).toBeCloseTo(0.72, 2);
  });
});
