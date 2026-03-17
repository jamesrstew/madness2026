'use client';

import { useEffect, useRef } from 'react';
import { useBracket } from '@/lib/bracket/state';
import { generateInitialBracket } from '@/lib/bracket/structure';
import { MOCK_TEAMS } from '@/lib/mock-data';
import type { Team } from '@/lib/types/team';

/**
 * Initializes the bracket with real tournament data (falling back to mock)
 * if it hasn't been loaded from localStorage yet.
 * Renders nothing — purely a side-effect component.
 */
export default function BracketInitializer() {
  const { state, dispatch } = useBracket();
  const skipResetRef = useRef(false);

  useEffect(() => {
    // If data was already loaded (e.g. from localStorage), mark the
    // in-flight fetch as stale so it won't overwrite the loaded state.
    if (state.matchups.size > 0) {
      skipResetRef.current = true;
      return;
    }

    skipResetRef.current = false;

    fetch('/api/teams')
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data: Team[]) => {
        if (skipResetRef.current) return;
        const teams = Array.isArray(data) && data.length > 0 ? data : MOCK_TEAMS;
        const matchups = generateInitialBracket(teams);
        dispatch({ type: 'RESET_BRACKET', matchups });
      })
      .catch(() => {
        if (skipResetRef.current) return;
        const matchups = generateInitialBracket(MOCK_TEAMS);
        dispatch({ type: 'RESET_BRACKET', matchups });
      });
  }, [state.matchups.size, dispatch]);

  return null;
}
