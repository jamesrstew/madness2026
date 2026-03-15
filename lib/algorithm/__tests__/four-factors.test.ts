import { describe, it, expect } from 'vitest';
import { calculateFourFactors, type RawBoxStats } from '@/lib/algorithm/four-factors';

describe('calculateFourFactors', () => {
  it('calculates known eFG% correctly', () => {
    const stats: RawBoxStats = {
      fgm: 30,
      fga: 60,
      fg3m: 10,
      fta: 20,
      tov: 12,
      orb: 10,
      oppDrb: 25,
      oppFgm: 28,
      oppFga: 65,
      oppFg3m: 8,
      oppFta: 18,
      oppTov: 14,
      oppOrb: 8,
      drb: 28,
    };

    const result = calculateFourFactors(stats);

    // oEFG = (30 + 0.5 * 10) / 60 = 35/60 = 0.5833
    expect(result.oEFG).toBeCloseTo(0.5833, 3);

    // dEFG = (28 + 0.5 * 8) / 65 = 32/65 = 0.4923
    expect(result.dEFG).toBeCloseTo(0.4923, 3);

    // oORB = 10 / (10 + 25) = 10/35 = 0.2857
    expect(result.oORB).toBeCloseTo(0.2857, 3);

    // oFTR = 20 / 60 = 0.3333
    expect(result.oFTR).toBeCloseTo(0.3333, 3);
  });

  it('handles zero FGA without crashing', () => {
    const stats: RawBoxStats = {
      fgm: 0,
      fga: 0,
      fg3m: 0,
      fta: 0,
      tov: 0,
      orb: 0,
      oppDrb: 0,
      oppFgm: 0,
      oppFga: 0,
      oppFg3m: 0,
      oppFta: 0,
      oppTov: 0,
      oppOrb: 0,
      drb: 0,
    };

    const result = calculateFourFactors(stats);

    expect(result.oEFG).toBe(0);
    expect(result.dEFG).toBe(0);
    expect(result.oTOV).toBe(0);
    expect(result.dTOV).toBe(0);
    expect(result.oORB).toBe(0);
    expect(result.dORB).toBe(0);
    expect(result.oFTR).toBe(0);
    expect(result.dFTR).toBe(0);
  });
});
