'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { Matchup, ActualResult } from '@/lib/types/bracket';
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

// Determine the visual state of a team row given actual results
type TeamVisualState =
  | 'actual-winner'     // this team won (final)
  | 'actual-loser'      // this team lost (final)
  | 'wrong-pick'        // user picked this team but it lost
  | 'correct-pick'      // user picked this team and it won
  | 'in-progress'       // game is live
  | 'user-pick'         // user's pick, no result yet
  | 'default';          // no pick, no result

function getTeamVisualState(
  team: Team,
  actualResult: ActualResult | undefined,
  userPick: Team | undefined,
  winner: Team | undefined,
): TeamVisualState {
  if (actualResult?.status === 'in_progress') return 'in-progress';

  if (actualResult?.status === 'final') {
    const isActualWinner = actualResult.winnerId === team.id;
    const wasUserPick = userPick?.id === team.id;

    if (isActualWinner && wasUserPick) return 'correct-pick';
    if (isActualWinner) return 'actual-winner';
    if (wasUserPick) return 'wrong-pick';
    return 'actual-loser';
  }

  // No actual result yet
  if (winner?.id === team.id) return 'user-pick';
  return 'default';
}

function TeamRow({
  team,
  isWinner,
  winPct,
  score,
  onSelect,
  compact,
  teamColor,
  visualState,
  disabled,
}: {
  team: Team;
  isWinner: boolean;
  winPct?: number;
  score?: number;
  onSelect: () => void;
  compact?: boolean;
  teamColor: string;
  visualState: TeamVisualState;
  disabled: boolean;
}) {
  // Determine styles based on visual state
  let borderClass = 'border-transparent';
  let bgClass = 'bg-paper text-ink/70 hover:bg-surface-alt hover:text-ink';
  let borderStyle: React.CSSProperties = { borderLeftColor: teamColor };
  let nameClass = 'min-w-0 flex-1 truncate text-left text-sm font-medium';
  let showScore = false;
  let showLiveDot = false;
  let labelText = '';

  switch (visualState) {
    case 'actual-winner':
      borderClass = 'border-emerald-500';
      bgClass = 'bg-emerald-50 text-ink font-semibold';
      borderStyle = {};
      nameClass = 'min-w-0 flex-1 truncate text-left text-sm font-bold';
      showScore = true;
      break;
    case 'correct-pick':
      borderClass = 'border-emerald-500';
      bgClass = 'bg-emerald-50 text-ink font-semibold';
      borderStyle = {};
      nameClass = 'min-w-0 flex-1 truncate text-left text-sm font-bold';
      showScore = true;
      break;
    case 'actual-loser':
      borderClass = 'border-ink/10';
      bgClass = 'bg-paper text-ink/40';
      borderStyle = {};
      showScore = true;
      break;
    case 'wrong-pick':
      borderClass = 'border-red-400/50';
      bgClass = 'bg-red-50/30 text-ink/40';
      borderStyle = {};
      nameClass = 'min-w-0 flex-1 truncate text-left text-sm font-medium line-through';
      showScore = true;
      labelText = 'Your pick';
      break;
    case 'in-progress':
      borderClass = 'border-amber-400';
      bgClass = 'bg-amber-50/30 text-ink';
      borderStyle = {};
      showScore = true;
      showLiveDot = true;
      break;
    case 'user-pick':
      borderClass = 'border-old-gold';
      bgClass = 'bg-old-gold/10 text-ink';
      borderStyle = {};
      break;
    default:
      // 'default' — keep initial styles
      break;
  }

  const Tag = disabled ? 'div' : motion.button;

  return (
    <Tag
      {...(!disabled ? { onClick: onSelect } : {})}
      {...(!disabled
        ? {
            animate: isWinner ? { y: -1 } : { y: 0 },
            transition: { type: 'spring', stiffness: 300, damping: 25 },
          }
        : {})}
      className={`group flex w-full items-center gap-2 border-l-2 px-2.5 transition-all ${
        compact ? 'py-1.5' : 'py-2'
      } ${borderClass} ${bgClass} ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
      style={borderStyle}
    >
      {/* Live dot for in-progress games */}
      {showLiveDot && (
        <span className="relative flex h-2 w-2 flex-shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
        </span>
      )}
      <span className="flex-shrink-0 font-mono text-xs font-semibold text-ink-muted">
        {team.seed}
      </span>
      <Image
        src={team.logo}
        alt={team.abbreviation}
        width={compact ? 18 : 24}
        height={compact ? 18 : 24}
        className={`flex-shrink-0 ${visualState === 'actual-loser' || visualState === 'wrong-pick' ? 'opacity-40' : ''}`}
        unoptimized
      />
      <span className={nameClass}>
        {compact ? team.abbreviation : team.shortName}
      </span>

      {/* "Your pick" label for wrong picks */}
      {labelText && !compact && (
        <span className="flex-shrink-0 text-[9px] font-medium text-red-400/70">
          {labelText}
        </span>
      )}

      {/* Checkmark for correct picks */}
      {visualState === 'correct-pick' && (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 text-emerald-500">
          <path d="M4 8l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}

      {/* Score badge */}
      {showScore && score != null && (
        <span className={`flex-shrink-0 rounded px-1.5 py-0.5 font-mono text-xs font-bold tabular-nums ${
          visualState === 'actual-winner' || visualState === 'correct-pick'
            ? 'bg-emerald-100 text-emerald-700'
            : visualState === 'in-progress'
              ? 'bg-amber-100 text-amber-700'
              : 'bg-ink/[0.06] text-ink/40'
        }`}>
          {score}
        </span>
      )}

      {/* Win percentage (only when no actual result) */}
      {!showScore && winPct != null && (
        <span className="flex-shrink-0 font-mono text-xs tabular-nums text-ink-faint">
          {Math.round(winPct)}%
        </span>
      )}

      {/* Record (only in non-compact, no actual result) */}
      {!compact && !showScore && (
        <span className="hidden text-xs text-ink-faint sm:inline">
          {team.record.wins}-{team.record.losses}
        </span>
      )}

      <Link
        href={`/team/${team.id}`}
        onClick={(e) => e.stopPropagation()}
        className="flex-shrink-0 text-ink-faint opacity-60 sm:opacity-0 transition-opacity hover:text-old-gold group-hover:opacity-100"
        title={`View ${team.shortName} profile`}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 7v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="8" cy="5" r="0.75" fill="currentColor" />
        </svg>
      </Link>
    </Tag>
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
  const { id, team1, team2, winner, userPick, actualResult } = matchup;

  // Game is locked when there's an actual result (final or in progress)
  const isLocked = actualResult?.status === 'final' || actualResult?.status === 'in_progress';

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

  // Determine visual states for each team
  const team1State = team1 ? getTeamVisualState(team1, actualResult, userPick, winner) : 'default';
  const team2State = team2 ? getTeamVisualState(team2, actualResult, userPick, winner) : 'default';

  // Get scores for display
  const team1Score = actualResult ? actualResult.score.team1Score : undefined;
  const team2Score = actualResult ? actualResult.score.team2Score : undefined;

  // Format status detail for display
  const statusLabel = actualResult?.status === 'final'
    ? (actualResult.statusDetail ?? 'FINAL')
    : actualResult?.status === 'in_progress'
      ? (actualResult.statusDetail ?? 'LIVE')
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col gap-px border bg-surface overflow-hidden ${
        actualResult?.status === 'final'
          ? 'border-emerald-200'
          : actualResult?.status === 'in_progress'
            ? 'border-amber-300'
            : 'border-rule'
      }`}
    >
      {/* Team rows */}
      {team1 ? (
        <TeamRow
          team={team1}
          isWinner={winner?.id === team1.id}
          winPct={!actualResult ? pct1 : undefined}
          score={team1Score}
          onSelect={() => onSelectWinner(id, team1.id)}
          compact={compact}
          teamColor={team1Color}
          visualState={team1State}
          disabled={isLocked}
        />
      ) : (
        <EmptySlot compact={compact} />
      )}

      {team2 ? (
        <TeamRow
          team={team2}
          isWinner={winner?.id === team2.id}
          winPct={!actualResult ? pct2 : undefined}
          score={team2Score}
          onSelect={() => onSelectWinner(id, team2.id)}
          compact={compact}
          teamColor={team2Color}
          visualState={team2State}
          disabled={isLocked}
        />
      ) : (
        <EmptySlot compact={compact} />
      )}

      {/* Score bar / Tug-of-war bar */}
      {team1 && team2 && actualResult ? (
        // Show status label instead of tug-of-war when we have actual results
        // Individual score badges are on each team row, so no combined score here
        <div className={`flex items-center justify-center gap-1.5 px-2.5 py-1 text-[10px] font-medium ${
          actualResult.status === 'final'
            ? 'bg-emerald-50/50 text-emerald-600'
            : 'bg-amber-50/50 text-amber-600'
        }`}>
          {actualResult.status === 'in_progress' && (
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
            </span>
          )}
          <span>{statusLabel}</span>
        </div>
      ) : team1 && team2 ? (
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
      ) : null}

      {/* Verdict + confidence (hidden in compact mode, hidden when actual result exists) */}
      {!compact && team1 && team2 && !actualResult && (
        <div className="space-y-1.5 px-2.5 py-2">
          {predictionLoading && !prediction ? (
            <Skeleton className="h-4 w-full" />
          ) : prediction?.verdict ? (
            <p className="line-clamp-2 text-xs italic leading-relaxed text-ink-muted">
              {prediction.verdict}
            </p>
          ) : null}

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

      {/* Compact analysis link (mobile, only when no actual result) */}
      {compact && matchupUrl && !actualResult && (
        <Link
          href={matchupUrl}
          className="flex items-center justify-center gap-1 px-2.5 py-1.5 text-[10px] font-medium text-old-gold/70 transition-colors hover:text-old-gold"
        >
          Analyze
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      )}
    </motion.div>
  );
}
