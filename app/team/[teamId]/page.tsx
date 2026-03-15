'use client';

import { use } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import type { GameResult } from '@/lib/types';
import TeamCard from '@/components/team/TeamCard';
import TeamStatsDisplay from '@/components/team/TeamStats';
import RecentForm from '@/components/team/RecentForm';
import { MOCK_TEAMS, MOCK_STATS } from '@/lib/mock-data';

function generateRecentGames(wins: number, losses: number): GameResult[] {
  const games: GameResult[] = [];
  const opponents = ['Team A', 'Team B', 'Team C', 'Team D', 'Team E', 'Team F', 'Team G', 'Team H', 'Team I', 'Team J'];
  const winRate = wins / (wins + losses);

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

export default function TeamPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const resolvedParams = use(params);
  const teamId = Number(resolvedParams.teamId);

  const team = MOCK_TEAMS.find((t) => t.id === teamId);
  const stats = MOCK_STATS.get(teamId);

  if (!team || !stats) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Team Not Found</h1>
        <p className="text-gray-400 mb-6">Could not find this team.</p>
        <Link href="/bracket" className="text-tournament-orange hover:underline">
          Back to Bracket
        </Link>
      </div>
    );
  }

  const games = generateRecentGames(team.record.wins, team.record.losses);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Link
        href="/bracket"
        className="inline-block mb-6 text-sm text-white/50 hover:text-tournament-orange transition-colors"
      >
        &larr; Back to Bracket
      </Link>

      <motion.div
        className="space-y-10"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.1 } } }}
      >
        {/* Team card (expanded) */}
        <motion.div variants={fadeUp}>
          <TeamCard team={team} variant="expanded" />
        </motion.div>

        {/* Stats */}
        <motion.div variants={fadeUp}>
          <h2 className="text-lg font-semibold mb-4">Team Statistics</h2>
          <TeamStatsDisplay stats={stats} />
        </motion.div>

        {/* Recent form */}
        <motion.div variants={fadeUp}>
          <RecentForm games={games} teamName={team.shortName} />
        </motion.div>
      </motion.div>
    </div>
  );
}
