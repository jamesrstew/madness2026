'use client';

import { useEffect, useRef } from 'react';
import { useBracket } from '@/lib/bracket/state';
import { matchResultsToMatchups, hasResultsChanged } from '@/lib/bracket/actual-results';
import type { EspnGameResult } from '@/lib/api/espn';

const POLL_INTERVAL_DEFAULT = 5 * 60 * 1000; // 5 minutes
const POLL_INTERVAL_LIVE = 30 * 1000; // 30 seconds when games in progress

export function useActualResults() {
  const { state, dispatch } = useBracket();

  // Use refs to access current values inside the polling callback
  // without re-creating the callback or restarting the timer on every render.
  const matchupsRef = useRef(state.matchups);
  matchupsRef.current = state.matchups;

  const dispatchRef = useRef(dispatch);
  dispatchRef.current = dispatch;

  const hasLiveGames = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (state.matchups.size === 0) return;

    let cancelled = false;

    async function poll() {
      const matchups = matchupsRef.current;
      if (matchups.size === 0) return;

      try {
        const res = await fetch('/api/scores');
        if (!res.ok) return;
        const espnResults: EspnGameResult[] = await res.json();
        if (!espnResults.length) return;

        const matched = matchResultsToMatchups(matchups, espnResults);
        if (matched.size === 0) return;

        // Track if any games are in progress for adaptive polling
        hasLiveGames.current = espnResults.some((r) => r.status === 'in_progress');

        // Diff before dispatching to avoid unnecessary re-renders
        if (!hasResultsChanged(matchupsRef.current, matched)) return;

        dispatchRef.current({ type: 'APPLY_ACTUAL_RESULTS', results: matched });
      } catch {
        // Silently fail — will retry on next poll
      }
    }

    function scheduleNext() {
      if (cancelled) return;
      const delay = hasLiveGames.current ? POLL_INTERVAL_LIVE : POLL_INTERVAL_DEFAULT;
      timeoutRef.current = setTimeout(async () => {
        await poll();
        scheduleNext();
      }, delay);
    }

    // Fetch immediately, then start the setTimeout chain
    poll().then(scheduleNext);

    return () => {
      cancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // Only re-run when bracket first loads (size goes from 0 → N).
    // The ref pattern ensures poll() always reads current matchups.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.matchups.size > 0]);
}
