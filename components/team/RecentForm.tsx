'use client';

import type { GameResult } from '@/lib/types';

interface RecentFormProps {
  games: GameResult[];
  teamName?: string;
}

export default function RecentForm({ games, teamName }: RecentFormProps) {
  // Show last 10 games
  const recent = games.slice(-10);

  return (
    <div className="w-full">
      {teamName && (
        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          {teamName} — Last {recent.length} Games
        </h4>
      )}
      <div className="flex items-center gap-1.5">
        {recent.map((game, i) => {
          const isWin = game.result === 'W';
          const margin = Math.abs(game.score - game.oppScore);
          // Scale dot size: min 8px, max 20px, proportional to margin (capped at 20)
          const size = 8 + Math.min(margin, 20) * 0.6;

          return (
            <div
              key={i}
              className="group relative flex items-center justify-center"
            >
              <div
                className={`rounded-full transition-transform hover:scale-125 ${
                  isWin ? 'bg-court-green' : 'bg-danger-red'
                }`}
                style={{ width: size, height: size }}
              />
              {/* Tooltip */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap rounded bg-navy-dark px-2 py-1 text-xs border border-white/10 shadow-lg z-10">
                <span className={isWin ? 'text-court-green' : 'text-danger-red'}>
                  {game.result}
                </span>{' '}
                {game.score}-{game.oppScore} vs {game.opponent}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-court-green" /> Win
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-danger-red" /> Loss
        </span>
        <span>Dot size = margin of victory/defeat</span>
      </div>
    </div>
  );
}
