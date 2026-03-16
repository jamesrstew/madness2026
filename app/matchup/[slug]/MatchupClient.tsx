'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import type { Team } from '@/lib/types/team';
import type { TeamStats, Prediction, GameResult } from '@/lib/types';
import StatComparison from '@/components/matchup/StatComparison';
import AlgorithmBreakdown from '@/components/matchup/AlgorithmBreakdown';
import AnalysisReveal from '@/components/matchup/AnalysisReveal';
import TeamCard from '@/components/team/TeamCard';
import RecentForm from '@/components/team/RecentForm';
import SeasonLeaders from '@/components/team/SeasonLeaders';
import MarketInsight from '@/components/matchup/MarketInsight';
import TeamHealth from '@/components/matchup/TeamHealth';
import { getMatchupCommentary, getQuickVerdict } from '@/lib/commentary';
import { Skeleton } from '@/components/ui/Loading';
import { resolveTeamColors } from '@/lib/color-utils';
import { MOCK_TEAMS } from '@/lib/mock-data';
import { cachedClientFetch } from '@/lib/client-cache';

const STAT_KEYS: { key: keyof TeamStats; label: string; higherIsBetter: boolean; description: string }[] = [
  { key: 'adjOE', label: 'Adj. Off. Eff.', higherIsBetter: true, description: 'Points scored per 100 possessions, adjusted for opponent strength — the gold standard for measuring offense.' },
  { key: 'adjDE', label: 'Adj. Def. Eff.', higherIsBetter: false, description: 'Points allowed per 100 possessions, adjusted for opponent strength. Lower is better.' },
  { key: 'adjEM', label: 'Efficiency Margin', higherIsBetter: true, description: 'Offense minus defense efficiency. This single number best captures overall team dominance.' },
  { key: 'ppg', label: 'Points/Game', higherIsBetter: true, description: 'Average points scored per game. A raw measure of offensive output.' },
  { key: 'oppg', label: 'Opp. Points/Game', higherIsBetter: false, description: 'Average points allowed per game. Lower means a stingier defense.' },
  { key: 'oEFG', label: 'Off. eFG%', higherIsBetter: true, description: 'Effective field goal percentage on offense — accounts for 3-pointers being worth more. Above 54% is elite.' },
  { key: 'dEFG', label: 'Def. eFG%', higherIsBetter: false, description: 'Effective field goal percentage allowed on defense. Lower means opponents shoot poorly.' },
  { key: 'rpg', label: 'Rebounds/Game', higherIsBetter: true, description: 'Total rebounds per game. Controls second-chance points and limits opponent possessions.' },
  { key: 'apg', label: 'Assists/Game', higherIsBetter: true, description: 'Assists per game. Higher numbers indicate better ball movement and team offense.' },
  { key: 'tempo', label: 'Tempo', higherIsBetter: true, description: 'Possessions per 40 minutes. Faster teams push the pace; slower teams grind.' },
  { key: 'sos', label: 'Strength of Schedule', higherIsBetter: true, description: 'How tough the opponents were this season. Higher means a harder schedule — wins are more impressive.' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function findTeamBySlug(teams: Team[], slug: string): Team | undefined {
  const normalize = (s: string) => decodeURIComponent(s).toLowerCase().replace(/\s+/g, '-');
  const target = normalize(slug);
  return teams.find((t) => normalize(t.shortName) === target);
}

export default function MatchupClient({ slug }: { slug: string }) {
  const parts = slug.split('-vs-');

  const [allTeams, setAllTeams] = useState<Team[]>(MOCK_TEAMS);
  const [teamsLoaded, setTeamsLoaded] = useState(false);
  const [stats1, setStats1] = useState<TeamStats | undefined>(undefined);
  const [stats2, setStats2] = useState<TeamStats | undefined>(undefined);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [predictionLoading, setPredictionLoading] = useState(true);
  const [games1, setGames1] = useState<GameResult[]>([]);
  const [games2, setGames2] = useState<GameResult[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);

  // Fetch real team data (same source as bracket) with mock fallback.
  // Merge mock records for any team the API returns with 0-0 (e.g. stale cache).
  useEffect(() => {
    cachedClientFetch<Team[]>('/api/teams')
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const enriched = data.map((t) => {
            if (t.record && t.record.wins === 0 && t.record.losses === 0) {
              const mock = MOCK_TEAMS.find((m) => m.id === t.id);
              if (mock && mock.record.wins + mock.record.losses > 0) {
                return { ...t, record: mock.record };
              }
            }
            return t;
          });
          setAllTeams(enriched);
        }
      })
      .catch(() => {})
      .finally(() => setTeamsLoaded(true));
  }, []);

  const team1 = findTeamBySlug(allTeams, parts[0] ?? '');
  const team2 = findTeamBySlug(allTeams, parts[1] ?? '');

  useEffect(() => {
    if (!teamsLoaded || !team1 || !team2) return;
    setPredictionLoading(true);
    setGamesLoading(true);

    // Fetch real stats from API — cached so back-navigation is instant
    cachedClientFetch<TeamStats>(`/api/stats?teamId=${team1.id}`)
      .then((data) => setStats1(data))
      .catch(() => {});
    cachedClientFetch<TeamStats>(`/api/stats?teamId=${team2.id}`)
      .then((data) => setStats2(data))
      .catch(() => {});

    // Infer round from seed pairing and region context.
    // R64 seed pairings: 1v16, 8v9, 5v12, 4v13, 6v11, 3v14, 7v10, 2v15
    // If seeds don't match a R64 pairing, infer a later round.
    const R64_PAIRS = new Set(['1-16','16-1','8-9','9-8','5-12','12-5','4-13','13-4',
      '6-11','11-6','3-14','14-3','7-10','10-7','2-15','15-2']);
    const sameRegion = team1.region === team2.region;
    const inferredRegion = sameRegion ? team1.region : undefined;
    let inferredRound: string | undefined;
    if (team1.seed && team2.seed) {
      const pairKey = `${team1.seed}-${team2.seed}`;
      if (R64_PAIRS.has(pairKey)) {
        inferredRound = 'R64';
      } else if (sameRegion) {
        // Same region but not a R64 pair → later intra-region round
        // Could be R32, S16, or E8. Use seed sum as heuristic:
        // R32 pairs sum to 17 (1+16=17, 8+9=17), S16/E8 are mixed.
        const seedSum = team1.seed + team2.seed;
        if (seedSum <= 17) inferredRound = 'R32';
        else inferredRound = 'S16';
      } else {
        // Cross-region = Final Four or Championship
        inferredRound = 'FF';
      }
    }

    cachedClientFetch<Prediction>('/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        team1Id: team1.id,
        team2Id: team2.id,
        round: inferredRound,
        region: inferredRegion,
        _v: 3, // cache-bust: bump when prediction response shape changes
      }),
    })
      .then((data) => setPrediction(data))
      .catch(() => {})
      .finally(() => setPredictionLoading(false));

    Promise.all([
      cachedClientFetch<GameResult[]>(`/api/schedule?teamId=${team1.id}`, { ttl: 5 * 60 * 1000 })
        .then((data) => setGames1(Array.isArray(data) ? data : []))
        .catch(() => {}),
      cachedClientFetch<GameResult[]>(`/api/schedule?teamId=${team2.id}`, { ttl: 5 * 60 * 1000 })
        .then((data) => setGames2(Array.isArray(data) ? data : []))
        .catch(() => {}),
    ]).finally(() => setGamesLoading(false));
  }, [teamsLoaded, team1, team2]);

  if (!teamsLoaded) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="space-y-6">
          <Skeleton className="h-10 w-64 mx-auto" />
          <Skeleton className="h-28 w-full" />
        </div>
      </div>
    );
  }

  if (!team1 || !team2) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12 text-center">
        <h1 className="font-display text-2xl mb-4">Matchup Not Found</h1>
        <p className="text-ink-muted mb-6">
          Could not find one or both teams. Please select a matchup from the bracket.
        </p>
        <Link href="/bracket" className="text-old-gold hover:underline">
          Back to Bracket
        </Link>
      </div>
    );
  }

  if (!stats1 || !stats2) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="space-y-6">
          <Skeleton className="h-10 w-64 mx-auto" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-14 w-full" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const { team1Color, team2Color } = resolveTeamColors(team1, team2);

  const team1WinPct = prediction ? prediction.team1WinPct / 100 : 0.5;

  // Extract missing player names for commentary
  const team1MissingPlayers = prediction?.healthData?.team1Health.players
    .filter((p) => p.status === 'likely_out')
    .map((p) => p.name) ?? [];
  const team2MissingPlayers = prediction?.healthData?.team2Health.players
    .filter((p) => p.status === 'likely_out')
    .map((p) => p.name) ?? [];

  const commentary = getMatchupCommentary(
    team1.shortName,
    team2.shortName,
    team1WinPct,
    team1.seed,
    team2.seed,
    {
      team1Distance: prediction?.locationData?.team1Distance,
      team2Distance: prediction?.locationData?.team2Distance,
      coachingDiff: prediction?.factors.find((f) => f.name === 'Coaching Experience')?.team1Edge,
      coach1Name: prediction?.coach1Name,
      coach2Name: prediction?.coach2Name,
      team1HealthStatus: prediction?.healthData?.team1Health.status,
      team2HealthStatus: prediction?.healthData?.team2Health.status,
      team1MissingPlayers,
      team2MissingPlayers,
    },
  );

  const favoredTeam = team1WinPct >= 0.5 ? team1 : team2;
  const otherTeam = team1WinPct >= 0.5 ? team2 : team1;
  const favoredWinPct = team1WinPct >= 0.5 ? team1WinPct : 1 - team1WinPct;
  const favoredColor = team1WinPct >= 0.5 ? team1Color : team2Color;
  const verdict = getQuickVerdict(
    favoredTeam.shortName,
    otherTeam.shortName,
    favoredWinPct,
    team1.seed,
    team2.seed,
  );

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-12">
      <Link
        href="/bracket"
        className="inline-flex items-center gap-1.5 mb-4 sm:mb-8 text-sm text-ink-faint hover:text-old-gold transition-colors py-1 -ml-1 px-1"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
          <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to Bracket
      </Link>

      <motion.h1
        className="font-display text-2xl sm:text-3xl lg:text-4xl text-center mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {team1.shortName} vs {team2.shortName}
      </motion.h1>
      <p className="text-center text-base italic text-ink-muted mb-6 sm:mb-8 lg:mb-12">
        {team1.region === team2.region
          ? `${team1.region} Region Matchup`
          : 'Cross-Region Matchup'}
        {team1.seed && team2.seed && (
          <span> &middot; #{team1.seed} seed vs #{team2.seed} seed</span>
        )}
      </p>

      <motion.div
        className="space-y-6 sm:space-y-8 lg:space-y-12"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.1 } } }}
      >
        <motion.div variants={fadeUp}>
          <AnalysisReveal
            predictionLoading={predictionLoading}
            hasPrediction={!!prediction}
            favoredTeamName={favoredTeam.shortName}
            favoredWinPct={favoredWinPct}
            favoredColor={favoredColor}
            confidence={prediction?.confidence ?? 'Toss-up'}
            verdict={verdict}
            team1Name={team1.shortName}
            team2Name={team2.shortName}
            team1Color={team1Color}
            team2Color={team2Color}
            team1WinPct={team1WinPct}
            marketAvailable={prediction?.ensemble?.marketAvailable}
          />
        </motion.div>

        <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TeamCard team={team1} variant="compact" />
          <TeamCard team={team2} variant="compact" />
        </motion.div>

        <motion.div variants={fadeUp}>
          <h2 className="font-display text-xl mb-5">Head-to-Head Stats</h2>
          <StatComparison
            team1Name={team1.shortName}
            team2Name={team2.shortName}
            team1Stats={stats1}
            team2Stats={stats2}
            statKeys={STAT_KEYS}
            team1Color={team1Color}
            team2Color={team2Color}
          />
        </motion.div>

        {prediction && (
          <motion.div variants={fadeUp}>
            <AlgorithmBreakdown
              team1Name={team1.shortName}
              team2Name={team2.shortName}
              team1Color={team1Color}
              team2Color={team2Color}
              factors={prediction.factors}
              commentary={commentary}
            />
          </motion.div>
        )}

        {prediction?.ensemble && (
          <motion.div variants={fadeUp}>
            <MarketInsight
              ensemble={prediction.ensemble}
              team1Name={team1.shortName}
              team2Name={team2.shortName}
              team1Color={team1Color}
              team2Color={team2Color}
            />
          </motion.div>
        )}

        {gamesLoading ? (
          <motion.div variants={fadeUp} className="space-y-4">
            <Skeleton className="h-6 w-40" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          </motion.div>
        ) : (
          <>
            {(games1.length > 0 || games2.length > 0) && (
              <motion.div variants={fadeUp}>
                <h2 className="font-display text-xl mb-5">Season Leaders</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SeasonLeaders
                    games={games1}
                    teamName={team1.shortName}
                    teamColor={team1Color}
                  />
                  <SeasonLeaders
                    games={games2}
                    teamName={team2.shortName}
                    teamColor={team2Color}
                  />
                </div>
              </motion.div>
            )}

            {prediction?.healthData && (
              <motion.div variants={fadeUp}>
                <TeamHealth
                  healthData={prediction.healthData}
                  team1Name={team1.shortName}
                  team2Name={team2.shortName}
                  team1Color={team1Color}
                  team2Color={team2Color}
                />
              </motion.div>
            )}

            <motion.div variants={fadeUp}>
              <h2 className="font-display text-xl mb-5">Recent Games</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <RecentForm games={games1} teamName={team1.shortName} />
                <RecentForm games={games2} teamName={team2.shortName} />
              </div>
            </motion.div>
          </>
        )}
      </motion.div>
    </div>
  );
}
