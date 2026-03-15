import { NextRequest, NextResponse } from 'next/server';
import { getTeamStats } from '@/lib/api/espn';

export async function GET(request: NextRequest) {
  const teamId = request.nextUrl.searchParams.get('teamId');

  if (!teamId) {
    return NextResponse.json(
      { error: 'teamId query parameter is required' },
      { status: 400 },
    );
  }

  try {
    const stats = await getTeamStats(Number(teamId));
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team stats' },
      { status: 500 },
    );
  }
}
