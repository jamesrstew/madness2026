import { NextResponse } from 'next/server';
import { getScoreboard } from '@/lib/api/espn';

export async function GET() {
  try {
    const scoreboard = await getScoreboard();
    return NextResponse.json(scoreboard);
  } catch (error) {
    console.error('Failed to fetch scores:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scores' },
      { status: 500 },
    );
  }
}
