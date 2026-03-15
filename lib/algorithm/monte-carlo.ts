import type { Team, TeamStats } from '@/lib/types';
import type { SimulationResult } from './types';
import { log5 } from './log5';
import { calculateMatchupAdjustment } from './matchup';
import { calculateCompositeRating } from './composite-rating';

const DEFAULT_ITERATIONS = 10_000;

function getWinProbability(
  team1: Team,
  team2: Team,
  statsMap: Map<number, TeamStats>,
  allStats: TeamStats[],
): number {
  const s1 = statsMap.get(team1.id);
  const s2 = statsMap.get(team2.id);

  if (!s1 || !s2) return 0.5;

  const r1 = calculateCompositeRating(s1, allStats);
  const r2 = calculateCompositeRating(s2, allStats);

  // Convert overall rating (0-100) to win probability proxy
  const pA = Math.max(0.01, Math.min(0.99, r1.overall / 100));
  const pB = Math.max(0.01, Math.min(0.99, r2.overall / 100));

  const base = log5(pA, pB);

  const { team1Adj, team2Adj } = calculateMatchupAdjustment(s1, s2);
  const adjusted = Math.max(0.01, Math.min(0.99, base + team1Adj + team2Adj));

  return adjusted;
}

interface BracketSlot {
  team: Team;
  seed: number;
}

function simulateRound(
  slots: BracketSlot[],
  statsMap: Map<number, TeamStats>,
  allStats: TeamStats[],
): BracketSlot[] {
  const winners: BracketSlot[] = [];
  for (let i = 0; i < slots.length; i += 2) {
    const t1 = slots[i];
    const t2 = slots[i + 1];
    if (!t1 || !t2) {
      winners.push(t1 || t2);
      continue;
    }
    const prob = getWinProbability(t1.team, t2.team, statsMap, allStats);
    const winner = Math.random() < prob ? t1 : t2;
    winners.push(winner);
  }
  return winners;
}

export function simulateBracket(
  teams: Team[],
  stats: Map<number, TeamStats>,
  iterations: number = DEFAULT_ITERATIONS,
): Map<number, SimulationResult> {
  const results = new Map<number, SimulationResult>();
  const allStats = Array.from(stats.values());

  // Initialize results
  for (const team of teams) {
    results.set(team.id, {
      championshipPct: 0,
      finalFourPct: 0,
      eliteEightPct: 0,
      sweetSixteenPct: 0,
    });
  }

  if (teams.length === 0) return results;

  // Build initial bracket slots ordered by seed
  const slots: BracketSlot[] = teams.map((t) => ({
    team: t,
    seed: t.seed ?? 16,
  }));

  // Determine round count (64 teams = 6 rounds)
  const totalTeams = slots.length;
  const totalRounds = Math.ceil(Math.log2(totalTeams));

  // Round thresholds (for 64-team bracket):
  // After round 3 (16 left) = Sweet 16
  // After round 4 (8 left) = Elite 8
  // After round 5 (4 left) = Final Four
  // After round 6 (1 left) = Champion
  const s16Round = totalRounds - 3; // round index where Sweet 16 survivors are determined
  const e8Round = totalRounds - 2;
  const ffRound = totalRounds - 1;
  const champRound = totalRounds;

  for (let iter = 0; iter < iterations; iter++) {
    let current = [...slots];

    for (let round = 1; round <= totalRounds; round++) {
      current = simulateRound(current, stats, allStats);

      const survivingIds = current.map((s) => s.team.id);

      if (round === s16Round) {
        for (let i = 0; i < survivingIds.length; i++) {
          const r = results.get(survivingIds[i])!;
          r.sweetSixteenPct++;
        }
      }
      if (round === e8Round) {
        for (let i = 0; i < survivingIds.length; i++) {
          const r = results.get(survivingIds[i])!;
          r.eliteEightPct++;
        }
      }
      if (round === ffRound) {
        for (let i = 0; i < survivingIds.length; i++) {
          const r = results.get(survivingIds[i])!;
          r.finalFourPct++;
        }
      }
      if (round === champRound && current.length === 1) {
        const r = results.get(current[0].team.id)!;
        r.championshipPct++;
      }
    }
  }

  // Convert counts to percentages
  const allResults = Array.from(results.values());
  for (let i = 0; i < allResults.length; i++) {
    const result = allResults[i];
    result.sweetSixteenPct = (result.sweetSixteenPct / iterations) * 100;
    result.eliteEightPct = (result.eliteEightPct / iterations) * 100;
    result.finalFourPct = (result.finalFourPct / iterations) * 100;
    result.championshipPct = (result.championshipPct / iterations) * 100;
  }

  return results;
}
