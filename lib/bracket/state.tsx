'use client';

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import type { Matchup, BracketState } from '@/lib/types/bracket';
import type { Team } from '@/lib/types/team';
import { getNextMatchupId, getNextMatchupSlot } from './structure';
import { saveBracket, loadBracket } from './storage';

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

type BracketAction =
  | { type: 'SELECT_WINNER'; matchupId: string; winner: Team }
  | { type: 'RESET_BRACKET'; matchups: Matchup[] }
  | { type: 'LOAD_BRACKET'; matchups: Map<string, Matchup>; selections: Map<string, number> }
  | { type: 'AUTO_FILL' };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeCompletion(state: BracketState): number {
  // Total decidable matchups = all matchups that have two teams
  let total = 0;
  let selected = 0;
  for (const [id, matchup] of state.matchups) {
    if (matchup.team1 && matchup.team2) {
      total++;
      if (state.selections.has(id)) selected++;
    }
  }
  return total === 0 ? 0 : Math.round((selected / total) * 100);
}

/**
 * Recursively remove a team from downstream matchups when they are
 * deselected or replaced.
 */
function cascadeClear(
  matchups: Map<string, Matchup>,
  selections: Map<string, number>,
  fromId: string,
  teamId: number,
): void {
  const nextId = getNextMatchupId(fromId);
  if (!nextId) return;

  const next = matchups.get(nextId);
  if (!next) return;

  const slot = getNextMatchupSlot(fromId);
  const updated = { ...next };

  // Remove the team from the slot it occupied
  if (slot === 'team1' && updated.team1?.id === teamId) {
    updated.team1 = undefined;
  } else if (slot === 'team2' && updated.team2?.id === teamId) {
    updated.team2 = undefined;
  } else {
    return; // team wasn't here, stop cascading
  }

  // If this team was selected as winner here, clear that too
  if (selections.get(nextId) === teamId) {
    selections.delete(nextId);
    updated.winner = undefined;
    // Continue cascading
    cascadeClear(matchups, selections, nextId, teamId);
  }

  matchups.set(nextId, updated);
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function bracketReducer(state: BracketState, action: BracketAction): BracketState {
  switch (action.type) {
    case 'SELECT_WINNER': {
      const matchups = new Map(state.matchups);
      const selections = new Map(state.selections);
      const matchup = matchups.get(action.matchupId);
      if (!matchup) return state;

      const previousWinnerId = selections.get(action.matchupId);

      // If there was a previous winner that differs, cascade-clear them
      if (previousWinnerId !== undefined && previousWinnerId !== action.winner.id) {
        cascadeClear(matchups, selections, action.matchupId, previousWinnerId);
      }

      // Set the winner
      const updated = { ...matchup, winner: action.winner };
      matchups.set(action.matchupId, updated);
      selections.set(action.matchupId, action.winner.id);

      // Advance winner to next round
      const nextId = getNextMatchupId(action.matchupId);
      if (nextId) {
        const nextMatchup = matchups.get(nextId);
        if (nextMatchup) {
          const slot = getNextMatchupSlot(action.matchupId);
          matchups.set(nextId, { ...nextMatchup, [slot]: action.winner });
        }
      }

      const newState: BracketState = { matchups, selections, completionPct: 0 };
      newState.completionPct = computeCompletion(newState);
      return newState;
    }

    case 'RESET_BRACKET': {
      const matchups = new Map<string, Matchup>();
      for (const m of action.matchups) {
        matchups.set(m.id, m);
      }
      return { matchups, selections: new Map(), completionPct: 0 };
    }

    case 'LOAD_BRACKET': {
      const newState: BracketState = {
        matchups: new Map(action.matchups),
        selections: new Map(action.selections),
        completionPct: 0,
      };
      newState.completionPct = computeCompletion(newState);
      return newState;
    }

    case 'AUTO_FILL': {
      const matchups = new Map(state.matchups);
      const selections = new Map(state.selections);

      // Process rounds in order so winners propagate
      const roundOrder = ['FIRST_FOUR', 'R64', 'R32', 'S16', 'E8', 'FF', 'CHAMPIONSHIP'] as const;

      for (const round of roundOrder) {
        for (const [id, matchup] of matchups) {
          if (matchup.round !== round) continue;
          if (!matchup.team1 || !matchup.team2) continue;
          if (selections.has(id)) continue; // already picked

          const prob1 = matchup.winProb1 ?? 0.5;
          const prob2 = matchup.winProb2 ?? 0.5;
          const winner = prob1 >= prob2 ? matchup.team1 : matchup.team2;

          const updated = { ...matchup, winner };
          matchups.set(id, updated);
          selections.set(id, winner.id);

          // Advance to next round
          const nextId = getNextMatchupId(id);
          if (nextId) {
            const nextMatchup = matchups.get(nextId);
            if (nextMatchup) {
              const slot = getNextMatchupSlot(id);
              matchups.set(nextId, { ...nextMatchup, [slot]: winner });
            }
          }
        }
      }

      const newState: BracketState = { matchups, selections, completionPct: 0 };
      newState.completionPct = computeCompletion(newState);
      return newState;
    }

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface BracketContextValue {
  state: BracketState;
  dispatch: React.Dispatch<BracketAction>;
}

const BracketContext = createContext<BracketContextValue | null>(null);

const INITIAL_STATE: BracketState = {
  matchups: new Map(),
  selections: new Map(),
  completionPct: 0,
};

export function BracketProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(bracketReducer, INITIAL_STATE);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = loadBracket();
    if (saved) {
      dispatch({
        type: 'LOAD_BRACKET',
        matchups: saved.matchups,
        selections: saved.selections,
      });
    }
  }, []);

  // Debounced save to localStorage on every state change
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveBracket(state.matchups, state.selections);
    }, 500);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [state]);

  return (
    <BracketContext value={{ state, dispatch }}>
      {children}
    </BracketContext>
  );
}

export function useBracket(): BracketContextValue {
  const ctx = useContext(BracketContext);
  if (!ctx) {
    throw new Error('useBracket must be used within a BracketProvider');
  }
  return ctx;
}
