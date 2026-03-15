'use client';

import { motion } from 'framer-motion';
import type { Confidence } from '@/lib/types';

interface WinProbabilityProps {
  team1Name: string;
  team2Name: string;
  team1Color: string;
  team2Color: string;
  team1WinPct: number;
  confidence: Confidence;
}

function getConfidenceLabel(pct: number): Confidence {
  const higher = Math.max(pct, 1 - pct) * 100;
  if (higher < 55) return 'Toss-up';
  if (higher < 65) return 'Slight edge';
  if (higher < 80) return 'Clear favorite';
  if (higher < 90) return 'Strong favorite';
  return 'Dominant';
}

export default function WinProbability({
  team1Name,
  team2Name,
  team1Color,
  team2Color,
  team1WinPct,
  confidence,
}: WinProbabilityProps) {
  const pct1 = Math.round(team1WinPct * 100);
  const pct2 = 100 - pct1;
  const label = confidence ?? getConfidenceLabel(team1WinPct);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-sm font-semibold mb-2">
        <span>{team1Name}</span>
        <span className="text-xs text-gray-400">{label}</span>
        <span>{team2Name}</span>
      </div>
      <div className="relative flex h-10 w-full overflow-hidden rounded-lg">
        <motion.div
          className="flex items-center justify-center text-sm font-bold text-white"
          style={{ backgroundColor: team1Color }}
          initial={{ width: '50%' }}
          animate={{ width: `${pct1}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          {pct1}%
        </motion.div>
        <motion.div
          className="flex items-center justify-center text-sm font-bold text-white"
          style={{ backgroundColor: team2Color }}
          initial={{ width: '50%' }}
          animate={{ width: `${pct2}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          {pct2}%
        </motion.div>
      </div>
    </div>
  );
}
