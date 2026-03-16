'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { Matchup } from '@/lib/types/bracket';
import type { Team } from '@/lib/types/team';
import type { PredictionEntry } from '@/lib/bracket/predictions';
import { resolveTeamColors } from '@/lib/color-utils';

interface GameCardProps {
  matchup: Matchup;
  prediction?: PredictionEntry;
  predictionLoading?: boolean;
  onSelectWinner: (matchupId: string, teamId: number) => void;
  compact?: boolean;
}

const CONFIDENCE_STYLES: Record<string, string> = {
  'Dominant': 'border-emerald-600/40 text-emerald-700',
  'Strong favorite': 'border-emerald-500/30 text-emerald-600',
  'Clear favorite': 'border-sky-500/30 text-sky-600',
  'Slight edge': 'border-amber-500/30 text-amber-600',
  'Toss-up': 'border-ink-faint/40 text-ink-muted',
};

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-ink/[0.06] ${className ?? ''}`} />;
}

function TeamRow({
  team,
  isWinner,
  winPct,
  onSelect,
  compact,
  teamColor,
}: {
  team: Team;
  isWinner: boolean;
  winPct?: number;
  onSelect: () => void;
  compact?: boolean;
  teamColor: string;
}) {
  return (
    <motion.button
      onClick={onSelect}
      animate={isWinner ? { y: -1 } : { y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`group flex w-full items-center gap-2 border-l-2 px-2.5 transition-all ${
        compact ? 'py-1.5' : 'py-2'
      } ${
        isWinner
          ? 'border-old-gold bg-old-gold/10 text-ink'
          : 'border-transparent bg-paper text-ink/70 hover:bg-surface-alt hover:text-ink'
      }`}
      style={{ borderLeftColor: isWinner ? undefined : teamColor }}
    >
      <span className="flex-shrink-0 font-mono text-xs font-semibold text-ink-muted">
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
      <span className="min-w-0 flex-1 truncate text-left text-sm font-medium">
        {compact ? team.abbreviation : team.shortName}
      </span>
      {!compact && (
        <span className="hidden text-xs text-ink-faint sm:inline">
          {team.record.wins}-{team.record.losses}
        </span>
      )}
      {winPct != null && (
        <span className="flex-shrink-0 font-mono text-xs tabular-nums text-ink-faint">
          {Math.round(winPct)}%
        </span>
      )}
      <Link
        href={`/team/${team.id}`}
        onClick={(e) => e.stopPropagation()}
        className="flex-shrink-0 text-ink-faint opacity-0 transition-opacity hover:text-old-gold group-hover:opacity-100"
        title={`View ${team.shortName} profile`}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 7v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="8" cy="5" r="0.75" fill="currentColor" />
        </svg>
      </Link>
    </motion.button>
  );
}

function EmptySlot({ label, compact }: { label?: string; compact?: boolean }) {
  return (
    <div
      className={`flex items-center gap-2 border-l-2 border-rule/50 bg-ink/[0.02] px-2.5 ${
        compact ? 'py-1.5' : 'py-2'
      }`}
    >
      <div className="h-3 w-6 bg-ink/[0.06]" />
      <div className="h-3 flex-1 bg-ink/[0.06]" />
      {label && (
        <span className="text-[10px] text-ink-faint">{label}</span>
      )}
    </div>
  );
}

export default function GameCard({
  matchup,
  prediction,
  predictionLoading,
  onSelectWinner,
  compact,
}: GameCardProps) {
  const { id, team1, team2, winner } = matchup;

  // Fully empty state
  if (!team1 && !team2) {
    return (
      <div className="flex flex-col gap-px border border-rule/50 bg-surface-alt/30">
        <EmptySlot compact={compact} label="TBD" />
        <EmptySlot compact={compact} label="TBD" />
      </div>
    );
  }

  const { team1Color, team2Color } =
    team1 && team2
      ? resolveTeamColors(team1, team2)
      : { team1Color: team1?.color ?? '#888', team2Color: team2?.color ?? '#888' };

  const pct1 = prediction?.team1WinPct;
  const pct2 = prediction?.team2WinPct;

  const matchupUrl =
    team1 && team2
      ? `/matchup/${encodeURIComponent(
          team1.shortName.toLowerCase().replace(/\s+/g, '-'),
        )}-vs-${encodeURIComponent(team2.shortName.toLowerCase().replace(/\s+/g, '-'))}`
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-px border border-rule bg-surface overflow-hidden"
    >
      {/* Team rows */}
      {team1 ? (
        <TeamRow
          team={team1}
          isWinner={winner?.id === team1.id}
          winPct={pct1}
          onSelect={() => onSelectWinner(id, team1.id)}
          compact={compact}
          teamColor={team1Color}
        />
      ) : (
        <EmptySlot compact={compact} />
      )}

      {team2 ? (
        <TeamRow
          team={team2}
          isWinner={winner?.id === team2.id}
          winPct={pct2}
          onSelect={() => onSelectWinner(id, team2.id)}
          compact={compact}
          teamColor={team2Color}
        />
      ) : (
        <EmptySlot compact={compact} />
      )}

      {/* Tug-of-war bar */}
      {team1 && team2 && (
        <div className="flex h-1.5 w-full overflow-hidden">
          <motion.div
            className="h-full"
            style={{ backgroundColor: team1Color }}
            initial={{ width: '50%' }}
            animate={{ width: pct1 != null ? `${pct1}%` : '50%' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
          <motion.div
            className="h-full"
            style={{ backgroundColor: team2Color }}
            initial={{ width: '50%' }}
            animate={{ width: pct2 != null ? `${pct2}%` : '50%' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      )}

      {/* Verdict + confidence + analysis link (hidden in compact mode) */}
      {!compact && team1 && team2 && (
        <div className="space-y-1.5 px-2.5 py-2">
          {/* Verdict text */}
          {predictionLoading && !prediction ? (
            <Skeleton className="h-4 w-full" />
          ) : prediction?.verdict ? (
            <p className="line-clamp-2 text-xs italic leading-relaxed text-ink-muted">
              {prediction.verdict}
            </p>
          ) : null}

          {/* Confidence badge + analysis link */}
          <div className="flex items-center justify-between gap-2">
            {prediction?.confidence ? (
              <span
                className={`rounded-sm border px-2 py-0.5 text-[10px] font-medium ${
                  CONFIDENCE_STYLES[prediction.confidence] ?? CONFIDENCE_STYLES['Toss-up']
                }`}
              >
                {prediction.confidence}
              </span>
            ) : predictionLoading ? (
              <Skeleton className="h-4 w-20" />
            ) : (
              <span />
            )}

            {matchupUrl && (
              <Link
                href={matchupUrl}
                className="text-[10px] font-medium text-old-gold/70 transition-colors hover:text-old-gold"
              >
                Full Analysis &rarr;
              </Link>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
