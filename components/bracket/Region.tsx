'use client';

import type { Matchup, Region as RegionType, Round } from '@/lib/types';
import MatchupCard from './MatchupCard';

interface RegionProps {
  region: RegionType;
  matchups: Map<string, Matchup>;
  onSelectWinner: (matchupId: string, teamId: number) => void;
}

const REGION_ROUNDS: Round[] = ['R64', 'R32', 'S16', 'E8'];
const ROUND_LABELS: Record<string, string> = {
  R64: 'Round of 64',
  R32: 'Round of 32',
  S16: 'Sweet 16',
  E8: 'Elite 8',
};

function getRegionMatchups(
  allMatchups: Map<string, Matchup>,
  region: RegionType,
  round: Round,
): Matchup[] {
  const result: Matchup[] = [];
  for (const [, m] of allMatchups) {
    if (m.round === round && m.region === region) {
      result.push(m);
    }
  }
  // Sort by ID to maintain bracket order
  result.sort((a, b) => a.id.localeCompare(b.id));
  return result;
}

export default function Region({ region, matchups, onSelectWinner }: RegionProps) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-lg font-bold text-tournament-orange">{region}</h3>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {REGION_ROUNDS.map((round) => {
          const roundMatchups = getRegionMatchups(matchups, region, round);
          if (roundMatchups.length === 0) return null;

          return (
            <div key={round} className="flex flex-col gap-1">
              <span className="mb-1 text-[10px] font-medium uppercase tracking-wider text-white/30">
                {ROUND_LABELS[round]}
              </span>
              <div className="flex flex-col items-center" style={{ gap: `${Math.pow(2, REGION_ROUNDS.indexOf(round)) * 0.5 + 0.25}rem` }}>
                {/* Vertical spacer to center-align later rounds */}
                <div style={{ height: `${Math.pow(2, REGION_ROUNDS.indexOf(round)) * 0.5 - 0.25}rem` }} />
                {roundMatchups.map((m) => (
                  <div key={m.id} className="relative flex items-center">
                    <MatchupCard matchup={m} onSelectWinner={onSelectWinner} compact />
                    {/* Connector line to next round */}
                    {round !== 'E8' && (
                      <div className="ml-1 h-px w-3 bg-white/10" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
