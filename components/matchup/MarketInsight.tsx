'use client';

import { motion } from 'framer-motion';
import type { EnsembleData } from '@/lib/types';

interface MarketInsightProps {
  ensemble: EnsembleData;
  team1Name: string;
  team2Name: string;
  team1Color: string;
  team2Color: string;
}

export default function MarketInsight({
  ensemble,
  team1Name,
  team2Name,
  team1Color,
  team2Color,
}: MarketInsightProps) {
  const modelPct1 = Math.round(ensemble.modelProb * 100);
  const modelPct2 = 100 - modelPct1;

  if (!ensemble.marketAvailable) {
    return (
      <motion.div
        className="border border-rule bg-surface px-4 sm:px-6 py-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-muted">
            Prediction Markets
          </span>
        </div>
        <p className="text-sm text-ink-faint italic">
          No prediction market data available for this matchup. The probability shown is based entirely on our statistical model.
        </p>
      </motion.div>
    );
  }

  const marketPct1 = Math.round(ensemble.marketProb * 100);
  const marketPct2 = 100 - marketPct1;
  const modelWeight = Math.round(ensemble.alpha * 100);
  const marketWeight = 100 - modelWeight;
  const finalPct1 = Math.round((ensemble.alpha * ensemble.modelProb + (1 - ensemble.alpha) * ensemble.marketProb) * 100);
  const finalPct2 = 100 - finalPct1;

  // Which team does the market favor vs the model?
  const marketFavors1 = marketPct1 > modelPct1;
  const diff = Math.abs(marketPct1 - modelPct1);
  const divergence = diff >= 10 ? 'strong' : diff >= 4 ? 'moderate' : 'aligned';

  return (
    <motion.div
      className="border border-rule bg-surface overflow-hidden"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="px-4 sm:px-6 py-4 border-b border-rule">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-muted">
            Prediction Markets
          </span>
          <span className="text-xs text-ink-faint">
            Polymarket
          </span>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-4 space-y-4">
        {/* Model vs Market comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Model probability */}
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-ink-faint mb-2">
              Our Model ({modelWeight}% weight)
            </p>
            <div className="flex h-7 overflow-hidden">
              <div
                className="flex items-center justify-center text-xs font-mono font-medium text-white"
                style={{ backgroundColor: team1Color, width: `${modelPct1}%`, minWidth: '2rem' }}
              >
                {modelPct1}%
              </div>
              <div
                className="flex items-center justify-center text-xs font-mono font-medium text-white"
                style={{ backgroundColor: team2Color, width: `${modelPct2}%`, minWidth: '2rem' }}
              >
                {modelPct2}%
              </div>
            </div>
          </div>

          {/* Market probability */}
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-ink-faint mb-2">
              Markets ({marketWeight}% weight)
            </p>
            <div className="flex h-7 overflow-hidden">
              <div
                className="flex items-center justify-center text-xs font-mono font-medium text-white"
                style={{ backgroundColor: team1Color, width: `${marketPct1}%`, minWidth: '2rem' }}
              >
                {marketPct1}%
              </div>
              <div
                className="flex items-center justify-center text-xs font-mono font-medium text-white"
                style={{ backgroundColor: team2Color, width: `${marketPct2}%`, minWidth: '2rem' }}
              >
                {marketPct2}%
              </div>
            </div>
          </div>
        </div>

        {/* Divergence insight */}
        <p className="text-sm text-ink-muted italic leading-relaxed">
          {divergence === 'strong' && (
            <>
              The markets {marketFavors1 ? `like ${team1Name}` : `like ${team2Name}`} significantly more than our model does ({diff}pt gap).
              This could reflect betting momentum or information our stats don&apos;t capture.
            </>
          )}
          {divergence === 'moderate' && (
            <>
              The markets lean slightly {marketFavors1 ? `more toward ${team1Name}` : `more toward ${team2Name}`} than our model ({diff}pt gap).
              The blended probability splits the difference.
            </>
          )}
          {divergence === 'aligned' && (
            <>
              Our model and the prediction markets are closely aligned on this matchup.
              Both sources see a similar probability.
            </>
          )}
        </p>
      </div>
    </motion.div>
  );
}
