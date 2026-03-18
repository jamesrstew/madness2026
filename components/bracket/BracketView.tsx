'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Region, Round, Matchup } from '@/lib/types/bracket';
import { useBracket } from '@/lib/bracket/state';
import { REGIONS, getNextMatchupId, getNextMatchupSlot } from '@/lib/bracket/structure';
import { usePredictions, type PredictionEntry } from '@/lib/bracket/predictions';
import { useBreakpointColumns } from '@/lib/hooks/useBreakpointColumns';
import RegionTabs from './RegionTabs';
import RoundStepper from './RoundStepper';
import RoundColumn from './RoundColumn';
import GameCard from './GameCard';
import ShareButton from './ShareButton';

type Tab = Region | 'Final Four';

const REGION_ROUNDS: Round[] = ['R64', 'R32', 'S16', 'E8'];
const FF_ROUNDS: Round[] = ['FF', 'CHAMPIONSHIP'];
const ALL_ROUNDS: Round[] = ['R64', 'R32', 'S16', 'E8', 'FF', 'CHAMPIONSHIP'];

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

function getMatchups(
  allMatchups: Map<string, Matchup>,
  region: Region | undefined,
  round: Round,
): Matchup[] {
  const result: Matchup[] = [];
  for (const [, m] of allMatchups) {
    if (m.round === round) {
      if (region === undefined || m.region === region) {
        result.push(m);
      }
    }
  }
  result.sort((a, b) => a.id.localeCompare(b.id));
  return result;
}

function getFirstFourMatchups(matchups: Map<string, Matchup>): Matchup[] {
  const result: Matchup[] = [];
  for (const [, m] of matchups) {
    if (m.round === 'FIRST_FOUR') result.push(m);
  }
  result.sort((a, b) => a.id.localeCompare(b.id));
  return result;
}

function computeRoundCompletion(
  matchups: Map<string, Matchup>,
  selections: Map<string, number>,
  region: Region | undefined,
  round: Round,
): { done: number; total: number } {
  let done = 0;
  let total = 0;
  for (const [id, m] of matchups) {
    if (m.round !== round) continue;
    if (region !== undefined && m.region !== region) continue;
    if (m.team1 && m.team2) {
      total++;
      if (selections.has(id)) done++;
    }
  }
  return { done, total };
}

// ─────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────

