/**
 * Model/market ensemble blending.
 *
 * Combines our statistical model probability with prediction market odds
 * using a linear blend. Applied as the final step after all model adjustments.
 */

export interface EnsembleResult {
  /** Final blended probability for team 1 */
  finalProb: number;
  /** Our model's probability */
  modelProb: number;
  /** Market-implied probability (NaN if unavailable) */
  marketProb: number;
  /** Whether market data was available */
  marketAvailable: boolean;
  /** Blend weight for model (1 - alpha = market weight) */
  alpha: number;
}

/**
 * Blend the statistical model probability with market-implied probability.
 *
 * @param modelProb - Our model's win probability for team 1 (0-1)
 * @param marketProb - Market-implied probability for team 1 (0-1), or NaN if unavailable
 * @param marketAvailable - Whether market data was successfully fetched
 * @param alpha - Weight given to model (default 0.70 → 30% market weight)
 * @returns Blended result clamped to [0.01, 0.99]
 */
export function ensembleBlend(
  modelProb: number,
  marketProb: number,
  marketAvailable: boolean,
  alpha = 0.70,
): EnsembleResult {
  // Graceful degradation: use model-only when market data is unavailable
  if (!marketAvailable || isNaN(marketProb)) {
    return {
      finalProb: Math.max(0.01, Math.min(0.99, modelProb)),
      modelProb,
      marketProb: NaN,
      marketAvailable: false,
      alpha: 1.0,
    };
  }

  const blended = alpha * modelProb + (1 - alpha) * marketProb;
  const clamped = Math.max(0.01, Math.min(0.99, blended));

  return {
    finalProb: clamped,
    modelProb,
    marketProb,
    marketAvailable: true,
    alpha,
  };
}
