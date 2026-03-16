import type { Metadata } from 'next';
import { findTeamsBySlug, quickWinProb, getTeamStats } from '@/lib/og-utils';
import { MOCK_TEAMS } from '@/lib/mock-data';
import MatchupClient from './MatchupClient';

/**
 * Pre-render R64 matchup pages at build time.
 * Generates slugs like "duke-vs-siena" for every first-round seed pairing.
 */
export function generateStaticParams() {
  const SEED_MATCHUPS: [number, number][] = [
    [1, 16], [8, 9], [5, 12], [4, 13], [6, 11], [3, 14], [7, 10], [2, 15],
  ];
  const REGIONS = ['East', 'West', 'South', 'Midwest'] as const;
  const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, '-');

  const slugs: { slug: string }[] = [];

  for (const region of REGIONS) {
    const regionTeams = MOCK_TEAMS.filter((t) => t.region === region);
    for (const [hi, lo] of SEED_MATCHUPS) {
      const t1 = regionTeams.find((t) => t.seed === hi);
      const t2 = regionTeams.find((t) => t.seed === lo);
      if (t1 && t2) {
        slugs.push({ slug: `${normalize(t1.shortName)}-vs-${normalize(t2.shortName)}` });
      }
    }
  }

  return slugs;
}

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { team1, team2 } = await findTeamsBySlug(slug);

  if (!team1 || !team2) {
    return { title: 'Matchup Not Found' };
  }

  const winProb = await quickWinProb(team1.id, team2.id);
  const favored = winProb >= 0.5 ? team1 : team2;
  const pct = Math.round((winProb >= 0.5 ? winProb : 1 - winProb) * 100);

  const stats1 = await getTeamStats(team1.id);
  const stats2 = await getTeamStats(team2.id);

  const regionInfo =
    team1.region === team2.region
      ? `${team1.region} Region`
      : 'Cross-Region';

  const title = `${team1.shortName} vs ${team2.shortName} — #${team1.seed} vs #${team2.seed}`;
  const description = `${regionInfo} matchup: our algorithm gives ${favored.shortName} a ${pct}% win probability. ${team1.shortName} (${team1.record.wins}-${team1.record.losses}${stats1 ? `, ${stats1.ppg} PPG` : ''}) vs ${team2.shortName} (${team2.record.wins}-${team2.record.losses}${stats2 ? `, ${stats2.ppg} PPG` : ''}). Full stat comparison and breakdown.`;

  return {
    title,
    description,
    openGraph: {
      title: `${team1.shortName} vs ${team2.shortName} — March Madness 2026`,
      description,
    },
  };
}

export default async function MatchupPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <MatchupClient slug={slug} />;
}