export default function BracketView() {
  const { state, dispatch } = useBracket();
  const columnCount = useBreakpointColumns();
  const compact = columnCount <= 2;

  const [activeTab, setActiveTab] = useState<Tab>('East');
  const [windowStart, setWindowStart] = useState(0);
  const [firstFourOpen, setFirstFourOpen] = useState(true);
  const [autoFillLoading, setAutoFillLoading] = useState(false);

  const { predictions, fetchForMatchups, addToCache, isLoading: predictionsLoading, version } = usePredictions();

  // Compute rounds for current tab
  const activeRounds = activeTab === 'Final Four' ? FF_ROUNDS : REGION_ROUNDS;
  const activeRegion: Region | undefined =
    activeTab === 'Final Four' ? undefined : activeTab;

  // Clamp windowStart when tab or columnCount changes
  useEffect(() => {
    setWindowStart((prev) => {
      const max = Math.max(0, activeRounds.length - columnCount);
      return Math.min(prev, max);
    });
  }, [activeTab, columnCount, activeRounds.length]);

  // Reset window when tab changes
  useEffect(() => {
    setWindowStart(0);
  }, [activeTab]);

  // Visible round window
  const visibleRounds = useMemo(
    () => activeRounds.slice(windowStart, windowStart + columnCount),
    [activeRounds, windowStart, columnCount],
  );

  // Collect matchups for visible columns
  const columnData = useMemo(() => {
    return visibleRounds.map((round) => {
      const matchups = getMatchups(state.matchups, activeRegion, round);
      const comp = computeRoundCompletion(state.matchups, state.selections, activeRegion, round);
      return { round, matchups, ...comp };
    });
  }, [visibleRounds, state.matchups, state.selections, activeRegion]);

  // Fetch predictions for visible matchups
  useEffect(() => {
    const allVisible: Matchup[] = [];
    for (const col of columnData) {
      allVisible.push(...col.matchups);
    }
    if (allVisible.length > 0) {
      fetchForMatchups(allVisible);
    }
  }, [columnData, fetchForMatchups]);

  // Also fetch predictions for First Four if open
  const firstFourMatchups = useMemo(
    () => getFirstFourMatchups(state.matchups),
    [state.matchups],
  );

  useEffect(() => {
    if (firstFourOpen && firstFourMatchups.length > 0) {
      fetchForMatchups(firstFourMatchups);
    }
  }, [firstFourOpen, firstFourMatchups, fetchForMatchups]);

  // Sync predictions back to matchup state so AUTO_FILL and display use the same data
  useEffect(() => {
    if (predictions.size === 0) return;
    dispatch({ type: 'SET_PREDICTIONS', predictions });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, dispatch]);

  // Auto-collapse First Four when all picked
  useEffect(() => {
    if (firstFourMatchups.length === 0) return;
    const allPicked = firstFourMatchups.every((m) => state.selections.has(m.id));
    if (allPicked) setFirstFourOpen(false);
  }, [firstFourMatchups, state.selections]);

  // Completion maps for tabs and stepper
  const completionByRegion = useMemo(() => {
    const map = new Map<Tab, { done: number; total: number }>();
    for (const region of REGIONS) {
      let done = 0;
      let total = 0;
      for (const round of REGION_ROUNDS) {
        const c = computeRoundCompletion(state.matchups, state.selections, region, round);
        done += c.done;
        total += c.total;
      }
      map.set(region, { done, total });
    }
    // Final Four
    let ffDone = 0;
    let ffTotal = 0;
    for (const round of FF_ROUNDS) {
      const c = computeRoundCompletion(state.matchups, state.selections, undefined, round);
      ffDone += c.done;
      ffTotal += c.total;
    }
    map.set('Final Four', { done: ffDone, total: ffTotal });
    return map;
  }, [state.matchups, state.selections]);

  const completionByRound = useMemo(() => {
    const map = new Map<Round, { done: number; total: number }>();
    for (const round of activeRounds) {
      map.set(round, computeRoundCompletion(state.matchups, state.selections, activeRegion, round));
    }
    return map;
  }, [activeRounds, state.matchups, state.selections, activeRegion]);

  // Handlers
  const handleSelectWinner = useCallback(
    (matchupId: string, teamId: number) => {
      const matchup = state.matchups.get(matchupId);
      if (!matchup) return;
      // Lock guard: don't allow picks on games with actual results
      if (matchup.actualResult?.status === 'final' || matchup.actualResult?.status === 'in_progress') return;
      const winner = matchup.team1?.id === teamId ? matchup.team1 : matchup.team2;
      if (!winner) return;
      dispatch({ type: 'SELECT_WINNER', matchupId, winner });
    },
    [state.matchups, dispatch],
  );

  const handleAutoFill = async () => {
    setAutoFillLoading(true);
    try {
      // Simulate the bracket round-by-round, fetching predictions for each
      // round before picking winners. This ensures later-round matchups
      // (whose teams depend on earlier picks) get real predictions.
      const simMatchups = new Map(state.matchups);
      const simSelections = new Map(state.selections);
      const fetched = new Map<string, PredictionEntry>();
      const roundOrder: Round[] = ['FIRST_FOUR', 'R64', 'R32', 'S16', 'E8', 'FF', 'CHAMPIONSHIP'];

      for (const round of roundOrder) {
        // Collect matchups in this round that still need a pick
        const undecided: Matchup[] = [];
        for (const [id, m] of simMatchups) {
          if (m.round !== round || !m.team1 || !m.team2 || simSelections.has(id)) continue;
          undecided.push(m);
        }
        if (undecided.length === 0) continue;

        // Batch-fetch predictions for any matchups not already cached
        const toFetch = undecided.filter((m) => {
          const key = `${m.team1!.id}-${m.team2!.id}`;
          return !predictions.has(key) && !fetched.has(key);
        });

        if (toFetch.length > 0) {
          const { getQuickVerdict } = await import('@/lib/commentary');
          const results = await Promise.allSettled(
            toFetch.map(async (m) => {
              const res = await fetch('/api/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  team1Id: m.team1!.id,
                  team2Id: m.team2!.id,
                  round: m.round,
                  region: m.region,
                }),
              });
              if (!res.ok) throw new Error(`${res.status}`);
              const data = await res.json();
              const key = `${m.team1!.id}-${m.team2!.id}`;
              const favored = data.team1WinPct >= data.team2WinPct ? m.team1! : m.team2!;
              const other = favored.id === m.team1!.id ? m.team2! : m.team1!;
              const favoredPct = Math.max(data.team1WinPct, data.team2WinPct) / 100;
              const entry: PredictionEntry = {
                team1WinPct: data.team1WinPct,
                team2WinPct: data.team2WinPct,
                confidence: data.confidence,
                verdict: getQuickVerdict(favored.shortName, other.shortName, favoredPct, favored.seed, other.seed),
              };
              return { key, entry };
            }),
          );

          for (const r of results) {
            if (r.status === 'fulfilled') {
              fetched.set(r.value.key, r.value.entry);
            }
          }
        }

        // Pick winners for this round and advance them
        for (const m of undecided) {
          const key = `${m.team1!.id}-${m.team2!.id}`;
          const pred = fetched.get(key) ?? predictions.get(key);
          const prob1 = pred ? pred.team1WinPct : (m.winProb1 ?? 50);
          const prob2 = pred ? pred.team2WinPct : (m.winProb2 ?? 50);
          const winner = prob1 >= prob2 ? m.team1! : m.team2!;

          simMatchups.set(m.id, { ...m, winner });
          simSelections.set(m.id, winner.id);

          const nextId = getNextMatchupId(m.id);
          if (nextId) {
            const next = simMatchups.get(nextId);
            if (next) {
              const slot = getNextMatchupSlot(m.id);
              simMatchups.set(nextId, { ...next, [slot]: winner });
            }
          }
        }
      }

      // Merge fetched predictions into the display cache
      addToCache(fetched);

      // Build the complete predictions map (existing cache + newly fetched)
      const allPreds = new Map(predictions);
      for (const [k, v] of fetched) allPreds.set(k, v);

      // Dispatch with complete predictions so the reducer gets all the data
      dispatch({ type: 'AUTO_FILL', predictions: allPreds });
    } finally {
      setAutoFillLoading(false);
    }
  };

  const handleReset = () => {
    const matchups: Matchup[] = [];
    for (const [, m] of state.matchups) {
      if (m.round === 'R64' || m.round === 'FIRST_FOUR') {
        matchups.push({ ...m, winner: undefined });
      } else {
        matchups.push({ id: m.id, round: m.round, region: m.region });
      }
    }
    dispatch({ type: 'RESET_BRACKET', matchups });
  };

  const handleRoundNavigate = (round: Round) => {
    const idx = activeRounds.indexOf(round);
    if (idx < 0) return;
    const max = Math.max(0, activeRounds.length - columnCount);
    setWindowStart(Math.min(idx, max));
  };

  // Auto-advance prompt
  const leftmostRound = visibleRounds[0];
  const leftComp = leftmostRound
    ? computeRoundCompletion(state.matchups, state.selections, activeRegion, leftmostRound)
    : null;
  const canAdvance =
    leftComp &&
    leftComp.total > 0 &&
    leftComp.done === leftComp.total &&
    windowStart + columnCount < activeRounds.length;

  const nextRoundLabel = canAdvance
    ? activeRounds[windowStart + 1]
    : null;

  // Champion detection
  const championshipMatchups = getMatchups(state.matchups, undefined, 'CHAMPIONSHIP');
  const champion = championshipMatchups[0]?.winner;

  return (
    <div id="bracket-container" className="flex flex-col gap-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleAutoFill}
          disabled={autoFillLoading}
          className="border border-old-gold bg-old-gold/10 px-4 py-2 text-sm font-medium text-old-gold transition-colors hover:bg-old-gold/20 disabled:cursor-wait disabled:opacity-60"
        >
          {autoFillLoading ? 'Filling bracket\u2026' : 'Auto-fill Bracket'}
        </button>
        <button
          onClick={handleReset}
          className="border border-rule px-4 py-2 text-sm font-medium text-ink-muted transition-colors hover:border-ink-faint hover:text-ink"
        >
          Reset
        </button>
        <ShareButton />
      </div>

      {/* First Four (collapsible) */}
      {firstFourMatchups.length > 0 && (
        <div className="border border-rule bg-surface">
          <button
            onClick={() => setFirstFourOpen((o) => !o)}
            className="flex w-full items-center justify-between px-4 py-2.5"
          >
            <span className="text-sm font-medium text-ink-muted">
              First Four
              <span className="ml-2 font-mono text-[10px] text-ink-faint">
                {firstFourMatchups.filter((m) => state.selections.has(m.id)).length}/
                {firstFourMatchups.filter((m) => m.team1 && m.team2).length}
              </span>
            </span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              className={`text-ink-faint transition-transform ${firstFourOpen ? 'rotate-180' : ''}`}
            >
              <path
                d="M4 6l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <AnimatePresence>
            {firstFourOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 gap-3 px-4 pb-4 sm:grid-cols-2">
                  {firstFourMatchups.map((m) => {
                    const key =
                      m.team1 && m.team2
                        ? `${m.team1.id}-${m.team2.id}`
                        : null;
                    return (
                      <GameCard
                        key={m.id}
                        matchup={m}
                        prediction={key ? predictions.get(key) : undefined}
                        predictionLoading={predictionsLoading}
                        onSelectWinner={handleSelectWinner}
                        compact={compact}
                      />
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Region Tabs */}
      <RegionTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        completionByRegion={completionByRegion}
      />

      {/* Round Stepper */}
      <RoundStepper
        rounds={activeRounds}
        currentRound={visibleRounds[0] ?? activeRounds[0]}
        visibleRounds={visibleRounds}
        completionByRound={completionByRound}
        onNavigate={handleRoundNavigate}
      />

      {/* Auto-advance banner */}
      <AnimatePresence>
        {canAdvance && nextRoundLabel && (
          <motion.button
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onClick={() => setWindowStart((w) => Math.min(w + 1, activeRounds.length - columnCount))}
            className="flex w-full items-center justify-center gap-2 border border-old-gold/30 bg-old-gold/[0.06] px-4 py-2 text-sm text-old-gold transition-colors hover:bg-old-gold/10"
          >
            <span>All picks made — advance to next round</span>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M6 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Column grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeTab}-${windowStart}`}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.25 }}
          className="grid gap-4"
          style={{
            gridTemplateColumns: `repeat(${columnData.length}, minmax(0, 1fr))`,
          }}
        >
          {columnData.map((col) => (
            <RoundColumn
              key={col.round}
              matchups={col.matchups}
              predictions={predictions}
              predictionsLoading={predictionsLoading}
              onSelectWinner={handleSelectWinner}
              roundLabel={col.round}
              completionCount={col.done}
              totalCount={col.total}
              isActiveRound={col.round === visibleRounds[0]}
              compact={compact}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Champion celebration */}
      <AnimatePresence>
        {champion && activeTab === 'Final Four' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="flex flex-col items-center gap-3 border-2 border-old-gold bg-old-gold/[0.08] px-6 py-8"
          >
            <span className="text-[10px] font-medium uppercase tracking-widest text-old-gold">
              National Champion
            </span>
            <div className="flex items-center gap-3">
              <img
                src={champion.logo}
                alt={champion.shortName}
                width={48}
                height={48}
              />
              <span className="font-display text-2xl text-ink">
                {champion.shortName}
              </span>
            </div>
            <span className="text-sm text-ink-muted">
              ({champion.seed}) {champion.name} &bull; {champion.record.wins}-{champion.record.losses}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
