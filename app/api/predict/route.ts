import { NextRequest, NextResponse } from 'next/server';
import type { Prediction } from '@/lib/types/prediction';
import type { Confidence } from '@/lib/types/prediction';
import type { PredictionFactor } from '@/lib/types/prediction';
import { MOCK_TEAMS } from '@/lib/mock-data';
import { MOCK_STATS } from '@/lib/mock-data';
import { calculateCompositeRating } from '@/lib/algorithm/composite-rating';
import { log5 } from '@/lib/algorithm/log5';
import { calculateMatchupAdjustment } from '@/lib/algorithm/matchup';

function getConfidence(winPct: number): Confidence {
  const spread = Math.abs(winPct - 50);
  if (spread < 5) return 'Toss-up';
  if (spread < 12) return 'Slight edge';
  if (spread < 22) return 'Clear favorite';
  if (spread < 35) return 'Strong favorite';
  return 'Dominant';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { team1Id, team2Id } = body;

    if (!team1Id || !team2Id) {
      return NextResponse.json(
        { error: 'team1Id and team2Id are required' },
        { status: 400 },
      );
    }

    const id1 = Number(team1Id);
    const id2 = Number(team2Id);

    const team1 = MOCK_TEAMS.find((t) => t.id === id1);
    const team2 = MOCK_TEAMS.find((t) => t.id === id2);

    if (!team1 || !team2) {
      return NextResponse.json(
        { error: 'One or both teams not found' },
        { status: 404 },
      );
    }

    const stats1 = MOCK_STATS.get(id1);
    const stats2 = MOCK_STATS.get(id2);

    if (!stats1 || !stats2) {
      return NextResponse.json(
        { error: 'Stats not available for one or both teams' },
        { status: 404 },
      );
    }

    // Get all stats for z-score normalization context
    const allStats = Array.from(MOCK_STATS.values());

    // Calculate composite ratings
    const rating1 = calculateCompositeRating(stats1, allStats);
    const rating2 = calculateCompositeRating(stats2, allStats);

    // Convert overall ratings (0-100) to win probabilities for log5
    const pA = rating1.overall / 100;
    const pB = rating2.overall / 100;
    let team1WinProb = log5(pA, pB);

    // Apply matchup-specific adjustments
    const { team1Adj, team2Adj, factors: matchupFactors } =
      calculateMatchupAdjustment(stats1, stats2);
    team1WinProb = Math.max(0.01, Math.min(0.99, team1WinProb + team1Adj + team2Adj));

    const team1WinPct = Math.round(team1WinProb * 1000) / 10;
    const team2WinPct = Math.round((1 - team1WinProb) * 1000) / 10;

    // Build factors array
    const factors: PredictionFactor[] = [
      {
        name: 'Overall Rating',
        team1Value: Math.round(rating1.overall * 10) / 10,
        team2Value: Math.round(rating2.overall * 10) / 10,
        weight: 0.3,
        team1Edge: Math.round((rating1.overall - rating2.overall) * 10) / 10,
      },
      {
        name: 'Offensive Rating',
        team1Value: Math.round(rating1.offense * 10) / 10,
        team2Value: Math.round(rating2.offense * 10) / 10,
        weight: 0.2,
        team1Edge: Math.round((rating1.offense - rating2.offense) * 10) / 10,
      },
      {
        name: 'Defensive Rating',
        team1Value: Math.round(rating1.defense * 10) / 10,
        team2Value: Math.round(rating2.defense * 10) / 10,
        weight: 0.2,
        team1Edge: Math.round((rating1.defense - rating2.defense) * 10) / 10,
      },
      {
        name: 'Adj. Efficiency Margin',
        team1Value: stats1.adjEM,
        team2Value: stats2.adjEM,
        weight: 0.15,
        team1Edge: Math.round((stats1.adjEM - stats2.adjEM) * 10) / 10,
      },
      {
        name: 'Strength of Schedule',
        team1Value: stats1.sos,
        team2Value: stats2.sos,
        weight: 0.15,
        team1Edge: Math.round((stats1.sos - stats2.sos) * 10) / 10,
      },
    ];

    // Add matchup-specific factors
    for (const mf of matchupFactors) {
      factors.push({
        name: mf.name,
        team1Value: mf.team1Impact,
        team2Value: mf.team2Impact,
        weight: 0.05,
        team1Edge: Math.round((mf.team1Impact - mf.team2Impact) * 1000) / 1000,
      });
    }

    const confidence = getConfidence(team1WinPct);
    const favoredTeam = team1WinPct >= team2WinPct ? team1 : team2;

    const prediction: Prediction = {
      team1WinPct,
      team2WinPct,
      confidence,
      factors,
      favoredTeam,
    };

    return NextResponse.json(prediction);
  } catch (error) {
    console.error('Prediction failed:', error);
    return NextResponse.json(
      { error: 'Prediction failed' },
      { status: 500 },
    );
  }
}
