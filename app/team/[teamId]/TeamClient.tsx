'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import type { Team } from '@/lib/types/team';
import type { GameResult, TeamStats } from '@/lib/types';
import TeamCard from '@/components/team/TeamCard';
import TeamStatsDisplay from '@/components/team/TeamStats';
import RecentForm from '@/components/team/RecentForm';
import SeasonLeaders from '@/components/team/SeasonLeaders';
import { Skeleton } from '@/components/ui/Loading';
import { MOCK_TEAMS } from '@/lib/mock-data';
import { cachedClientFetch } from '@/lib/client-cache';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function TeamClient({ teamId }: { teamId: number }) {
  const mockTeam = MOCK_TEAMS.find((t) => t.id === teamId);
  const [team, setTeam] = useState(mockTeam);
  const [stats, setStats] = useState<TeamStats | undefined>(undefined);
  const [games, setGames] = useState<GameResult[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);

  useEffect(() => {
    setGamesLoading(true);

    // Fetch real team data so records reflect live ESPN/CBBD data
    cachedClientFetch<Team[]>('/api/teams')
      .then((data) => {
        if (!Array.isArray(data)) return;
        const found = data.find((t) => t.id === teamId);
        if (found) {
          // Guard against stale cached 0-0 records
          if (found.record?.wins === 0 && found.record?.losses === 0 && mockTeam) {
            setTeam({ ...found, record: mockTeam.record });
          } else {
            setTeam(found);
          }
        }
      })
      .catch(() => {});

    // Fetch real stats from API (merges ESPN + CBBD with mock fallback)
    cachedClientFetch<TeamStats>(`/api/stats?teamId=${teamId}`)
      .then((data) => setStats(data))
      .catch(() => {});

    cachedClientFetch<GameResult[]>(`/api/schedule?teamId=${teamId}`, { ttl: 5 * 60 * 1000 })
      .then((data) => setGames(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setGamesLoading(false));
  }, [teamId]);

  if (!team) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12 text-center">
        <h1 className="font-display text-2xl mb-4">Team Not Found</h1>
        <p className="text-ink-muted mb-6">Could not find this team.</p>
        <Link href="/bracket" className="text-old-gold hover:underline">
          Back to Bracket
        </Link>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  const teamColor = team.color.startsWith('#') ? team.color : `#${team.color}`;

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-12">
      <Link
        href="/bracket"
        className="inline-block mb-4 sm:mb-8 text-sm text-ink-faint hover:text-old-gold transition-colors"
      >
        &larr; Back to Bracket
      </Link>

      <motion.div
        className="space-y-6 sm:space-y-8 lg:space-y-12"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.1 } } }}
      >
        <motion.div variants={fadeUp}>
          <TeamCard team={team} variant="expanded" />
        </motion.div>

        <motion.div variants={fadeUp}>
          <h2 className="font-display text-xl mb-5">Team Statistics</h2>
          <TeamStatsDisplay stats={stats} />
        </motion.div>

        {gamesLoading ? (
          <motion.div variants={fadeUp} className="space-y-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-6 w-36 mt-6" />
            <Skeleton className="h-48 w-full" />
          </motion.div>
        ) : (
          <>
            {games.length > 0 && (
              <motion.div variants={fadeUp}>
                <h2 className="font-display text-xl mb-5">Season Leaders</h2>
                <SeasonLeaders
                  games={games}
                  teamName={team.shortName}
                  teamColor={teamColor}
                />
              </motion.div>
            )}

            <motion.div variants={fadeUp}>
              <h2 className="font-display text-xl mb-5">Recent Games</h2>
              <RecentForm games={games} teamName={team.shortName} />
            </motion.div>
          </>
        )}
      </motion.div>
    </div>
  );
}
