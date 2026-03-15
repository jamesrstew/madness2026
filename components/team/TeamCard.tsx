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
      className={`rounded-xl bg-navy border border-white/10 overflow-hidden ${
        isExpanded ? 'p-8' : 'p-4'
      }`}
      style={{ borderLeftColor: `#${team.color}`, borderLeftWidth: 4 }}
    >
      <div className={`flex items-center ${isExpanded ? 'gap-6' : 'gap-3'}`}>
        {/* Logo */}
        {team.logo && (
          <img
            src={team.logo}
            alt={team.name}
            className={isExpanded ? 'h-20 w-20' : 'h-10 w-10'}
          />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {team.seed !== undefined && (
              <span
                className="inline-flex items-center justify-center rounded-full bg-white/10 text-xs font-bold"
                style={{
                  width: isExpanded ? 28 : 22,
                  height: isExpanded ? 28 : 22,
                }}
              >
                {team.seed}
              </span>
            )}
            <h3
              className={`font-bold truncate ${
                isExpanded ? 'text-2xl' : 'text-sm'
              }`}
            >
              {team.name}
            </h3>
          </div>

          <div
            className={`text-gray-400 ${isExpanded ? 'text-sm mt-1' : 'text-xs'}`}
          >
            <span>{team.conference}</span>
            <span className="mx-1.5">|</span>
            <span>
              {team.record.wins}-{team.record.losses}
            </span>
          </div>

          {isExpanded && team.region && (
            <span className="mt-2 inline-block rounded-full bg-white/10 px-3 py-0.5 text-xs text-gray-300">
              {team.region} Region
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
