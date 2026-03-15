'use client';

import type { Matchup } from '@/lib/types';
import MatchupCard from './MatchupCard';

interface FinalFourProps {
  matchups: Map<string, Matchup>;
  onSelectWinner: (matchupId: string, teamId: number) => void;
}

function getMatchupsByRound(matchups: Map<string, Matchup>, round: string): Matchup[] {
  const result: Matchup[] = [];
  for (const [, m] of matchups) {
    if (m.round === round) result.push(m);
  }
  result.sort((a, b) => a.id.localeCompare(b.id));
  return result;
}

export default function FinalFour({ matchups, onSelectWinner }: FinalFourProps) {
  const ffMatchups = getMatchupsByRound(matchups, 'FF');
  const champMatchups = getMatchupsByRound(matchups, 'CHAMPIONSHIP');

  return (
    <div className="flex flex-col items-center gap-6">
      <h3 className="text-lg font-bold text-gold">Final Four</h3>
      <div className="flex gap-8">
        {ffMatchups.map((m) => (
          <MatchupCard key={m.id} matchup={m} onSelectWinner={onSelectWinner} />
        ))}
      </div>
      {champMatchups.length > 0 && (
        <>
          <h3 className="text-lg font-bold text-tournament-orange">Championship</h3>
          <div className="flex gap-4">
            {champMatchups.map((m) => (
              <MatchupCard key={m.id} matchup={m} onSelectWinner={onSelectWinner} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
