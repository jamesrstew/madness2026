import type { Team } from '@/lib/types/team';
import type { Region, Round, Matchup } from '@/lib/types/bracket';

export const REGIONS: Region[] = ['East', 'West', 'South', 'Midwest'];

export const ROUNDS: Round[] = [
  'FIRST_FOUR',
  'R64',
  'R32',
  'S16',
  'E8',
  'FF',
  'CHAMPIONSHIP',
];

/** Standard seed matchups for each region in R64 (top-to-bottom bracket order) */
export const SEED_MATCHUPS: [number, number][] = [
  [1, 16],
  [8, 9],
  [5, 12],
  [4, 13],
  [6, 11],
  [3, 14],
  [7, 10],
  [2, 15],
];

/**
 * Which regions feed into each Final Four semifinal.
 * Convention: West vs Midwest, South vs East.
 */
const FF_PAIRINGS: [Region, Region][] = [
  ['West', 'Midwest'],
  ['South', 'East'],
];

/** First Four play-in slots: two 16-seed games and two 11-seed games */
interface FirstFourSlot {
  seed: number;
  region: Region;
  label: string; // e.g. "16a", "16b", "11a", "11b"
}

const FIRST_FOUR_SLOTS: FirstFourSlot[] = [
  { seed: 16, region: 'South', label: '16a' },     // Lehigh vs Prairie View A&M
  { seed: 16, region: 'Midwest', label: '16b' },    // UMBC vs Howard
  { seed: 11, region: 'West', label: '11a' },       // NC State vs Texas
  { seed: 11, region: 'Midwest', label: '11b' },    // SMU vs Miami (OH)
];

function matchupId(round: Round, region: Region | undefined, index: number): string {
  if (region) return `${round}-${region}-${index}`;
  return `${round}-${index}`;
}

/**
 * Maps an R64 matchup index to the R32 matchup it feeds into.
 * R64 matchups 0,1 → R32 matchup 0; 2,3 → 1; 4,5 → 2; 6,7 → 3.
 */
function nextRoundIndex(idx: number): number {
  return Math.floor(idx / 2);
}

/** Which slot in the next-round matchup (team1 or team2) based on even/odd index */
function nextRoundSlot(idx: number): 'team1' | 'team2' {
  return idx % 2 === 0 ? 'team1' : 'team2';
}

/**
 * Get the "next matchup" ID that the winner of the given matchup advances to.
 * Returns undefined for the championship winner.
 */
export function getNextMatchupId(id: string): string | undefined {
  const parts = id.split('-');
  const round = parts[0] as Round;

  if (round === 'CHAMPIONSHIP') return undefined;

  if (round === 'FIRST_FOUR') {
    // First Four winners go into specific R64 matchups
    // The index encodes which slot they fill
    const idx = Number(parts[1]);
    const slot = FIRST_FOUR_SLOTS[idx];
    if (!slot) return undefined;
    // 16-seeds go to matchup 0 (1v16), 11-seeds go to matchup 4 (6v11)
    const r64Idx = slot.seed === 16 ? 0 : 4;
    return matchupId('R64', slot.region, r64Idx);
  }

  const region = parts[1] as Region;
  const idx = Number(parts[2]);

  if (round === 'E8') {
    // E8 winners go to Final Four
    const ffIdx = FF_PAIRINGS.findIndex(([r1, r2]) => r1 === region || r2 === region);
    return matchupId('FF', undefined, ffIdx);
  }

  if (round === 'FF') {
    return matchupId('CHAMPIONSHIP', undefined, 0);
  }

  // R64 → R32, R32 → S16, S16 → E8
  const roundOrder: Round[] = ['R64', 'R32', 'S16', 'E8'];
  const roundIdx = roundOrder.indexOf(round);
  const nextRound = roundOrder[roundIdx + 1];
  return matchupId(nextRound, region, nextRoundIndex(idx));
}

/**
 * Which slot (team1 or team2) in the next matchup a winner should fill.
 */
export function getNextMatchupSlot(id: string): 'team1' | 'team2' {
  const parts = id.split('-');
  const round = parts[0] as Round;

  if (round === 'FIRST_FOUR') {
    const idx = Number(parts[1]);
    const slot = FIRST_FOUR_SLOTS[idx];
    // 16-seed play-ins fill the team2 slot (the 16 seed in [1,16])
    // 11-seed play-ins fill the team2 slot (the 11 seed in [6,11])
    return slot?.seed === 16 ? 'team2' : 'team2';
  }

  if (round === 'E8') {
    const region = parts[1] as Region;
    const pairing = FF_PAIRINGS.find(([r1, r2]) => r1 === region || r2 === region);
    if (!pairing) return 'team1';
    return pairing[0] === region ? 'team1' : 'team2';
  }

  if (round === 'FF') {
    const idx = Number(parts[1]);
    return idx === 0 ? 'team1' : 'team2';
  }

  const idx = Number(parts[2]);
  return nextRoundSlot(idx);
}

/**
 * Generate the full initial bracket structure for 68 teams.
 * Teams should have `seed` and `region` set. If teams array is empty,
 * generates empty matchup shells.
 */
export function generateInitialBracket(teams: Team[]): Matchup[] {
  const matchups: Matchup[] = [];

  const findTeam = (region: Region, seed: number): Team | undefined =>
    teams.find((t) => t.region === region && t.seed === seed);

  const findAllTeams = (region: Region, seed: number): Team[] =>
    teams.filter((t) => t.region === region && t.seed === seed);

  // First Four (4 play-in games)
  FIRST_FOUR_SLOTS.forEach((slot, i) => {
    const playInTeams = findAllTeams(slot.region, slot.seed);
    matchups.push({
      id: matchupId('FIRST_FOUR', undefined, i),
      round: 'FIRST_FOUR',
      region: slot.region,
      team1: playInTeams[0],
      team2: playInTeams[1],
    });
  });

  // R64: 8 matchups per region = 32 total
  for (const region of REGIONS) {
    SEED_MATCHUPS.forEach(([seedHi, seedLo], i) => {
      const team1 = findTeam(region, seedHi);
      const team2 = findTeam(region, seedLo);

      // If this matchup receives a First Four winner, leave team2 empty
      const isFirstFourTarget =
        FIRST_FOUR_SLOTS.some((s) => s.region === region && s.seed === seedLo);

      matchups.push({
        id: matchupId('R64', region, i),
        round: 'R64',
        region,
        team1,
        team2: isFirstFourTarget ? undefined : team2,
      });
    });
  }

  // R32: 4 per region
  for (const region of REGIONS) {
    for (let i = 0; i < 4; i++) {
      matchups.push({
        id: matchupId('R32', region, i),
        round: 'R32',
        region,
      });
    }
  }

  // S16: 2 per region
  for (const region of REGIONS) {
    for (let i = 0; i < 2; i++) {
      matchups.push({
        id: matchupId('S16', region, i),
        round: 'S16',
        region,
      });
    }
  }

  // E8: 1 per region
  for (const region of REGIONS) {
    matchups.push({
      id: matchupId('E8', region, 0),
      round: 'E8',
      region,
    });
  }

  // FF: 2 semifinal games
  for (let i = 0; i < 2; i++) {
    matchups.push({
      id: matchupId('FF', undefined, i),
      round: 'FF',
    });
  }

  // Championship
  matchups.push({
    id: matchupId('CHAMPIONSHIP', undefined, 0),
    round: 'CHAMPIONSHIP',
  });

  return matchups;
}
