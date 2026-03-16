import { NextRequest, NextResponse } from 'next/server';
import { getTeamStatsReal } from '@/lib/api/tournament';

export async function GET(request: NextRequest) {
  const teamId = request.nextUrl.searchParams.get('teamId');

  if (!teamId) {
    return NextResponse.json(
      { error: 'teamId query parameter is required' },
      { status: 400 },
    );
  }

  try {
    const stats = await getTeamStatsReal(Number(teamId));
    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team stats' },
      { status: 500 },
    );
  }
}
