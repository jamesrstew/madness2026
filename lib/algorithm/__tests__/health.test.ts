import { describe, it, expect } from 'vitest';
import { assessTeamHealth, calculateHealthAdjustment } from '@/lib/algorithm/health';
import type { GameResult } from '@/lib/types/stats';

/**
 * Helper to build a GameResult with leaders for one game.
 */
function makeGame(
  pointsLeader: string,
  reboundsLeader: string,
  assistsLeader: string,
): GameResult {
  return {
    date: '2026-01-15',
    opponent: 'Opponent',
    score: 75,
    oppScore: 70,
    location: 'home',
    result: 'W',
    leaders: [
      { name: pointsLeader, shortName: pointsLeader.split(' ')[1] ?? pointsLeader, value: 20, category: 'points' },
      { name: reboundsLeader, shortName: reboundsLeader.split(' ')[1] ?? reboundsLeader, value: 8, category: 'rebounds' },
      { name: assistsLeader, shortName: assistsLeader.split(' ')[1] ?? assistsLeader, value: 5, category: 'assists' },
    ],
  };
}

/**
 * Build a season of N games where one player dominates all categories,
 * then the last `missingCount` games have a different player.
 */
function buildSeason(totalGames: number, missingCount: number): GameResult[] {
  const games: GameResult[] = [];
  const present = totalGames - missingCount;

  for (let i = 0; i < present; i++) {
    games.push(makeGame('Star Player', 'Star Player', 'Star Player'));
  }
  for (let i = 0; i < missingCount; i++) {
    games.push(makeGame('Backup Guy', 'Backup Guy', 'Backup Guy'));
  }
  return games;
}

describe('assessTeamHealth', () => {
  it('returns unknown for empty games array', () => {
    const result = assessTeamHealth([]);
    expect(result.score).toBe(1.0);
    expect(result.status).toBe('unknown');
    expect(result.players).toHaveLength(0);
  });

  it('returns unknown when fewer than 8 games have leader data', () => {
    const games = Array.from({ length: 5 }, () =>
      makeGame('Star Player', 'Star Player', 'Star Player'),
    );
    const result = assessTeamHealth(games);
    expect(result.score).toBe(1.0);
    expect(result.status).toBe('unknown');
  });

  it('returns healthy when all leaders are present in recent games', () => {
    // 30 games, star leads all of them → present in last 5
    const games = buildSeason(30, 0);
    const result = assessTeamHealth(games);
    expect(result.score).toBeGreaterThanOrEqual(0.95);
    expect(result.status).toBe('healthy');
    expect(result.players).toHaveLength(3); // points, rebounds, assists
    for (const p of result.players) {
      expect(p.status).toBe('available');
    }
  });

  it('detects missing star player as likely_out', () => {
    // Star leads 25 of 30 games, then gone for last 5
    const games: GameResult[] = [];
    for (let i = 0; i < 25; i++) {
      games.push(makeGame('Star Player', 'Star Player', 'Star Player'));
    }
    for (let i = 0; i < 5; i++) {
      games.push(makeGame('Backup Guy', 'Backup Guy', 'Backup Guy'));
    }
    const result = assessTeamHealth(games);

    // Should be degraded or worse
    expect(result.score).toBeLessThan(0.95);
    expect(result.status).not.toBe('healthy');

    // Star player should be detected
    const starPoints = result.players.find(
      (p) => p.name === 'Star Player' && p.category === 'points',
    );
    expect(starPoints).toBeDefined();
    expect(starPoints!.status).toBe('likely_out');
    expect(starPoints!.recentAppearances).toBe(0);
  });

  it('returns healthy-ish when star missed only 1 recent game', () => {
    // Star leads 28 of 30, present in 4 of last 5
    const games: GameResult[] = [];
    for (let i = 0; i < 25; i++) {
      games.push(makeGame('Star Player', 'Star Player', 'Star Player'));
    }
    // One game where backup leads
    games.push(makeGame('Backup Guy', 'Backup Guy', 'Backup Guy'));
    // Star back for the last 4
    for (let i = 0; i < 4; i++) {
      games.push(makeGame('Star Player', 'Star Player', 'Star Player'));
    }
    const result = assessTeamHealth(games);
    expect(result.score).toBeGreaterThanOrEqual(0.80);
  });

  it('handles games with no leader data gracefully', () => {
    const gamesWithData = Array.from({ length: 10 }, () =>
      makeGame('Star Player', 'Star Player', 'Star Player'),
    );
    // Add games without leader data
    const gamesWithout: GameResult[] = Array.from({ length: 5 }, () => ({
      date: '2026-01-15',
      opponent: 'Opponent',
      score: 75,
      oppScore: 70,
      location: 'home' as const,
      result: 'W' as const,
    }));
    const allGames = [...gamesWithData, ...gamesWithout];
    const result = assessTeamHealth(allGames);
    // Should analyze only the 10 games with data
    expect(result.status).toBe('healthy');
    expect(result.players[0]?.totalGamesWithData).toBe(10);
  });

  it('assigns correct category weights (points=0.55, rebounds=0.25, assists=0.20)', () => {
    // Only the points leader is missing → max impact on points category
    const games: GameResult[] = [];
    for (let i = 0; i < 25; i++) {
      games.push(makeGame('Star Scorer', 'Rebounder', 'Passer'));
    }
    for (let i = 0; i < 5; i++) {
      games.push(makeGame('Backup Scorer', 'Rebounder', 'Passer'));
    }
    const result = assessTeamHealth(games);

    const scorer = result.players.find((p) => p.category === 'points');
    const rebounder = result.players.find((p) => p.category === 'rebounds');
    const passer = result.players.find((p) => p.category === 'assists');

    expect(scorer!.status).toBe('likely_out');
    expect(rebounder!.status).toBe('available');
    expect(passer!.status).toBe('available');

    // Health score should reflect only the points leader absence
    // Points impact is dominant but rebounder/passer are healthy
    expect(result.score).toBeLessThan(0.95);
    expect(result.score).toBeGreaterThan(0.40);
  });
});

