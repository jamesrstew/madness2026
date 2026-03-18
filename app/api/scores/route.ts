import { NextResponse } from 'next/server';
import { getTournamentScoreboard } from '@/lib/api/espn';

export async function GET() {
  try {
    const results = await getTournamentScoreboard();
    return NextResponse.json(results);
  } catch (error) {
    console.error('Failed to fetch scores:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scores' },
      { status: 500 },
    );
  }
}
