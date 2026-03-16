import type { Matchup } from '@/lib/types/bracket';

// Bump version when team IDs or bracket structure changes
const STORAGE_KEY = 'madness2026_bracket_v2';

interface SerializedBracketState {
  matchups: [string, Matchup][];
  selections: [string, number][];
}

export function saveBracket(
  matchups: Map<string, Matchup>,
  selections: Map<string, number>,
): void {
  if (typeof window === 'undefined') return;
  try {
    const data: SerializedBracketState = {
      matchups: Array.from(matchups.entries()),
      selections: Array.from(selections.entries()),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or unavailable — silently fail
  }
}

export function loadBracket(): {
  matchups: Map<string, Matchup>;
  selections: Map<string, number>;
} | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data: SerializedBracketState = JSON.parse(raw);
    return {
      matchups: new Map(data.matchups),
      selections: new Map(data.selections),
    };
  } catch {
    return null;
  }
}

export function clearBracket(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
