'use client';

import { motion } from 'framer-motion';
import type { PredictionFactor } from '@/lib/types';
import FactorBar from './FactorBar';

interface AlgorithmBreakdownProps {
  team1Name: string;
  team2Name: string;
  team1Color?: string;
  team2Color?: string;
  factors: PredictionFactor[];
  commentary?: string[];
}

export default function AlgorithmBreakdown({
  team1Name,
  team2Name,
  team1Color = '#2D6A3F',
  team2Color = '#8B6914',
  factors,
  commentary,
}: AlgorithmBreakdownProps) {
  return (
    <div className="w-full border border-rule bg-surface overflow-hidden">
      <div className="px-4 sm:px-6 py-5 border-b border-rule">
        <h3 className="font-display text-lg">Algorithm Breakdown</h3>
        <p className="text-sm text-ink-faint mt-1">
          {factors.length} factors analyzed
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="px-4 sm:px-6 pb-6">
          {/* Color legend */}
          <div className="flex flex-col sm:flex-row sm:justify-between gap-2 items-center py-4 border-b border-rule mb-4">
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-2 w-8"
                style={{ backgroundColor: team1Color }}
              />
              <span className="text-sm text-ink-muted">
                {team1Name}
              </span>
            </div>
            <p className="text-xs italic text-ink-faint">
              Wider bar = higher value
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-ink-muted">
                {team2Name}
              </span>
              <span
                className="inline-block h-2 w-8"
                style={{ backgroundColor: team2Color }}
              />
            </div>
          </div>

          {/* Factor bars */}
          <div className="space-y-1 divide-y divide-rule">
            {factors.map((factor, i) => (
              <FactorBar
                key={`${factor.name}-${i}`}
                factorName={factor.name}
                team1Value={factor.team1Value}
                team2Value={factor.team2Value}
                edge={factor.team1Edge}
                weight={factor.weight}
                team1Color={team1Color}
                team2Color={team2Color}
              />
            ))}
          </div>

          {/* Commentary */}
          {commentary && commentary.length > 0 && (
            <div className="mt-6 space-y-2 border-t border-rule pt-5">
              <h4 className="font-display text-base mb-3">Commentary</h4>
              {commentary.map((line, i) => (
                <p key={i} className="text-base italic text-ink-muted leading-relaxed">
                  {line}
                </p>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
