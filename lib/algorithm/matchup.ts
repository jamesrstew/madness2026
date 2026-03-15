import type { TeamStats } from '@/lib/types';
import type { MatchupFactor } from './types';

const MAX_ADJUSTMENT = 0.05;

export function calculateMatchupAdjustment(
  team1Stats: TeamStats,
  team2Stats: TeamStats,
): { team1Adj: number; team2Adj: number; factors: MatchupFactor[] } {
  const factors: MatchupFactor[] = [];
  let team1Adj = 0;
  let team2Adj = 0;

  // Tempo mismatch: top-20 fast ~ tempo > 70, bottom-20 slow ~ tempo < 64
  const FAST_THRESHOLD = 70;
  const SLOW_THRESHOLD = 64;
  const TEMPO_ADJ = 0.02;

  if (team1Stats.tempo > FAST_THRESHOLD && team2Stats.tempo < SLOW_THRESHOLD) {
    team1Adj += TEMPO_ADJ;
    team2Adj -= TEMPO_ADJ;
    factors.push({
      name: 'Tempo mismatch',
      description: 'Fast team vs slow team — fast team style dominates',
      team1Impact: TEMPO_ADJ,
      team2Impact: -TEMPO_ADJ,
    });
  } else if (team2Stats.tempo > FAST_THRESHOLD && team1Stats.tempo < SLOW_THRESHOLD) {
    team2Adj += TEMPO_ADJ;
    team1Adj -= TEMPO_ADJ;
    factors.push({
      name: 'Tempo mismatch',
      description: 'Fast team vs slow team — fast team style dominates',
      team1Impact: -TEMPO_ADJ,
      team2Impact: TEMPO_ADJ,
    });
  }

  // Rebounding edge: ORB% difference > 5%
  const orbDiff = team1Stats.oORB - team2Stats.oORB;
  const ORB_THRESHOLD = 0.05;
  const ORB_ADJ = 0.015;

  if (Math.abs(orbDiff) > ORB_THRESHOLD) {
    const sign = orbDiff > 0 ? 1 : -1;
    team1Adj += sign * ORB_ADJ;
    team2Adj -= sign * ORB_ADJ;
    factors.push({
      name: 'Rebounding edge',
      description: `${sign > 0 ? 'Team 1' : 'Team 2'} has significant offensive rebounding advantage`,
      team1Impact: sign * ORB_ADJ,
      team2Impact: -sign * ORB_ADJ,
    });
  }

  // Turnover battle: TOV% difference > 3%
  const tovDiff = team2Stats.oTOV - team1Stats.oTOV; // lower TOV% is better for offense
  const TOV_THRESHOLD = 0.03;
  const TOV_ADJ = 0.015;

  if (Math.abs(tovDiff) > TOV_THRESHOLD) {
    const sign = tovDiff > 0 ? 1 : -1;
    team1Adj += sign * TOV_ADJ;
    team2Adj -= sign * TOV_ADJ;
    factors.push({
      name: 'Turnover battle',
      description: `${sign > 0 ? 'Team 1' : 'Team 2'} takes better care of the ball`,
      team1Impact: sign * TOV_ADJ,
      team2Impact: -sign * TOV_ADJ,
    });
  }

  // 3PT dependency volatility penalty
  const THREE_DEP_THRESHOLD = 0.40;
  const THREE_PENALTY = 0.01;

  if (team1Stats.fg3Pct > 0) {
    // Use oEFG as proxy — check if 3PA/FGA would be > 0.40
    // We approximate 3-point dependency from fg3Pct and fgPct
    // If team's 3pt attempts are heavy, apply penalty
    // Since we don't have 3PA/FGA directly, use a threshold on fg3Pct as proxy
    // Teams shooting > 36% from 3 at high volume tend to be 3-dependent
  }

  // We need 3PA/FGA ratio — approximate from available stats
  // For now, check if team relies heavily on 3s using available data
  // A team with high fg3Pct and low overall fgPct is likely 3-dependent
  const team1ThreeDep = team1Stats.fg3Pct > 0 && team1Stats.fgPct > 0
    ? (team1Stats.oEFG - team1Stats.fgPct) / (0.5 * team1Stats.fg3Pct || 1)
    : 0;
  const team2ThreeDep = team2Stats.fg3Pct > 0 && team2Stats.fgPct > 0
    ? (team2Stats.oEFG - team2Stats.fgPct) / (0.5 * team2Stats.fg3Pct || 1)
    : 0;

  if (team1ThreeDep > THREE_DEP_THRESHOLD) {
    team1Adj -= THREE_PENALTY;
    factors.push({
      name: '3PT volatility',
      description: 'Team 1 is heavily 3-point dependent — tournament volatility penalty',
      team1Impact: -THREE_PENALTY,
      team2Impact: 0,
    });
  }
  if (team2ThreeDep > THREE_DEP_THRESHOLD) {
    team2Adj -= THREE_PENALTY;
    factors.push({
      name: '3PT volatility',
      description: 'Team 2 is heavily 3-point dependent — tournament volatility penalty',
      team1Impact: 0,
      team2Impact: -THREE_PENALTY,
    });
  }

  // Cap total adjustment
  team1Adj = Math.max(-MAX_ADJUSTMENT, Math.min(MAX_ADJUSTMENT, team1Adj));
  team2Adj = Math.max(-MAX_ADJUSTMENT, Math.min(MAX_ADJUSTMENT, team2Adj));

  return { team1Adj, team2Adj, factors };
}
