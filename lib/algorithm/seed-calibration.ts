/**
 * Seed-line upset calibration.
 *
 * Historical NCAA tournament data shows that certain seed matchups produce
 * upsets at rates that diverge from pure talent-gap predictions. For example,
 * 12-over-5 upsets occur ~35% of the time (vs ~28% from raw ratings).
 *
 * This module applies a Bayesian-style calibration that blends the model's
 * raw probability with the historical base rate for that seed matchup.
 *
 * Sources: NCAA tournament results 2001-2025 (aggregated upset rates by seed line).
 */

/**
 * Historical win rates for the HIGHER seed (i.e., the favored team).
 * Key format: `{favoredSeed}-{underdogSeed}`.
 * Data aggregated from 2001-2025 NCAA tournaments.
 */
const HISTORICAL_WIN_RATES: Record<string, number> = {
  // Round of 64 matchups
  '1-16': 0.993,
  '2-15': 0.938,
  '3-14': 0.853,
  '4-13': 0.793,
  '5-12': 0.649,  // 12-seeds win ~35%
  '6-11': 0.628,  // 11-seeds win ~37% (includes First Four teams)
  '7-10': 0.607,  // 10-seeds win ~39%
  '8-9':  0.520,  // Nearly coin flip

  // Round of 32 common matchups
  '1-8':  0.797,
  '1-9':  0.838,
  '2-7':  0.667,
  '2-10': 0.618,
  '3-6':  0.571,
  '3-11': 0.577,
  '4-5':  0.545,
  '4-12': 0.591,

  // Sweet 16 common matchups
  '1-4':  0.628,
  '1-5':  0.714,
  '2-3':  0.535,
  '1-12': 0.750,
  '2-6':  0.600,
  '2-11': 0.647,

  // Elite 8 and beyond — less data, less calibration needed
  '1-2':  0.538,
  '1-3':  0.583,
};

/** How much to trust the historical rate vs the model (0 = all model, 1 = all history) */
const CALIBRATION_STRENGTH = 0.25;

/**
 * Apply seed-line calibration to a model win probability.
 *
 * Blends the model's probability with historical base rates for the given
 * seed matchup. The blend is gentle (25% history, 75% model) to inform
 * without overriding the model's team-specific analysis.
 *
 * @param modelProb - Model's win probability for team1 (0-1)
 * @param team1Seed - Seed of team 1 (1-16)
 * @param team2Seed - Seed of team 2 (1-16)
 * @returns Calibrated probability for team 1
 */
export function applySeedCalibration(
  modelProb: number,
  team1Seed: number,
  team2Seed: number,
): number {
  if (!team1Seed || !team2Seed || team1Seed === team2Seed) return modelProb;

  // Determine which team is the higher seed (favored)
  const favoredSeed = Math.min(team1Seed, team2Seed);
  const underdogSeed = Math.max(team1Seed, team2Seed);
  const team1IsFavored = team1Seed <= team2Seed;

  const key = `${favoredSeed}-${underdogSeed}`;
  const historicalFavoredWinRate = HISTORICAL_WIN_RATES[key];

  // No historical data for this matchup — return model as-is
  if (historicalFavoredWinRate === undefined) return modelProb;

  // Convert to team1's perspective
  const historicalTeam1Rate = team1IsFavored
    ? historicalFavoredWinRate
    : 1 - historicalFavoredWinRate;

  // Blend: mostly model, but nudged toward historical rate
  const calibrated =
    (1 - CALIBRATION_STRENGTH) * modelProb +
    CALIBRATION_STRENGTH * historicalTeam1Rate;

  return Math.max(0.01, Math.min(0.99, calibrated));
}
