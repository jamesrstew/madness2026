'use client';

import Image from 'next/image';
import type { GameResult, SeasonLeader } from '@/lib/types';
import { computeLeaders } from '@/lib/leaders';

interface SeasonLeadersProps {
  games: GameResult[];
  teamName: string;
  teamColor?: string;
}

const CATEGORIES = [
  { key: 'points' as const, label: 'Points', abbr: 'PPG' },
  { key: 'rebounds' as const, label: 'Rebounds', abbr: 'RPG' },
  { key: 'assists' as const, label: 'Assists', abbr: 'APG' },
];

export default function SeasonLeaders({ games, teamName, teamColor }: SeasonLeadersProps) {
  const leaders = computeLeaders(games);
  const totalGames = games.filter((g) => g.leaders && g.leaders.length > 0).length;

  if (leaders.length === 0) {
    return (
      <div className="w-full border border-rule bg-surface p-4">
        <h4 className="text-xs font-medium uppercase tracking-widest text-ink-faint mb-2">
          {teamName} Leaders
        </h4>
        <p className="text-sm italic text-ink-faint">No player data available</p>
      </div>
    );
  }

  return (
    <div className="w-full border border-rule bg-surface overflow-hidden">
      <div
        className="px-4 py-3 border-b border-rule"
        style={{ borderLeftWidth: 2, borderLeftColor: teamColor ?? '#8B6914' }}
      >
        <h4 className="text-xs font-medium uppercase tracking-widest text-ink-faint">
          {teamName} Leaders
        </h4>
      </div>

      <div className="divide-y divide-rule">
        {CATEGORIES.map((cat) => {
          const leader = leaders.find((l) => l.category === cat.key);
          if (!leader) return null;

          const avg = totalGames > 0 ? (leader.totalValue / totalGames).toFixed(1) : '0.0';

          return (
            <div key={cat.key} className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3">
              {/* Headshot */}
              <div className="relative h-10 w-10 flex-shrink-0 rounded-full bg-ink/[0.06] overflow-hidden">
                {leader.headshot ? (
                  <Image
                    src={leader.headshot}
                    alt={leader.name}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-ink-faint">
                    ?
                  </div>
                )}
              </div>

              {/* Player info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink truncate">
                  {leader.name}
                </p>
                <p className="text-[10px] text-ink-faint">
                  Led team in {totalGames > 0 ? `${leader.gamesLed} of ${totalGames}` : '0'} games
                </p>
              </div>

              {/* Stat */}
              <div className="text-right flex-shrink-0">
                <p className="font-mono text-base sm:text-lg font-semibold text-ink">{avg}</p>
                <p className="font-mono text-[10px] uppercase text-ink-faint">{cat.abbr}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

