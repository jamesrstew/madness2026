import type { Matchup } from '@/lib/types/bracket';

// Bump version when team IDs or bracket structure changes
const STORAGE_KEY = 'golden_bracket_v2';

const TEAMS_REFRESHED_KEY = 'golden_bracket_teams_refreshed';
const TEAMS_REFRESH_INTERVAL = 60 * 60 * 1000; // 1 hour

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

/** Returns true if team data hasn't been refreshed within the refresh interval. */
export function teamsNeedRefresh(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const ts = localStorage.getItem(TEAMS_REFRESHED_KEY);
    if (!ts) return true;
    return Date.now() - Number(ts) > TEAMS_REFRESH_INTERVAL;
  } catch {
    return true;
  }
}

export function markTeamsRefreshed(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TEAMS_REFRESHED_KEY, String(Date.now()));
  } catch {
    // silently fail
  }
}
