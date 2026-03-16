import { describe, it, expect } from 'vitest';
import { applySeedCalibration } from '@/lib/algorithm/seed-calibration';

describe('applySeedCalibration', () => {
  it('returns model probability unchanged for same seeds', () => {
    expect(applySeedCalibration(0.55, 8, 8)).toBeCloseTo(0.55);
  });

  it('returns model probability unchanged for missing seeds', () => {
    expect(applySeedCalibration(0.60, 0, 5)).toBeCloseTo(0.60);
  });

  it('nudges 5-over-12 probability toward historical ~65% rate', () => {
    // Model says 5-seed wins 72%. Historical says ~64.9%.
    // Calibration: 0.75 * 0.72 + 0.25 * 0.649 = 0.54 + 0.162 = 0.702
    const calibrated = applySeedCalibration(0.72, 5, 12);
    expect(calibrated).toBeLessThan(0.72); // nudged toward historical
    expect(calibrated).toBeGreaterThan(0.649); // not fully at historical
  });

  it('nudges from underdog perspective correctly', () => {
    // 12-seed's perspective: model says 12 wins 28%, so team1=12, team2=5
    // Historical 5-seed win rate is 0.649, so 12-seed historical = 0.351
    const calibrated = applySeedCalibration(0.28, 12, 5);
    expect(calibrated).toBeGreaterThan(0.28); // 12-seeds historically do better
    expect(calibrated).toBeLessThan(0.351); // but not fully at historical
  });

  it('barely changes 1-over-16 (historical agrees with model)', () => {
    // Model says 1-seed wins 98%. Historical says 99.3%.
    const calibrated = applySeedCalibration(0.98, 1, 16);
    // Calibration: 0.75 * 0.98 + 0.25 * 0.993 = 0.735 + 0.248 = 0.983
    expect(calibrated).toBeCloseTo(0.983, 2);
  });

  it('noticeably adjusts 8-vs-9 toward coin flip', () => {
    // Model says 8-seed wins 60%. Historical says ~52%.
    const calibrated = applySeedCalibration(0.60, 8, 9);
    expect(calibrated).toBeLessThan(0.60);
    expect(calibrated).toBeGreaterThan(0.52);
  });

  it('clamps result to [0.01, 0.99]', () => {
    expect(applySeedCalibration(0.001, 1, 16)).toBeGreaterThanOrEqual(0.01);
    expect(applySeedCalibration(0.999, 1, 16)).toBeLessThanOrEqual(0.99);
  });

  it('returns model as-is for unknown seed matchup', () => {
    // There's no historical data for 1-vs-15 in later rounds at some combos
    const calibrated = applySeedCalibration(0.70, 6, 14);
    // 3-14 exists (mapped via favored=min), so this SHOULD calibrate
    // Actually 6-14 doesn't have data, so model returns as-is
    expect(calibrated).toBeCloseTo(0.70);
  });

  it('is symmetric: team1 favored + team2 favored sum to ~1', () => {
    const prob1 = applySeedCalibration(0.65, 5, 12);
    const prob2 = applySeedCalibration(0.35, 12, 5);
    expect(prob1 + prob2).toBeCloseTo(1.0, 2);
  });
});
