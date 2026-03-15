'use client';

import { use, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import type { Team, TeamStats, Prediction, GameResult } from '@/lib/types';
import WinProbability from '@/components/matchup/WinProbability';
import StatComparison from '@/components/matchup/StatComparison';
import AlgorithmBreakdown from '@/components/matchup/AlgorithmBreakdown';
import TeamCard from '@/components/team/TeamCard';
import RecentForm from '@/components/team/RecentForm';
import { getMatchupCommentary } from '@/lib/commentary';
import { MOCK_TEAMS, MOCK_STATS } from '@/lib/mock-data';

const STAT_KEYS: { key: keyof TeamStats; label: string; higherIsBetter: boolean }[] = [
  { key: 'adjOE', label: 'Adj. Off. Eff.', higherIsBetter: true },
  { key: 'adjDE', label: 'Adj. Def. Eff.', higherIsBetter: false },
  { key: 'adjEM', label: 'Efficiency Margin', higherIsBetter: true },
  { key: 'ppg', label: 'Points/Game', higherIsBetter: true },
  { key: 'oppg', label: 'Opp. Points/Game', higherIsBetter: false },
  { key: 'oEFG', label: 'Off. eFG%', higherIsBetter: true },
  { key: 'dEFG', label: 'Def. eFG%', higherIsBetter: false },
  { key: 'rpg', label: 'Rebounds/Game', higherIsBetter: true },
  { key: 'apg', label: 'Assists/Game', higherIsBetter: true },
  { key: 'tempo', label: 'Tempo', higherIsBetter: true },
  { key: 'sos', label: 'Strength of Schedule', higherIsBetter: true },
];

function generateRecentGames(team: Team): GameResult[] {
  const games: GameResult[] = [];
  const opponents = ['Team A', 'Team B', 'Team C', 'Team D', 'Team E', 'Team F', 'Team G', 'Team H', 'Team I', 'Team J'];
  const winRate = team.record.wins / (team.record.wins + team.record.losses);

  for (let i = 0; i < 10; i++) {
    const isWin = Math.random() < winRate;
    const margin = Math.floor(Math.random() * 20) + 1;
    const baseScore = 70 + Math.floor(Math.random() * 15);
    games.push({
      date: `2026-03-${String(15 - i).padStart(2, '0')}`,
      opponent: opponents[i],
      score: isWin ? baseScore + margin : baseScore,
      oppScore: isWin ? baseScore : baseScore + margin,
      location: i % 3 === 0 ? 'away' : i % 3 === 1 ? 'home' : 'neutral',
      result: isWin ? 'W' : 'L',
    });
  }
  return games;
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function MatchupPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug ?? '';
  const [t1Id, t2Id] = slug.split('-vs-').map(Number);

  const team1 = MOCK_TEAMS.find((t) => t.id === t1Id);
  const team2 = MOCK_TEAMS.find((t) => t.id === t2Id);
  const stats1 = MOCK_STATS.get(t1Id);
  const stats2 = MOCK_STATS.get(t2Id);

  const [prediction, setPrediction] = useState<Prediction | null>(null);

  useEffect(() => {
    if (!team1 || !team2) return;
    fetch('/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ team1Id: team1.id, team2Id: team2.id }),
    })
      .then((res) => res.json())
      .then((data) => setPrediction(data))
      .catch(() => {});
  }, [team1, team2]);

  if (!team1 || !team2 || !stats1 || !stats2) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Matchup Not Found</h1>
        <p className="text-gray-400 mb-6">
          Could not find one or both teams. Please select a matchup from the bracket.
        </p>
        <Link href="/bracket" className="text-tournament-orange hover:underline">
          Back to Bracket
        </Link>
      </div>
    );
  }

  const team1WinPct = prediction ? prediction.team1WinPct / 100 : 0.5;
  const commentary = getMatchupCommentary(
    team1.shortName,
    team2.shortName,
    team1WinPct,
    team1.seed,
    team2.seed,
  );

  const games1 = generateRecentGames(team1);
  const games2 = generateRecentGames(team2);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Link
        href="/bracket"
        className="inline-block mb-6 text-sm text-white/50 hover:text-tournament-orange transition-colors"
      >
        &larr; Back to Bracket
      </Link>

      <motion.h1
        className="text-3xl font-extrabold text-center mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {team1.shortName} vs {team2.shortName}
      </motion.h1>
      <p className="text-center text-sm text-gray-400 mb-10">
        {team1.region === team2.region
          ? `${team1.region} Region Matchup`
          : 'Cross-Region Matchup'}
        {team1.seed && team2.seed && (
          <span> &middot; #{team1.seed} seed vs #{team2.seed} seed</span>
        )}
      </p>

      <motion.div
        className="space-y-10"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.1 } } }}
      >
        <motion.div variants={fadeUp}>
          <WinProbability
            team1Name={team1.shortName}
            team2Name={team2.shortName}
            team1Color={team1.color.startsWith('#') ? team1.color : `#${team1.color}`}
            team2Color={team2.color.startsWith('#') ? team2.color : `#${team2.color}`}
            team1WinPct={team1WinPct}
            confidence={prediction?.confidence ?? 'Toss-up'}
          />
        </motion.div>

        <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TeamCard team={team1} variant="compact" />
          <TeamCard team={team2} variant="compact" />
        </motion.div>

        <motion.div variants={fadeUp}>
          <h2 className="text-lg font-semibold mb-4">Head-to-Head Stats</h2>
          <StatComparison
            team1Name={team1.shortName}
            team2Name={team2.shortName}
            team1Stats={stats1}
            team2Stats={stats2}
            statKeys={STAT_KEYS}
          />
        </motion.div>

        {prediction && (
          <motion.div variants={fadeUp}>
            <AlgorithmBreakdown
              team1Name={team1.shortName}
              team2Name={team2.shortName}
              factors={prediction.factors}
              commentary={commentary}
            />
          </motion.div>
        )}

        <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <RecentForm games={games1} teamName={team1.shortName} />
          <RecentForm games={games2} teamName={team2.shortName} />
        </motion.div>
      </motion.div>
    </div>
  );
}
