'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PredictionFactor } from '@/lib/types';
import FactorBar from './FactorBar';

interface AlgorithmBreakdownProps {
  team1Name: string;
  team2Name: string;
  factors: PredictionFactor[];
  commentary?: string[];
}

export default function AlgorithmBreakdown({
  team1Name,
  team2Name,
  factors,
  commentary,
}: AlgorithmBreakdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full rounded-xl border border-white/10 bg-navy overflow-hidden">
      <button
        className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-white/5 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div>
          <h3 className="font-semibold">Algorithm Breakdown</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {factors.length} factors analyzed
          </p>
        </div>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-gray-400"
        >
          &#9660;
        </motion.span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6">
              {/* Team labels */}
              <div className="flex items-center justify-between text-xs text-gray-400 uppercase tracking-wider mb-3">
                <span>{team1Name}</span>
                <span>{team2Name}</span>
              </div>

              {/* Factor bars */}
              <div className="space-y-1">
                {factors.map((factor) => (
                  <FactorBar
                    key={factor.name}
                    factorName={factor.name}
                    team1Value={factor.team1Value}
                    team2Value={factor.team2Value}
                    edge={factor.team1Edge}
                    weight={factor.weight}
                  />
                ))}
              </div>

              {/* Commentary */}
              {commentary && commentary.length > 0 && (
                <div className="mt-6 space-y-2 border-t border-white/10 pt-4">
                  {commentary.map((line, i) => (
                    <p key={i} className="text-sm text-gray-300 italic">
                      {line}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
