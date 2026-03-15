'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Team } from '@/lib/types';

interface TeamSeedProps {
  team: Team;
  isWinner?: boolean;
  onClick?: () => void;
  compact?: boolean;
}

export default function TeamSeed({ team, isWinner, onClick, compact }: TeamSeedProps) {
  return (
    <div
      className={`flex items-center gap-2 rounded-md border-l-3 px-2 transition-all ${
        compact ? 'py-1 text-xs' : 'py-1.5 text-sm'
      } ${
        isWinner
          ? 'border-tournament-orange bg-tournament-orange/15 text-white'
          : 'border-white/20 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white'
      }`}
      style={{ borderLeftColor: isWinner ? undefined : team.color }}
    >
      <button onClick={onClick} className="flex items-center gap-2 flex-1 min-w-0">
        <span
          className={`flex-shrink-0 rounded bg-white/10 font-bold ${
            compact ? 'px-1 text-[10px]' : 'px-1.5 py-0.5 text-xs'
          }`}
        >
          {team.seed}
        </span>
        <Image
          src={team.logo}
          alt={team.abbreviation}
          width={compact ? 18 : 24}
          height={compact ? 18 : 24}
          className="flex-shrink-0"
          unoptimized
        />
        <span className="truncate font-medium">
          {compact ? team.abbreviation : team.shortName}
        </span>
      </button>
      <Link
        href={`/team/${team.id}`}
        onClick={(e) => e.stopPropagation()}
        className="flex-shrink-0 text-[10px] text-white/25 hover:text-tournament-orange transition-colors"
        title={`View ${team.shortName} profile`}
      >
        i
      </Link>
    </div>
  );
}
