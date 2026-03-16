import { NextResponse } from 'next/server';
import { getTournamentTeams } from '@/lib/api/tournament';

export async function GET() {
  try {
    const teams = await getTournamentTeams();
    return NextResponse.json(teams);
  } catch (error) {
    console.error('Failed to fetch teams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 },
    );
  }
}
