'use client';

import { useRef, useState, useCallback } from 'react';
import type { Matchup } from '@/lib/types/bracket';
import type { Prediction } from '@/lib/types/prediction';

export interface PredictionEntry {
  team1WinPct: number;
  team2WinPct: number;
  confidence: Prediction['confidence'];
  verdict: string;
}

function cacheKey(a: number, b: number): string {
  return `${a}-${b}`;
}

/**
 * Hook that batch-fetches predictions for matchups and caches them.
 * Returns a stable Map of cached predictions plus a loading flag.
 *
 * Multiple calls to fetchForMatchups within the debounce window are
 * ACCUMULATED (not replaced) so that rapid sequential calls from
 * different useEffects don't cancel each other.
 */
export function usePredictions() {
  const cache = useRef(new Map<string, PredictionEntry>());
  const inflight = useRef(new Set<string>());
  const pending = useRef<Matchup[]>([]);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [version, setVersion] = useState(0);

  const fetchForMatchups = useCallback((matchups: Matchup[]) => {
    // Accumulate matchups instead of replacing — prevents debounce race
    // when multiple useEffects call this in the same render cycle.
    pending.current.push(...matchups);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      // Drain the pending queue
      const candidates = pending.current;
      pending.current = [];

      const toFetch: Matchup[] = [];

      for (const m of candidates) {
        if (!m.team1 || !m.team2) continue;
        const key = cacheKey(m.team1.id, m.team2.id);
        if (cache.current.has(key) || inflight.current.has(key)) continue;
        toFetch.push(m);
      }

      if (toFetch.length === 0) return;

      // Mark as inflight
      for (const m of toFetch) {
        inflight.current.add(cacheKey(m.team1!.id, m.team2!.id));
      }

      const promises = toFetch.map(async (m) => {
        const key = cacheKey(m.team1!.id, m.team2!.id);
        try {
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
          const data: Prediction = await res.json();

          const { getQuickVerdict } = await import('@/lib/commentary');
          const favored = data.team1WinPct >= data.team2WinPct ? m.team1! : m.team2!;
          const other = favored.id === m.team1!.id ? m.team2! : m.team1!;
          const favoredPct = Math.max(data.team1WinPct, data.team2WinPct) / 100;

          cache.current.set(key, {
            team1WinPct: data.team1WinPct,
            team2WinPct: data.team2WinPct,
            confidence: data.confidence,
            verdict: getQuickVerdict(
              favored.shortName,
              other.shortName,
              favoredPct,
              favored.seed,
              other.seed,
            ),
          });
        } catch {
          // Individual failure — leave uncached so it can be retried
        } finally {
          inflight.current.delete(key);
        }
      });

      await Promise.allSettled(promises);
      setVersion((v) => v + 1);
    }, 100);
  }, []);

  return {
    predictions: cache.current,
    fetchForMatchups,
    isLoading: inflight.current.size > 0,
    /** Opaque version counter — subscribe to trigger re-renders when predictions arrive */
    version,
  };
}
