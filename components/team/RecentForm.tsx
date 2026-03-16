'use client';

import { useState } from 'react';
import type { GameResult } from '@/lib/types';

interface RecentFormProps {
  games: GameResult[];
  teamName?: string;
}

export default function RecentForm({ games, teamName }: RecentFormProps) {
  const [showAll, setShowAll] = useState(false);

  if (games.length === 0) {
    return (
      <div className="w-full border border-rule bg-surface p-4">
        {teamName && (
          <h4 className="text-xs font-medium uppercase tracking-widest text-ink-faint mb-3">
            {teamName} &mdash; Recent Games
          </h4>
        )}
        <p className="text-sm italic text-ink-faint">No game data available</p>
      </div>
    );
  }

  const recent = games.slice(-10);
  const displayed = showAll ? games : recent;

  const topScorer = (game: GameResult) =>
    game.leaders?.find((l) => l.category === 'points');

  return (
    <div className="w-full">
      {teamName && (
        <h4 className="text-xs font-medium uppercase tracking-widest text-ink-faint mb-3">
          {teamName} &mdash; Recent Games
        </h4>
      )}

      {/* Dot streak */}
      <div className={`relative flex items-center ${recent.length > 4 ? 'justify-between' : 'justify-start gap-3'} mb-4`}>
        {/* Connecting track line */}
        <div className="absolute inset-x-0 top-1/2 h-px bg-rule" />
        {recent.map((game, i) => {
          const isWin = game.result === 'W';
          const margin = Math.abs(game.score - game.oppScore);
          const size = 8 + Math.min(margin, 20) * 0.6;

          return (
            <div
              key={i}
              className="group relative z-10 flex items-center justify-center"
            >
              <div
                className={`rounded-full transition-transform hover:scale-125 ${
                  isWin ? 'bg-sage' : 'bg-crimson'
                }`}
                style={{ width: size, height: size }}
              />
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap bg-paper px-2 py-1 text-xs border border-rule shadow-lg z-20">
                <span className={isWin ? 'text-sage' : 'text-crimson'}>
                  {game.result}
                </span>{' '}
                <span className="font-mono">{game.score}-{game.oppScore}</span> vs {game.opponent}
              </div>
            </div>
          );
        })}
      </div>

      {/* Game log table */}
      <div className="border border-rule bg-surface overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-rule text-ink-faint uppercase tracking-widest">
              <th className="px-2 sm:px-3 py-2.5 text-left font-medium">Date</th>
              <th className="px-2 sm:px-3 py-2.5 text-left font-medium">Opp</th>
              <th className="px-2 sm:px-3 py-2.5 text-center font-medium">Result</th>
              <th className="px-2 sm:px-3 py-2.5 text-right font-medium hidden sm:table-cell">Top Scorer</th>
            </tr>
          </thead>
          <tbody>
            {displayed.slice().reverse().map((game, i) => {
              const isWin = game.result === 'W';
              const scorer = topScorer(game);
              const locLabel =
                game.location === 'home' ? '' :
                game.location === 'away' ? '@ ' : 'vs ';

              return (
                <tr
                  key={i}
                  className={`border-b border-rule/50 transition-colors hover:bg-ink/[0.03] ${
                    isWin ? 'bg-sage/[0.06]' : 'bg-crimson/[0.06]'
                  }`}
                >
                  <td className="px-2 sm:px-3 py-2 text-ink-faint whitespace-nowrap">
                    {formatDate(game.date)}
                  </td>
                  <td className="px-2 sm:px-3 py-2 text-ink-muted">
                    <span className="text-ink-faint">{locLabel}</span>
                    <span className="max-w-[8rem] truncate inline-block align-bottom">{game.opponent}</span>
                  </td>
                  <td className="px-2 sm:px-3 py-2 text-center whitespace-nowrap">
                    <span
                      className={`inline-block w-4 font-semibold ${
                        isWin ? 'text-sage' : 'text-crimson'
                      }`}
                    >
                      {game.result}
                    </span>{' '}
                    <span className="font-mono text-ink-muted">
                      {game.score}-{game.oppScore}
                    </span>
                  </td>
                  <td className="px-2 sm:px-3 py-2 text-right text-ink-muted hidden sm:table-cell whitespace-nowrap">
                    {scorer ? (
                      <>
                        {scorer.shortName}{' '}
                        <span className="font-mono text-ink-faint">{scorer.value} pts</span>
                      </>
                    ) : (
                      <span className="text-ink-faint">&mdash;</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {games.length > 10 && (
          <button
            className="w-full py-2.5 text-xs italic text-ink-faint hover:text-old-gold transition-colors border-t border-rule"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? 'Show last 10' : `Show all ${games.length} games`}
          </button>
        )}
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const [, month, day] = dateStr.split('-');
  const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[Number(month)] ?? month} ${Number(day)}`;
}
