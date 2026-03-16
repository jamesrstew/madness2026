/**
 * 2026 NCAA Tournament seed and region assignments.
 * Updated with actual Selection Sunday data — March 15, 2026.
 */
import type { Region } from './types/bracket';

export interface SeedAssignment {
  seed: number;
  region: Region;
}

/** ESPN team ID → tournament seed/region */
export const TOURNAMENT_SEEDS: Record<number, SeedAssignment> = {
  // ── East Region ──
  150:  { seed: 1,  region: 'East' },   // Duke
  41:   { seed: 2,  region: 'East' },   // UConn
  127:  { seed: 3,  region: 'East' },   // Michigan State
  2305: { seed: 4,  region: 'East' },   // Kansas
  2599: { seed: 5,  region: 'East' },   // St. John's
  97:   { seed: 6,  region: 'East' },   // Louisville
  26:   { seed: 7,  region: 'East' },   // UCLA
  194:  { seed: 8,  region: 'East' },   // Ohio State
  2628: { seed: 9,  region: 'East' },   // TCU
  2116: { seed: 10, region: 'East' },   // UCF
  58:   { seed: 11, region: 'East' },   // South Florida
  2460: { seed: 12, region: 'East' },   // Northern Iowa
  2856: { seed: 13, region: 'East' },   // California Baptist
  2449: { seed: 14, region: 'East' },   // North Dakota State
  231:  { seed: 15, region: 'East' },   // Furman
  2561: { seed: 16, region: 'East' },   // Siena

  // ── West Region ──
  12:   { seed: 1,  region: 'West' },   // Arizona
  2509: { seed: 2,  region: 'West' },   // Purdue
  2250: { seed: 3,  region: 'West' },   // Gonzaga
  8:    { seed: 4,  region: 'West' },   // Arkansas
  275:  { seed: 5,  region: 'West' },   // Wisconsin
  252:  { seed: 6,  region: 'West' },   // BYU
  2390: { seed: 7,  region: 'West' },   // Miami (FL)
  222:  { seed: 8,  region: 'West' },   // Villanova
  328:  { seed: 9,  region: 'West' },   // Utah State
  142:  { seed: 10, region: 'West' },   // Missouri
  152:  { seed: 11, region: 'West' },   // NC State (First Four)
  251:  { seed: 11, region: 'West' },   // Texas (First Four)
  2272: { seed: 12, region: 'West' },   // High Point
  62:   { seed: 13, region: 'West' },   // Hawaii
  338:  { seed: 14, region: 'West' },   // Kennesaw State
  2511: { seed: 15, region: 'West' },   // Queens
  112358: { seed: 16, region: 'West' }, // Long Island

  // ── South Region ──
  57:   { seed: 1,  region: 'South' },   // Florida
  248:  { seed: 2,  region: 'South' },   // Houston
  356:  { seed: 3,  region: 'South' },   // Illinois
  158:  { seed: 4,  region: 'South' },   // Nebraska
  238:  { seed: 5,  region: 'South' },   // Vanderbilt
  153:  { seed: 6,  region: 'South' },   // North Carolina
  2608: { seed: 7,  region: 'South' },   // Saint Mary's
  228:  { seed: 8,  region: 'South' },   // Clemson
  2294: { seed: 9,  region: 'South' },   // Iowa
  245:  { seed: 10, region: 'South' },   // Texas A&M
  2670: { seed: 11, region: 'South' },   // VCU
  2377: { seed: 12, region: 'South' },   // McNeese
  2653: { seed: 13, region: 'South' },   // Troy
  219:  { seed: 14, region: 'South' },   // Penn
  70:   { seed: 15, region: 'South' },   // Idaho
  2329: { seed: 16, region: 'South' },   // Lehigh (First Four)
  2504: { seed: 16, region: 'South' },   // Prairie View A&M (First Four)

  // ── Midwest Region ──
  130:  { seed: 1,  region: 'Midwest' }, // Michigan
  66:   { seed: 2,  region: 'Midwest' }, // Iowa State
  258:  { seed: 3,  region: 'Midwest' }, // Virginia
  333:  { seed: 4,  region: 'Midwest' }, // Alabama
  2641: { seed: 5,  region: 'Midwest' }, // Texas Tech
  2633: { seed: 6,  region: 'Midwest' }, // Tennessee
  96:   { seed: 7,  region: 'Midwest' }, // Kentucky
  61:   { seed: 8,  region: 'Midwest' }, // Georgia
  139:  { seed: 9,  region: 'Midwest' }, // Saint Louis
  2541: { seed: 10, region: 'Midwest' }, // Santa Clara
  2567: { seed: 11, region: 'Midwest' }, // SMU (First Four)
  193:  { seed: 11, region: 'Midwest' }, // Miami (OH) (First Four)
  2006: { seed: 12, region: 'Midwest' }, // Akron
  2275: { seed: 13, region: 'Midwest' }, // Hofstra
  2750: { seed: 14, region: 'Midwest' }, // Wright State
  2634: { seed: 15, region: 'Midwest' }, // Tennessee State
  2378: { seed: 16, region: 'Midwest' }, // UMBC (First Four)
  47:   { seed: 16, region: 'Midwest' }, // Howard (First Four)
};

/**
 * No duplicate ESPN IDs across regions in the 2026 bracket.
 */
export const DUPLICATE_OVERRIDES: Record<string, { abbreviation: string; shortName: string }> = {};

/** All ESPN IDs that are in the tournament field */
export const TOURNAMENT_TEAM_IDS: number[] = [
  ...new Set(Object.keys(TOURNAMENT_SEEDS).map(Number)),
];
