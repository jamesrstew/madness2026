import type { Metadata } from 'next';
import { findTeamById, getTeamStats } from '@/lib/og-utils';
import { MOCK_TEAMS } from '@/lib/mock-data';
import TeamClient from './TeamClient';

/** Pre-render a page shell for every tournament team at build time. */
export function generateStaticParams() {
  return MOCK_TEAMS.map((t) => ({ teamId: String(t.id) }));
}

/** Revalidate every hour — stats don't change mid-game. */
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ teamId: string }>;
}): Promise<Metadata> {
  const { teamId } = await params;
  const team = await findTeamById(Number(teamId));

  if (!team) {
    return { title: 'Team Not Found' };
  }

  const stats = await getTeamStats(team.id);
  const emSign = stats && stats.adjEM >= 0 ? '+' : '';

  const title = `${team.shortName} — #${team.seed} Seed, ${team.region} Region`;
  const description = `${team.name} (${team.record.wins}-${team.record.losses}) 2026 NCAA Tournament profile. ${team.conference}${stats ? ` • Adj. Efficiency Margin ${emSign}${stats.adjEM.toFixed(1)}, ${stats.ppg} PPG, ${stats.oppg} Opp PPG` : ''}. Full stats, algorithm rating, and recent form.`;

  return {
    title,
    description,
    openGraph: {
      title: `${team.shortName} — ${team.region} Region #${team.seed} Seed | March Madness 2026`,
      description,
    },
  };
}

export default async function TeamPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  return <TeamClient teamId={Number(teamId)} />;
}
