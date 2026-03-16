import type { Team, TeamStats } from '@/lib/types';
import type { Region } from '@/lib/types/bracket';
import type { SimulationResult, TeamRating } from './types';
import { log5 } from './log5';
import { calculateMatchupAdjustment } from './matchup';
import { calculateCompositeRating, calculateCoachingScore, calculateVariance, getContextualWeights } from './composite-rating';
import { calculateLocationAdvantage } from './location';
import { applySeedCalibration } from './seed-calibration';
import { COACH_DATA } from '@/lib/data/coaching-data';

const DEFAULT_ITERATIONS = 10_000;

/**
 * Map a round index (1-based) and total rounds to the tournament round name.
 * Used to look up venue locations for location advantage.
 */
function getRoundName(roundIndex: number, totalRounds: number): string {
  const roundsFromEnd = totalRounds - roundIndex;
  switch (roundsFromEnd) {
    case 5: return 'R64';
    case 4: return 'R32';
    case 3: return 'S16';
    case 2: return 'E8';
    case 1: return 'FF';
    case 0: return 'CHAMPIONSHIP';
    default: return 'R64';
  }
}

/**
 * Pre-computed data for a team, calculated once before the simulation loop.
 * Avoids recomputing composite ratings + coaching scores on every matchup.
 */
interface PrecomputedTeamData {
  rating: TeamRating;
  pWin: number; // rating.overall/100 clamped to [0.01, 0.99]
}

/**
 * Bayesian update of a team's pWin after winning a game.
 *
 * When a team beats a stronger opponent, their rating should increase;
 * when they beat a weaker opponent, minimal change. This captures the
 * information revealed by tournament results within a simulation run.
 *
 * Uses a lightweight Bayesian shift: the update magnitude is proportional
 * to the "surprise" of the outcome (beating a strong team = more update).
 */
const BAYESIAN_LEARNING_RATE = 0.03;

function bayesianUpdate(winnerPWin: number, loserPWin: number): number {
  // How surprising was this win? If winner was the underdog, big update.
  // surprise = loser's strength relative to winner's
  const surprise = loserPWin / (winnerPWin + loserPWin);
  // Shift proportional to surprise: beating a 0.9-rated team as a 0.5 team → big shift
  const shift = BAYESIAN_LEARNING_RATE * (surprise - 0.5);
  return Math.max(0.01, Math.min(0.99, winnerPWin + shift));
}

function getWinProbability(
  team1: Team,
  team2: Team,
  precomputed: Map<number, PrecomputedTeamData>,
  statsMap: Map<number, TeamStats>,
  roundName?: string,
): number {
  const pre1 = precomputed.get(team1.id);
  const pre2 = precomputed.get(team2.id);

  if (!pre1 || !pre2) return 0.5;

  const base = log5(pre1.pWin, pre2.pWin);

  const s1 = statsMap.get(team1.id);
  const s2 = statsMap.get(team2.id);
  let adjusted = base;
  if (s1 && s2) {
    const { team1Adj, team2Adj } = calculateMatchupAdjustment(s1, s2);
    adjusted = Math.max(0.01, Math.min(0.99, base + team1Adj + team2Adj));
  }

  // Apply location advantage if round context is available
  if (roundName) {
    const region = team1.region as Region | undefined;
    const locResult = calculateLocationAdvantage(team1.id, team2.id, roundName, region, team1.seed);
    if (locResult) {
      adjusted = Math.max(0.01, Math.min(0.99, adjusted + locResult.team1Adj + locResult.team2Adj));
    }
  }

  // Apply seed-line upset calibration
  const seed1 = team1.seed ?? 16;
  const seed2 = team2.seed ?? 16;
  adjusted = applySeedCalibration(adjusted, seed1, seed2);

  return adjusted;
}

interface BracketSlot {
  team: Team;
  seed: number;
}

function simulateRound(
  slots: BracketSlot[],
  precomputed: Map<number, PrecomputedTeamData>,
  statsMap: Map<number, TeamStats>,
  roundName?: string,
): BracketSlot[] {
  const winners: BracketSlot[] = [];
  for (let i = 0; i < slots.length; i += 2) {
    const t1 = slots[i];
    const t2 = slots[i + 1];
    if (!t1 || !t2) {
      winners.push(t1 || t2);
      continue;
    }
    const prob = getWinProbability(t1.team, t2.team, precomputed, statsMap, roundName);
    const winnerSlot = Math.random() < prob ? t1 : t2;
    const loserSlot = winnerSlot === t1 ? t2 : t1;

    // Bayesian in-sim rating update: winner's pWin gets nudged
    const winnerPre = precomputed.get(winnerSlot.team.id);
    const loserPre = precomputed.get(loserSlot.team.id);
    if (winnerPre && loserPre) {
      winnerPre.pWin = bayesianUpdate(winnerPre.pWin, loserPre.pWin);
    }

    winners.push(winnerSlot);
  }
  return winners;
}

export function simulateBracket(
  teams: Team[],
  stats: Map<number, TeamStats>,
  iterations: number = DEFAULT_ITERATIONS,
  schedules?: Map<number, { score: number; oppScore: number }[]>,
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

  // Pre-compute all coaching scores
  const allTeamIds = Array.from(stats.keys());
  const allCoachingScores = allTeamIds.map((id) => {
    const coach = COACH_DATA[id];
    return coach ? calculateCoachingScore(coach) : 0;
  });

  // Pre-compute all variance scores from schedules
  const allVarianceScores = allTeamIds.map((id) => {
    const schedule = schedules?.get(id);
    return schedule ? calculateVariance(schedule as any) : 0;
  });

  // Pre-compute composite ratings using contextual weights per-team
  // (Note: contextual weights vary per matchup; for pre-computation we use base weights.
  //  The seed-calibration step in getWinProbability handles the per-matchup context.)
  const basePrecomputed = new Map<number, PrecomputedTeamData>();
  for (const team of teams) {
    const s = stats.get(team.id);
    if (!s) continue;
    const coach = COACH_DATA[team.id];
    const coachScore = coach ? calculateCoachingScore(coach) : 0;
    const varScore = schedules?.get(team.id)
      ? calculateVariance(schedules.get(team.id) as any)
      : 0;
    const rating = calculateCompositeRating(
      s, allStats, 0, coachScore, allCoachingScores, varScore, allVarianceScores,
    );
    const pWin = Math.max(0.01, Math.min(0.99, rating.overall / 100));
    basePrecomputed.set(team.id, { rating, pWin });
  }

  // Build initial bracket slots ordered by seed
  const slots: BracketSlot[] = teams.map((t) => ({
    team: t,
    seed: t.seed ?? 16,
  }));

  // Determine round count (64 teams = 6 rounds)
  const totalTeams = slots.length;
  const totalRounds = Math.ceil(Math.log2(totalTeams));

  const s16Round = totalRounds - 3;
  const e8Round = totalRounds - 2;
  const ffRound = totalRounds - 1;
  const champRound = totalRounds;

  for (let iter = 0; iter < iterations; iter++) {
    let current = [...slots];

    // Deep-copy precomputed pWin values for this iteration so Bayesian
    // updates within one simulation don't leak across iterations.
    const iterPrecomputed = new Map<number, PrecomputedTeamData>();
    for (const [id, data] of basePrecomputed) {
      iterPrecomputed.set(id, { rating: data.rating, pWin: data.pWin });
    }

    for (let round = 1; round <= totalRounds; round++) {
      const roundName = getRoundName(round, totalRounds);
      current = simulateRound(current, iterPrecomputed, stats, roundName);

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
