'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { Matchup } from '@/lib/types';
import TeamSeed from './TeamSeed';

interface MatchupCardProps {
  matchup: Matchup;
  onSelectWinner: (matchupId: string, teamId: number) => void;
  compact?: boolean;
}

export default function MatchupCard({ matchup, onSelectWinner, compact }: MatchupCardProps) {
  const { id, team1, team2, winner, winProb1, winProb2 } = matchup;
  const matchupUrl = team1 && team2
    ? `/matchup/${team1.id}-vs-${team2.id}`
    : null;

  if (!team1 && !team2) {
    return (
      <div className={`flex flex-col gap-px rounded-lg border border-white/5 bg-white/[0.02] ${compact ? 'w-36' : 'w-48'}`}>
        <div className={`${compact ? 'h-7' : 'h-9'} rounded-t-lg bg-white/[0.03]`} />
        <div className={`${compact ? 'h-7' : 'h-9'} rounded-b-lg bg-white/[0.03]`} />
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-px rounded-lg border border-white/10 bg-navy-light/50 ${compact ? 'w-36' : 'w-48'}`}>
      {team1 && (
        <motion.div
          layout
          animate={winner?.id === team1.id ? { y: -1 } : { y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="relative"
        >
          <div className="flex items-center">
            <div className="flex-1">
              <TeamSeed
                team={team1}
                isWinner={winner?.id === team1.id}
                onClick={() => onSelectWinner(id, team1.id)}
                compact={compact}
              />
            </div>
            {winProb1 != null && (
              <span className="pr-2 text-[10px] text-white/40">
                {Math.round(winProb1 * 100)}%
              </span>
            )}
          </div>
        </motion.div>
      )}
      {!team1 && <div className={`${compact ? 'h-7' : 'h-9'} bg-white/[0.03]`} />}

      {team2 && (
        <motion.div
          layout
          animate={winner?.id === team2.id ? { y: 1 } : { y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="relative"
        >
          <div className="flex items-center">
            <div className="flex-1">
              <TeamSeed
                team={team2}
                isWinner={winner?.id === team2.id}
                onClick={() => onSelectWinner(id, team2.id)}
                compact={compact}
              />
            </div>
            {winProb2 != null && (
              <span className="pr-2 text-[10px] text-white/40">
                {Math.round(winProb2 * 100)}%
              </span>
            )}
          </div>
        </motion.div>
      )}
      {!team2 && <div className={`${compact ? 'h-7' : 'h-9'} bg-white/[0.03]`} />}

      {matchupUrl && (
        <Link
          href={matchupUrl}
          className="block text-center text-[10px] text-white/30 hover:text-tournament-orange transition-colors py-0.5"
        >
          Analyze
        </Link>
      )}
    </div>
  );
}
