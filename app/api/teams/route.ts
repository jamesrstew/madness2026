import { NextResponse } from 'next/server';
import { getTeams } from '@/lib/api/espn';
import { getCbbdName } from '@/lib/api/team-mapping';

export async function GET() {
  try {
    const teams = await getTeams();

    const merged = teams.map((team) => ({
      ...team,
      cbbdName: getCbbdName(team.id),
    }));

    return NextResponse.json(merged);
  } catch (error) {
    console.error('Failed to fetch teams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 },
    );
  }
}