describe('calculateHealthAdjustment', () => {
  it('returns zero adjustments when either team is unknown', () => {
    const unknown = { score: 1.0, status: 'unknown' as const, players: [] };
    const healthy = { score: 0.95, status: 'healthy' as const, players: [] };

    expect(calculateHealthAdjustment(unknown, healthy)).toEqual({
      team1Adj: 0,
      team2Adj: 0,
    });
    expect(calculateHealthAdjustment(healthy, unknown)).toEqual({
      team1Adj: 0,
      team2Adj: 0,
    });
  });

  it('returns zero-sum adjustments (team1Adj + team2Adj = 0)', () => {
    const h1 = { score: 0.90, status: 'minor_concern' as const, players: [] };
    const h2 = { score: 0.70, status: 'degraded' as const, players: [] };

    const result = calculateHealthAdjustment(h1, h2);
    expect(result.team1Adj + result.team2Adj).toBeCloseTo(0, 10);
  });

  it('gives positive adjustment to healthier team', () => {
    const healthy = { score: 1.0, status: 'healthy' as const, players: [] };
    const degraded = { score: 0.60, status: 'degraded' as const, players: [] };

    const result = calculateHealthAdjustment(healthy, degraded);
    expect(result.team1Adj).toBeGreaterThan(0);
    expect(result.team2Adj).toBeLessThan(0);
  });

  it('caps adjustment at ±8% (increased from 4% to properly value star injuries)', () => {
    const best = { score: 1.0, status: 'healthy' as const, players: [] };
    const worst = { score: 0.0, status: 'significant_concern' as const, players: [] };

    const result = calculateHealthAdjustment(best, worst);
    expect(Math.abs(result.team1Adj)).toBeLessThanOrEqual(0.08);
    expect(Math.abs(result.team2Adj)).toBeLessThanOrEqual(0.08);
    // Should actually hit the cap with max health differential
    expect(Math.abs(result.team1Adj)).toBeCloseTo(0.08, 2);
  });

  it('returns zero when both teams are equally healthy', () => {
    const same = { score: 0.85, status: 'minor_concern' as const, players: [] };
    const result = calculateHealthAdjustment(same, same);
    expect(result.team1Adj).toBeCloseTo(0);
    expect(result.team2Adj).toBeCloseTo(0);
  });

  it('scales adjustment proportionally to health difference', () => {
    const h1 = { score: 1.0, status: 'healthy' as const, players: [] };
    const h2small = { score: 0.90, status: 'minor_concern' as const, players: [] };
    const h2large = { score: 0.50, status: 'significant_concern' as const, players: [] };

    const small = calculateHealthAdjustment(h1, h2small);
    const large = calculateHealthAdjustment(h1, h2large);

    expect(large.team1Adj).toBeGreaterThan(small.team1Adj);
  });
});
