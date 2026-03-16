'use client';

import type { Team } from '@/lib/types';

interface TeamCardProps {
  team: Team;
  variant?: 'compact' | 'expanded';
}

export default function TeamCard({ team, variant = 'compact' }: TeamCardProps) {
  const isExpanded = variant === 'expanded';

  return (
    <div
      className={`border border-rule bg-surface overflow-hidden ${
        isExpanded ? 'p-4 sm:p-6 lg:p-8' : 'p-4'
      }`}
      style={{ borderLeftColor: `#${team.color}`, borderLeftWidth: 2 }}
    >
      <div className={`flex items-center ${isExpanded ? 'gap-3 sm:gap-4 lg:gap-6' : 'gap-3'}`}>
        {/* Logo */}
        {team.logo && (
          <img
            src={team.logo}
            alt={team.name}
            className={isExpanded ? 'h-14 w-14 sm:h-16 sm:w-16 lg:h-20 lg:w-20' : 'h-10 w-10'}
          />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {team.seed !== undefined && (
              <span
                className="inline-flex items-center justify-center font-mono text-xs font-semibold text-ink-muted"
                style={{
                  width: isExpanded ? 28 : 22,
                  height: isExpanded ? 28 : 22,
                }}
              >
                {team.seed}
              </span>
            )}
            <h3
              className={`font-display truncate ${
                isExpanded ? 'text-2xl' : 'text-sm font-medium'
              }`}
            >
              {team.name}
            </h3>
          </div>

          <div
            className={`text-ink-muted ${isExpanded ? 'text-sm mt-1' : 'text-xs'}`}
          >
            <span>{team.conference}</span>
            <span className="mx-2 text-rule">|</span>
            <span className="font-mono">
              {team.record.wins}-{team.record.losses}
            </span>
          </div>

          {isExpanded && team.region && (
            <span className="mt-2 inline-block border border-rule px-3 py-0.5 text-xs text-ink-muted">
              {team.region} Region
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
