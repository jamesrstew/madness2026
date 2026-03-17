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
import {
  encodeBracket,
  decodeBracket,
  getBracketFromUrl,
  setBracketInUrl,
} from './url-encoding';

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

type BracketAction =
  | { type: 'SELECT_WINNER'; matchupId: string; winner: Team }
  | { type: 'RESET_BRACKET'; matchups: Matchup[] }
  | { type: 'LOAD_BRACKET'; matchups: Map<string, Matchup>; selections: Map<string, number> }
  | { type: 'AUTO_FILL'; predictions?: Map<string, { team1WinPct: number; team2WinPct: number }> }
  | { type: 'APPLY_URL_SELECTIONS'; urlSelections: Map<string, 'team1' | 'team2'> }
  | { type: 'SET_PREDICTIONS'; predictions: Map<string, { team1WinPct: number; team2WinPct: number }> };

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
      const preds = action.predictions;

      // Process rounds in order so winners propagate
      const roundOrder = ['FIRST_FOUR', 'R64', 'R32', 'S16', 'E8', 'FF', 'CHAMPIONSHIP'] as const;

      for (const round of roundOrder) {
        for (const [id, matchup] of matchups) {
          if (matchup.round !== round) continue;
          if (!matchup.team1 || !matchup.team2) continue;
          if (selections.has(id)) continue; // already picked

          // Look up prediction from the passed-in cache, then fall back to matchup fields
          const predKey = `${matchup.team1.id}-${matchup.team2.id}`;
          const pred = preds?.get(predKey);
          const prob1 = pred ? pred.team1WinPct : (matchup.winProb1 ?? 50);
          const prob2 = pred ? pred.team2WinPct : (matchup.winProb2 ?? 50);
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

    case 'APPLY_URL_SELECTIONS': {
      const matchups = new Map(state.matchups);
      const selections = new Map<string, number>();

      // Reset matchups to base state: keep only teams from initial bracket,
      // clear all winners and all teams placed by advancing from earlier rounds.
      for (const [id, m] of matchups) {
        if (m.round === 'FIRST_FOUR' || m.round === 'R64') {
          matchups.set(id, { ...m, winner: undefined });
        } else {
          matchups.set(id, { id: m.id, round: m.round, region: m.region });
        }
      }

      // Clear R64 slots that receive First Four winners (those team2s came from advancing)
      for (let i = 0; i < 4; i++) {
        const ffId = `FIRST_FOUR-${i}`;
        const targetR64Id = getNextMatchupId(ffId);
        if (targetR64Id) {
          const m = matchups.get(targetR64Id);
          if (m) {
            const slot = getNextMatchupSlot(ffId);
            matchups.set(targetR64Id, { ...m, [slot]: undefined });
          }
        }
      }

      // Apply URL picks round-by-round (same pattern as AUTO_FILL)
      const roundOrder = ['FIRST_FOUR', 'R64', 'R32', 'S16', 'E8', 'FF', 'CHAMPIONSHIP'] as const;

      for (const round of roundOrder) {
        for (const [id, matchup] of matchups) {
          if (matchup.round !== round) continue;
          if (!matchup.team1 || !matchup.team2) continue;

          const pick = action.urlSelections.get(id);
          if (!pick) continue;

          const winner = pick === 'team1' ? matchup.team1 : matchup.team2;
          matchups.set(id, { ...matchup, winner });
          selections.set(id, winner.id);

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

      const newState2: BracketState = { matchups, selections, completionPct: 0 };
      newState2.completionPct = computeCompletion(newState2);
      return newState2;
    }

    case 'SET_PREDICTIONS': {
      const matchups = new Map(state.matchups);
      let changed = false;

      for (const [predKey, pred] of action.predictions) {
        // predKey format: "${team1Id}-${team2Id}"
        // Find the matchup that has these two teams
        for (const [id, matchup] of matchups) {
          if (!matchup.team1 || !matchup.team2) continue;
          const key = `${matchup.team1.id}-${matchup.team2.id}`;
          if (key !== predKey) continue;

          // Only update if values actually changed
          if (matchup.winProb1 !== pred.team1WinPct || matchup.winProb2 !== pred.team2WinPct) {
            matchups.set(id, {
              ...matchup,
              winProb1: pred.team1WinPct,
              winProb2: pred.team2WinPct,
            });
            changed = true;
          }
          break;
        }
      }

      if (!changed) return state;
      return { ...state, matchups };
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
  const pendingUrlSelections = useRef<Map<string, 'team1' | 'team2'> | null>(null);
  const latestState = useRef(state);
  latestState.current = state;

  // Parse URL and load localStorage on mount
  useEffect(() => {
    const encoded = getBracketFromUrl();
    if (encoded) {
      const urlSels = decodeBracket(encoded);
      if (urlSels.size > 0) {
        pendingUrlSelections.current = urlSels;
      }
    }

    const saved = loadBracket();
    if (saved) {
      dispatch({
        type: 'LOAD_BRACKET',
        matchups: saved.matchups,
        selections: saved.selections,
      });
    }
  }, []);

  // Apply URL selections once matchups are loaded
  useEffect(() => {
    if (pendingUrlSelections.current && state.matchups.size > 0) {
      dispatch({
        type: 'APPLY_URL_SELECTIONS',
        urlSelections: pendingUrlSelections.current,
      });
      pendingUrlSelections.current = null;
    }
  }, [state.matchups.size]);

  // Debounced save to localStorage + URL sync on every state change
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveBracket(state.matchups, state.selections);
      setBracketInUrl(encodeBracket(state.selections, state.matchups));
    }, 500);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [state]);

  // Flush save to localStorage on unmount so no picks are lost during navigation
  useEffect(() => {
    return () => {
      saveBracket(latestState.current.matchups, latestState.current.selections);
    };
  }, []);

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
