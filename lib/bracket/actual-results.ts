import type { Matchup, ActualResult } from '@/lib/types/bracket';
import type { EspnGameResult } from '@/lib/api/espn';

/**
 * Build a team-pair key for O(1) lookup.
 * Always orders IDs low-high so the same pair matches regardless of order.
 */
function pairKey(id1: number, id2: number): string {
  return id1 < id2 ? `${id1}-${id2}` : `${id2}-${id1}`;
}

/**
 * Match ESPN game results to bracket matchups.
 * Returns a map of matchupId → ActualResult.
 */
export function matchResultsToMatchups(
  matchups: Map<string, Matchup>,
  espnResults: EspnGameResult[],
): Map<string, ActualResult> {
  // Build team-pair → matchupId index for O(1) lookup
  const pairIndex = new Map<string, { matchupId: string; team1Id: number; team2Id: number }>();
  for (const [id, matchup] of matchups) {
    if (matchup.team1 && matchup.team2) {
      const key = pairKey(matchup.team1.id, matchup.team2.id);
      pairIndex.set(key, { matchupId: id, team1Id: matchup.team1.id, team2Id: matchup.team2.id });
    }
  }

  const results = new Map<string, ActualResult>();

  for (const game of espnResults) {
    const key = pairKey(game.team1Id, game.team2Id);
    const entry = pairIndex.get(key);
    if (!entry) continue;

    // Map ESPN team order to matchup's team1/team2 for correct score assignment
    let team1Score: number;
    let team2Score: number;
    if (game.team1Id === entry.team1Id) {
      team1Score = game.team1Score;
      team2Score = game.team2Score;
    } else {
      team1Score = game.team2Score;
      team2Score = game.team1Score;
    }

    results.set(entry.matchupId, {
      winnerId: game.winnerId,
      score: { team1Score, team2Score },
      status: game.status,
      statusDetail: game.statusDetail,
    });
  }

  return results;
}

/**
 * Check if any actual results have changed compared to current matchup data.
 * Returns false if nothing changed — prevents unnecessary re-renders.
 */
export function hasResultsChanged(
  currentMatchups: Map<string, Matchup>,
  newResults: Map<string, ActualResult>,
): boolean {
  for (const [matchupId, newResult] of newResults) {
    const matchup = currentMatchups.get(matchupId);
    if (!matchup) continue;

    const current = matchup.actualResult;
    if (!current) return true; // new result for a matchup that had none

    if (current.status !== newResult.status) return true;
    if (current.winnerId !== newResult.winnerId) return true;
    if (current.score.team1Score !== newResult.score.team1Score) return true;
    if (current.score.team2Score !== newResult.score.team2Score) return true;
    if (current.statusDetail !== newResult.statusDetail) return true;
  }

  return false;
}
