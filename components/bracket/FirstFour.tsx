'use client';

import type { Matchup } from '@/lib/types';
import MatchupCard from './MatchupCard';

interface FirstFourProps {
  matchups: Matchup[];
  onSelectWinner: (matchupId: string, teamId: number) => void;
}

export default function FirstFour({ matchups, onSelectWinner }: FirstFourProps) {
  if (matchups.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-lg font-bold text-white/60">First Four</h3>
      <div className="flex flex-wrap gap-4">
        {matchups.map((m) => (
          <MatchupCard key={m.id} matchup={m} onSelectWinner={onSelectWinner} />
        ))}
      </div>
    </div>
  );
}
