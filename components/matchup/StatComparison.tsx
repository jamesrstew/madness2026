'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TeamStats } from '@/lib/types';

interface StatComparisonProps {
  team1Name: string;
  team2Name: string;
  team1Stats: TeamStats;
  team2Stats: TeamStats;
  statKeys: { key: keyof TeamStats; label: string; higherIsBetter: boolean; description: string }[];
  team1Color?: string;
  team2Color?: string;
}

function getMatchupInsight(
  key: string,
  label: string,
  v1: number,
  v2: number,
  team1Name: string,
  team2Name: string,
): string | null {
  const gap = Math.abs(v1 - v2);
  const leader = v1 > v2 ? team1Name : team2Name;

  const thresholds: Record<string, number> = {
    adjOE: 3, adjDE: 3, adjEM: 4, ppg: 4, oppg: 4,
    oEFG: 2, dEFG: 2, rpg: 3, apg: 2, tempo: 4, sos: 3,
  };

  const threshold = thresholds[key] ?? 3;
  if (gap < threshold) return null;

  switch (key) {
    case 'adjOE':
      return `${leader}'s offense generates ${gap.toFixed(1)} more points per 100 trips — a significant edge.`;
    case 'adjDE':
      return `${leader} allows ${gap.toFixed(1)} fewer points per 100 possessions — their defense could suffocate.`;
    case 'adjEM':
      return `${gap.toFixed(1)}-point efficiency gap — ${leader} is the clearly stronger overall team.`;
    case 'ppg':
      return `${leader} scores ${gap.toFixed(1)} more points per game on average.`;
    case 'oppg':
      return `${leader} allows ${gap.toFixed(1)} fewer points — a defensive wall.`;
    case 'oEFG':
      return `${leader} shoots ${gap.toFixed(1)}% better from the field (adjusted for 3s) — more efficient shot selection.`;
    case 'dEFG':
      return `${leader} forces opponents to shoot ${gap.toFixed(1)}% worse — contested shots all night.`;
    case 'rpg':
      return `${leader} grabs ${gap.toFixed(1)} more rebounds per game — controlling the glass.`;
    case 'apg':
      return `${leader} dishes ${gap.toFixed(1)} more assists — better ball movement and team play.`;
    case 'tempo':
      return `${gap.toFixed(1)}-possession tempo gap — the faster team will try to dictate pace.`;
    case 'sos':
      return `${leader} faced a tougher schedule — their record is more battle-tested.`;
    default:
      return null;
  }
}

export default function StatComparison({
  team1Name,
  team2Name,
  team1Stats,
  team2Stats,
  statKeys,
  team1Color,
  team2Color,
}: StatComparisonProps) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between text-[10px] sm:text-sm font-medium uppercase tracking-widest text-ink-faint mb-4 pb-2 border-b border-rule">
        <span>{team1Name}</span>
        <span>Stat</span>
        <span>{team2Name}</span>
      </div>

      <div className="space-y-3">
        {statKeys.map(({ key, label, higherIsBetter, description }) => {
          const v1 = team1Stats[key] as number;
          const v2 = team2Stats[key] as number;
          const team1Better = higherIsBetter ? v1 > v2 : v1 < v2;
          const team2Better = higherIsBetter ? v2 > v1 : v2 < v1;
          const isExpanded = expandedKey === key;
          const insight = getMatchupInsight(key, label, v1, v2, team1Name, team2Name);

          return (
            <div key={key}>
              <button
                type="button"
                className="flex items-center gap-3 w-full text-left cursor-pointer hover:bg-ink/[0.02] rounded transition-colors -mx-1 px-1"
                onClick={() => setExpandedKey(isExpanded ? null : key)}
                aria-expanded={isExpanded}
              >
                <span
                  className={`w-12 sm:w-16 text-right font-mono text-sm sm:text-base ${
                    team1Better ? 'font-semibold text-ink' : 'font-normal text-ink-muted'
                  }`}
                >
                  {team1Better && <span className="text-sage text-[10px] mr-0.5">{'\u2713'}</span>}
                  {typeof v1 === 'number' ? v1.toFixed(1) : v1}
                </span>

                {/* Bar visualization */}
                <div className="flex-1">
                  <div className="relative flex h-3 rounded-sm overflow-hidden bg-ink/[0.06]">
                    <motion.div
                      className={`h-full ${
                        !team1Color ? (team1Better ? 'bg-sage' : 'bg-crimson') : ''
                      }`}
                      style={{
                        ...(team1Color && { backgroundColor: team1Color }),
                        opacity: team1Better ? 1 : 0.4,
                      }}
                      initial={{ width: '50%' }}
                      animate={{ width: `${(v1 / (v1 + v2)) * 100}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                    <motion.div
                      className={`h-full ${
                        !team2Color ? (team2Better ? 'bg-sage' : 'bg-crimson') : ''
                      }`}
                      style={{
                        ...(team2Color && { backgroundColor: team2Color }),
                        opacity: team2Better ? 1 : 0.4,
                      }}
                      initial={{ width: '50%' }}
                      animate={{ width: `${(v2 / (v1 + v2)) * 100}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <span className="text-center text-xs text-ink-faint">
                      {label}
                    </span>
                    <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-ink/10 text-[8px] text-ink-faint leading-none">
                      ?
                    </span>
                  </div>
                </div>

                <span
                  className={`w-12 sm:w-16 text-left font-mono text-sm sm:text-base ${
                    team2Better ? 'font-semibold text-ink' : 'font-normal text-ink-muted'
                  }`}
                >
                  {typeof v2 === 'number' ? v2.toFixed(1) : v2}
                  {team2Better && <span className="text-sage text-[10px] ml-0.5">{'\u2713'}</span>}
                </span>
              </button>

              {/* Expandable description + insight */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="mx-14 sm:mx-20 mt-1 mb-2 px-3 py-2 bg-ink/[0.03] rounded text-xs text-ink-muted leading-relaxed space-y-1">
                      <p>{description}</p>
                      {insight && (
                        <p className="text-ink font-medium italic">{insight}</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
