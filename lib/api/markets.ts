/**
 * Prediction market API client — fetches NCAA tournament odds from Polymarket.
 *
 * Two data sources:
 * 1. Championship odds (tag_slug=cbb): "2026 NCAA Tournament Winner" — 90 team markets
 * 2. Game matchup odds (tag_slug=march-madness): Direct H2H game markets — ~32 games
 *
 * Game matchups are preferred when available (direct probability, no derivation needed).
 * Championship odds are the fallback (derive H2H via implied strength).
 */

import { cachedFetch } from './cache';
import { findMarketMatch } from '@/lib/data/team-name-mapping';

export const MARKET_TTL = 30 * 60 * 1000; // 30-minute cache

// ── Types ──────────────────────────────────────────────────

interface MarketOdds {
  probability: number;
  source: 'polymarket';
}

interface PolymarketEvent {
  id: string;
  title: string;
  slug: string;
  markets: PolymarketMarket[];
}

interface PolymarketMarket {
  id: string;
  question: string;
  outcomePrices: string;     // JSON: '["0.55","0.45"]'
  outcomes: string;          // JSON: '["Team A Mascots","Team B Mascots"]'
  groupItemTitle?: string;   // Team name (used in championship winner markets)
}

// ── Fetchers ───────────────────────────────────────────────

async function fetchPolymarketEvents(tagSlug: string, limit = 100): Promise<PolymarketEvent[]> {
  try {
    const url = `https://gamma-api.polymarket.com/events?closed=false&tag_slug=${tagSlug}&limit=${limit}`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    return (await res.json()) as PolymarketEvent[];
  } catch {
    return [];
  }
}

// ── Championship Odds ──────────────────────────────────────

function parseChampionshipOdds(events: PolymarketEvent[]): Map<string, MarketOdds> {
  const odds = new Map<string, MarketOdds>();

  for (const event of events) {
    if (!event.title.toLowerCase().includes('ncaa tournament winner')) continue;

    for (const market of event.markets) {
      // Championship markets: groupItemTitle is team name, outcomes are ["Yes","No"]
      const teamName = market.groupItemTitle ?? '';
      if (!teamName) continue;

      try {
        const prices = JSON.parse(market.outcomePrices) as string[];
        const outcomes = JSON.parse(market.outcomes) as string[];
        const yesIdx = outcomes.findIndex((o) => o.toLowerCase() === 'yes');
        if (yesIdx >= 0 && prices[yesIdx]) {
          const prob = parseFloat(prices[yesIdx]);
          if (!isNaN(prob) && prob > 0) {
            odds.set(teamName, { probability: prob, source: 'polymarket' });
          }
        }
      } catch {
        // Skip malformed data
      }
    }
  }

  return odds;
}

// ── Game Matchup Odds ──────────────────────────────────────

interface GameMatchup {
  team1Name: string;  // Full name from market (e.g., "Duke Blue Devils")
  team2Name: string;
  team1Prob: number;
  team2Prob: number;
}

function parseGameMatchups(events: PolymarketEvent[]): GameMatchup[] {
  const matchups: GameMatchup[] = [];

  for (const event of events) {
    // Game matchup events: title is "Team A Mascots vs. Team B Mascots"
    // Each event has exactly 1 market with 2 outcomes (the two teams)
    if (!event.title.includes(' vs. ') && !event.title.includes(' vs ')) continue;

    for (const market of event.markets) {
      try {
        const prices = JSON.parse(market.outcomePrices) as string[];
        const outcomes = JSON.parse(market.outcomes) as string[];

        if (outcomes.length === 2 && prices.length === 2) {
          const p1 = parseFloat(prices[0]);
          const p2 = parseFloat(prices[1]);
          if (!isNaN(p1) && !isNaN(p2)) {
            matchups.push({
              team1Name: outcomes[0],
              team2Name: outcomes[1],
              team1Prob: p1,
              team2Prob: p2,
            });
          }
        }
      } catch {
        // Skip malformed data
      }
    }
  }

  return matchups;
}

// ── Cached Fetchers ────────────────────────────────────────

async function getChampionshipOdds(): Promise<Map<string, MarketOdds>> {
  return cachedFetch('market:championship-odds', async () => {
    const events = await fetchPolymarketEvents('cbb');
    const odds = parseChampionshipOdds(events);
    if (odds.size === 0) throw new Error('No championship odds');
    return odds;
  }, MARKET_TTL).catch(() => new Map<string, MarketOdds>());
}

async function getGameMatchups(): Promise<GameMatchup[]> {
  return cachedFetch('market:game-matchups', async () => {
    const events = await fetchPolymarketEvents('march-madness', 100);
    const matchups = parseGameMatchups(events);
    if (matchups.length === 0) throw new Error('No game matchups');
    return matchups;
  }, MARKET_TTL).catch(() => [] as GameMatchup[]);
}

// ── Public API ─────────────────────────────────────────────

/**
 * Derive head-to-head matchup probability from championship odds.
 * P(A beats B) ≈ champOdds(A) / (champOdds(A) + champOdds(B))
 */
export function deriveMatchupFromChampionshipOdds(
  champProb1: number,
  champProb2: number,
): number {
  const sum = champProb1 + champProb2;
  if (sum <= 0) return 0.5;
  return champProb1 / sum;
}

/**
 * Get market-implied matchup probability for two teams.
 *
 * Strategy:
 * 1. First check direct game matchup markets (exact H2H probability)
 * 2. Fall back to championship odds (derived via implied strength)
 * 3. Return unavailable if neither source has data
 */
export async function getMatchupOdds(
  team1Name: string,
  team2Name: string,
): Promise<{ team1Prob: number; team2Prob: number; available: boolean }> {
  try {
    // Fetch both sources concurrently
    const [matchups, champOdds] = await Promise.all([
      getGameMatchups(),
      getChampionshipOdds(),
    ]);

    // Strategy 1: Direct game matchup (best signal — actual H2H market)
    if (matchups.length > 0) {
      for (const game of matchups) {
        // Check if this game involves our two teams (in either order)
        // Market names are like "Duke Blue Devils" — need fuzzy matching
        const m1MatchesT1 = findMarketMatch(team1Name, [game.team1Name]);
        const m1MatchesT2 = findMarketMatch(team2Name, [game.team2Name]);
        const m2MatchesT1 = findMarketMatch(team1Name, [game.team2Name]);
        const m2MatchesT2 = findMarketMatch(team2Name, [game.team1Name]);

        if (m1MatchesT1 && m1MatchesT2) {
          // team1 = game.team1, team2 = game.team2 → use prices directly
          return { team1Prob: game.team1Prob, team2Prob: game.team2Prob, available: true };
        }
        if (m2MatchesT1 && m2MatchesT2) {
          // team1 = game.team2, team2 = game.team1 → swap
          return { team1Prob: game.team2Prob, team2Prob: game.team1Prob, available: true };
        }
      }
    }

    // Strategy 2: Derive from championship odds
    if (champOdds.size > 0) {
      const marketNames = Array.from(champOdds.keys());
      const match1 = findMarketMatch(team1Name, marketNames);
      const match2 = findMarketMatch(team2Name, marketNames);

      if (match1 && match2) {
        const odds1 = champOdds.get(match1)!;
        const odds2 = champOdds.get(match2)!;
        const team1Prob = deriveMatchupFromChampionshipOdds(odds1.probability, odds2.probability);
        return { team1Prob, team2Prob: 1 - team1Prob, available: true };
      }
    }

    return { team1Prob: NaN, team2Prob: NaN, available: false };
  } catch {
    return { team1Prob: NaN, team2Prob: NaN, available: false };
  }
}
