'use client';

import { useEffect, useRef } from 'react';
import { useBracket } from '@/lib/bracket/state';
import { generateInitialBracket } from '@/lib/bracket/structure';
import { teamsNeedRefresh, markTeamsRefreshed } from '@/lib/bracket/storage';
import { MOCK_TEAMS } from '@/lib/mock-data';
import type { Team } from '@/lib/types/team';

/**
 * Initializes the bracket with real tournament data (falling back to mock)
 * if it hasn't been loaded from localStorage yet.
 *
 * When bracket data IS loaded from localStorage, fetches fresh team data
 * anyway and dispatches REFRESH_TEAMS to update records/stats in-place.
 *
 * Renders nothing — purely a side-effect component.
 */
export default function BracketInitializer() {
  const { state, dispatch } = useBracket();
  const skipResetRef = useRef(false);
  const refreshedRef = useRef(false);

  useEffect(() => {
    if (state.matchups.size > 0) {
      // Bracket loaded from localStorage — don't reset, but refresh team
      // data if it's older than the refresh interval (1 hour).
      skipResetRef.current = true;

      if (!refreshedRef.current && teamsNeedRefresh()) {
        refreshedRef.current = true;
        fetch('/api/teams')
          .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
          .then((data: Team[]) => {
            if (!Array.isArray(data) || data.length === 0) return;
            const teamsById = new Map(data.map((t) => [t.id, t]));
            dispatch({ type: 'REFRESH_TEAMS', teams: teamsById });
            markTeamsRefreshed();
          })
          .catch(() => {
            // Silently fail — stale team data is better than no bracket
          });
      }
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
        markTeamsRefreshed();
      })
      .catch(() => {
        if (skipResetRef.current) return;
        const matchups = generateInitialBracket(MOCK_TEAMS);
        dispatch({ type: 'RESET_BRACKET', matchups });
      });
  }, [state.matchups.size, dispatch]);

  return null;
}
