import { describe, it, expect } from 'vitest';
import { deriveMatchupFromChampionshipOdds } from '@/lib/api/markets';
import { findMarketMatch } from '@/lib/data/team-name-mapping';

describe('deriveMatchupFromChampionshipOdds', () => {
  it('returns ~0.5 when both teams have equal championship odds', () => {
    expect(deriveMatchupFromChampionshipOdds(0.10, 0.10)).toBeCloseTo(0.5, 2);
  });

  it('returns high probability when team1 has much higher odds', () => {
    // Duke 12% vs Furman 0.1% → ~99.2% Duke
    const prob = deriveMatchupFromChampionshipOdds(0.12, 0.001);
    expect(prob).toBeGreaterThan(0.98);
    expect(prob).toBeLessThan(1.0);
  });

  it('returns low probability when team1 has much lower odds', () => {
    const prob = deriveMatchupFromChampionshipOdds(0.001, 0.12);
    expect(prob).toBeLessThan(0.02);
    expect(prob).toBeGreaterThan(0.0);
  });

  it('returns 0.5 when both probabilities are 0', () => {
    expect(deriveMatchupFromChampionshipOdds(0, 0)).toBe(0.5);
  });

  it('is symmetric: P(A>B) + P(B>A) = 1', () => {
    const pAB = deriveMatchupFromChampionshipOdds(0.15, 0.05);
    const pBA = deriveMatchupFromChampionshipOdds(0.05, 0.15);
    expect(pAB + pBA).toBeCloseTo(1.0, 10);
  });
});

describe('findMarketMatch', () => {
  it('matches identical names', () => {
    expect(findMarketMatch('Duke', ['Duke', 'Kansas', 'UConn'])).toBe('Duke');
  });

  it('matches case-insensitively', () => {
    expect(findMarketMatch('duke', ['Duke', 'Kansas'])).toBe('Duke');
  });

  // Bug 2 regression: internal name → market alias (the original broken direction)
  it('matches internal name "UConn" to market name "Connecticut"', () => {
    expect(findMarketMatch('UConn', ['Connecticut', 'Duke', 'Kansas'])).toBe('Connecticut');
  });

  // Bug 2 regression: market alias → internal name (other direction)
  it('matches market name "Connecticut" to internal name "UConn"', () => {
    expect(findMarketMatch('Connecticut', ['UConn', 'Duke', 'Kansas'])).toBe('UConn');
  });

  it('matches "St Johns" to "St. John\'s"', () => {
    expect(findMarketMatch('St Johns', ["St. John's", 'Duke'])).toBe("St. John's");
  });

  it('matches "Michigan St" to "Michigan State"', () => {
    expect(findMarketMatch('Michigan St', ['Michigan State', 'Michigan'])).toBe('Michigan State');
  });

  it('returns null when no match found', () => {
    expect(findMarketMatch('Nonexistent U', ['Duke', 'Kansas'])).toBeNull();
  });

  it('uses substring match for names like "Duke Blue Devils"', () => {
    expect(findMarketMatch('Duke Blue Devils', ['Duke', 'Kansas'])).toBe('Duke');
  });

  it('handles "Brigham Young" matching "BYU"', () => {
    expect(findMarketMatch('Brigham Young', ['BYU', 'Duke'])).toBe('BYU');
  });

  it('handles UMBC alias', () => {
    expect(findMarketMatch('Maryland Baltimore County', ['UMBC', 'Duke'])).toBe('UMBC');
  });
});
