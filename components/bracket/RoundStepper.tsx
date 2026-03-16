'use client';

import type { Round } from '@/lib/types/bracket';

interface RoundStepperProps {
  rounds: Round[];
  currentRound: Round;
  visibleRounds: Round[];
  completionByRound: Map<Round, { done: number; total: number }>;
  onNavigate: (round: Round) => void;
}

const ROUND_ABBREVS: Record<Round, string> = {
  FIRST_FOUR: 'FF',
  R64: 'R64',
  R32: 'R32',
  S16: 'S16',
  E8: 'E8',
  FF: 'F4',
  CHAMPIONSHIP: 'CH',
};

function StepIndicator({
  done,
  total,
  isVisible,
  isCurrent,
}: {
  done: number;
  total: number;
  isVisible: boolean;
  isCurrent: boolean;
}) {
  if (total === 0) {
    return (
      <div className="h-3 w-3 rounded-full border border-rule/50 bg-transparent" />
    );
  }

  const fraction = done / total;

  if (fraction >= 1) {
    return (
      <div className="flex h-3 w-3 items-center justify-center rounded-full bg-old-gold">
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
          <path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }

  if (fraction > 0) {
    return (
      <div
        className={`h-3 w-3 rounded-full border-2 ${
          isCurrent ? 'border-old-gold' : 'border-old-gold/60'
        }`}
        style={{
          background: `conic-gradient(var(--color-old-gold) ${fraction * 360}deg, transparent ${fraction * 360}deg)`,
        }}
      />
    );
  }

  return (
    <div
      className={`h-3 w-3 rounded-full border ${
        isVisible ? 'border-ink-faint' : 'border-rule'
      }`}
    />
  );
}

export default function RoundStepper({
  rounds,
  currentRound,
  visibleRounds,
  completionByRound,
  onNavigate,
}: RoundStepperProps) {
  // Compute overall completion
  let totalDone = 0;
  let totalAll = 0;
  for (const { done, total } of completionByRound.values()) {
    totalDone += done;
    totalAll += total;
  }
  const overallPct = totalAll === 0 ? 0 : Math.round((totalDone / totalAll) * 100);

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-2">
      <div className="flex items-center gap-0">
        {rounds.map((round, i) => {
          const comp = completionByRound.get(round) ?? { done: 0, total: 0 };
          const isVisible = visibleRounds.includes(round);
          const isCurrent = round === currentRound;

          return (
            <div key={round} className="flex items-center">
              <button
                onClick={() => onNavigate(round)}
                className={`flex flex-col items-center gap-1 px-2 py-1 transition-colors ${
                  isCurrent
                    ? 'text-old-gold'
                    : isVisible
                      ? 'text-ink-muted hover:text-ink'
                      : 'text-ink-faint hover:text-ink-muted'
                } ${isVisible ? 'border-b-2 border-old-gold/60' : 'border-b-2 border-transparent'}`}
              >
                <StepIndicator
                  done={comp.done}
                  total={comp.total}
                  isVisible={isVisible}
                  isCurrent={isCurrent}
                />
                <span className="text-[10px] font-medium uppercase tracking-wider">
                  {ROUND_ABBREVS[round]}
                </span>
              </button>

              {/* Connector line between steps */}
              {i < rounds.length - 1 && (
                <div className="h-px w-3 bg-rule" />
              )}
            </div>
          );
        })}
      </div>

      {/* Overall completion */}
      <div className="ml-auto flex items-center gap-2 pl-3">
        <div className="h-1 w-16 overflow-hidden bg-ink/[0.06]">
          <div
            className="h-full bg-old-gold transition-all duration-300"
            style={{ width: `${overallPct}%` }}
          />
        </div>
        <span className="font-mono text-[10px] text-ink-faint">{overallPct}%</span>
      </div>
    </div>
  );
}
