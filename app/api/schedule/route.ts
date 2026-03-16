import { NextRequest, NextResponse } from 'next/server';
import { getTeamSchedule } from '@/lib/api/espn';

export async function GET(request: NextRequest) {
  const teamId = request.nextUrl.searchParams.get('teamId');
  if (!teamId) {
    return NextResponse.json({ error: 'teamId is required' }, { status: 400 });
  }

  try {
    const games = await getTeamSchedule(Number(teamId));
    return NextResponse.json(games, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    console.error('Failed to fetch schedule:', error);
    // Return empty array instead of 500 so the UI degrades gracefully
    return NextResponse.json([], {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  }
}
