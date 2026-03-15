'use client';

import { motion } from 'framer-motion';

interface FactorBarProps {
  factorName: string;
  team1Value: number;
  team2Value: number;
  /** Normalized edge: negative = team1 advantage, positive = team2 advantage */
  edge: number;
  weight: number;
}

export default function FactorBar({
  factorName,
  team1Value,
  team2Value,
  edge,
  weight,
}: FactorBarProps) {
  // Clamp edge to [-1, 1] for display
  const clampedEdge = Math.max(-1, Math.min(1, edge));
  const barWidth = Math.abs(clampedEdge) * 50; // max 50% of half
  const isTeam1 = clampedEdge < 0;

  return (
    <div className="flex items-center gap-3 py-2">
      <span className="w-14 text-right text-xs text-gray-400 font-mono">
        {team1Value.toFixed(1)}
      </span>

      <div className="flex-1 relative h-5">
        {/* Center line */}
        <div className="absolute left-1/2 top-0 h-full w-px bg-white/20" />

        {/* Bar */}
        <motion.div
          className={`absolute top-0.5 h-4 rounded ${
            isTeam1 ? 'bg-court-green' : 'bg-tournament-orange'
          }`}
          style={
            isTeam1
              ? { right: '50%', originX: 1 }
              : { left: '50%', originX: 0 }
          }
          initial={{ width: 0 }}
          animate={{ width: `${barWidth}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>

      <span className="w-14 text-left text-xs text-gray-400 font-mono">
        {team2Value.toFixed(1)}
      </span>

      <div className="w-28 flex items-center gap-2">
        <span className="text-xs text-gray-300 truncate">{factorName}</span>
        <span className="text-[10px] text-gray-500">({(weight * 100).toFixed(0)}%)</span>
      </div>
    </div>
  );
}
