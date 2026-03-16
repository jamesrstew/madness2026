'use client';

import { motion } from 'framer-motion';
import type { Matchup } from '@/lib/types/bracket';
import type { PredictionEntry } from '@/lib/bracket/predictions';
import GameCard from './GameCard';

interface RoundColumnProps {
  matchups: Matchup[];
  predictions: Map<string, PredictionEntry>;
  predictionsLoading: boolean;
  onSelectWinner: (matchupId: string, teamId: number) => void;
  roundLabel: string;
  completionCount: number;
  totalCount: number;
  isActiveRound: boolean;
  compact?: boolean;
}

const ROUND_LABELS: Record<string, string> = {
  R64: 'Round of 64',
  R32: 'Round of 32',
  S16: 'Sweet 16',
  E8: 'Elite 8',
  FF: 'Final Four',
  CHAMPIONSHIP: 'Championship',
  FIRST_FOUR: 'First Four',
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

function predictionKey(m: Matchup): string | null {
  if (!m.team1 || !m.team2) return null;
  return `${m.team1.id}-${m.team2.id}`;
}

export default function RoundColumn({
  matchups,
  predictions,
  predictionsLoading,
  onSelectWinner,
  roundLabel,
  completionCount,
  totalCount,
  isActiveRound,
  compact,
}: RoundColumnProps) {
  const displayLabel = ROUND_LABELS[roundLabel] ?? roundLabel;

  return (
    <div className="flex min-w-0 flex-col">
      {/* Header */}
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <span
          className={`text-[10px] font-medium uppercase tracking-widest ${
            isActiveRound ? 'text-old-gold' : 'text-ink-faint'
          }`}
        >
          {displayLabel}
        </span>
        <span className="font-mono text-[10px] text-ink-faint">
          {completionCount}/{totalCount}
        </span>
      </div>

      {/* Matchup cards with pair grouping */}
      <motion.div
        className="flex flex-col"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {matchups.map((m, idx) => {
          // For rounds with 4+ matchups, add extra gap between pairs
          const isNewPair = matchups.length >= 4 && idx > 0 && idx % 2 === 0;

          const key = predictionKey(m);
          const cachePred = key ? predictions.get(key) : undefined;
          // Fall back to winProb1/winProb2 stored on the matchup object itself
          const pred = cachePred ?? (
            m.winProb1 != null && m.winProb2 != null
              ? { team1WinPct: m.winProb1, team2WinPct: m.winProb2, confidence: 'Toss-up' as const, verdict: '' }
              : undefined
          );

          return (
            <motion.div
              key={m.id}
              variants={item}
              className={isNewPair ? 'mt-6' : idx > 0 ? 'mt-2' : ''}
            >
              <GameCard
                matchup={m}
                prediction={pred}
                predictionLoading={predictionsLoading && !pred}
                onSelectWinner={onSelectWinner}
                compact={compact}
              />
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
