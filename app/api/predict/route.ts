import { NextRequest, NextResponse } from 'next/server';
import type { Prediction } from '@/lib/types/prediction';
import type { Confidence } from '@/lib/types/prediction';
import type { PredictionFactor } from '@/lib/types/prediction';
import type { Region } from '@/lib/types/bracket';
import { getTournamentTeams, getAllTournamentStats } from '@/lib/api/tournament';
import { calculateCompositeRating, calculateCoachingScore, calculateVariance } from '@/lib/algorithm/composite-rating';
import { log5 } from '@/lib/algorithm/log5';
import { calculateMatchupAdjustment } from '@/lib/algorithm/matchup';
import { calculateLocationAdvantage } from '@/lib/algorithm/location';
import { assessTeamHealth, calculateHealthAdjustment } from '@/lib/algorithm/health';
import { ensembleBlend } from '@/lib/algorithm/ensemble';
import { applySeedCalibration } from '@/lib/algorithm/seed-calibration';
import { getMatchupOdds } from '@/lib/api/markets';
import { getTeamSchedule } from '@/lib/api/espn';
import { COACH_DATA } from '@/lib/data/coaching-data';

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
    const { team1Id, team2Id, round, region } = body;

    if (!team1Id || !team2Id) {
      return NextResponse.json(
        { error: 'team1Id and team2Id are required' },
        { status: 400 },
      );
    }

    const id1 = Number(team1Id);
    const id2 = Number(team2Id);

    // Fetch tournament data; market odds kicked off in parallel below (Gap 1 fix)
    const [teams, statsMap] = await Promise.all([
      getTournamentTeams(),
      getAllTournamentStats(),
    ]);

    const team1 = teams.find((t) => t.id === id1);
    const team2 = teams.find((t) => t.id === id2);

    if (!team1 || !team2) {
      return NextResponse.json(
        { error: 'One or both teams not found' },
        { status: 404 },
      );
    }

    const rawStats1 = statsMap.get(id1);
    const rawStats2 = statsMap.get(id2);

    if (!rawStats1 || !rawStats2) {
      return NextResponse.json(
        { error: 'Stats not available for one or both teams' },
        { status: 404 },
      );
    }

    // Kick off market fetch + schedule fetches NOW so they run concurrently with model computation.
    const marketOddsPromise = getMatchupOdds(
      team1.shortName,
      team2.shortName,
    ).catch(() => ({ team1Prob: NaN, team2Prob: NaN, available: false as const }));

    const schedule1Promise = getTeamSchedule(id1).catch(() => []);
    const schedule2Promise = getTeamSchedule(id2).catch(() => []);

    // Ensure no null/NaN numeric fields — derive adjEM from adjOE - adjDE when missing
    const sanitizeStats = (s: typeof rawStats1) => {
      const adjOE = s.adjOE ?? 0;
      const adjDE = s.adjDE ?? 0;
      const adjEM = s.adjEM != null
        ? s.adjEM
        : (adjOE !== 0 || adjDE !== 0)
          ? Math.round((adjOE - adjDE) * 10) / 10
          : 0;
      return {
        ...s,
        adjOE,
        adjDE,
        adjEM,
        oEFG: s.oEFG ?? 0,
        dEFG: s.dEFG ?? 0,
        oTOV: s.oTOV ?? 0,
        dTOV: s.dTOV ?? 0,
        oORB: s.oORB ?? 0,
        dORB: s.dORB ?? 0,
        oFTR: s.oFTR ?? 0,
        dFTR: s.dFTR ?? 0,
        tempo: s.tempo ?? 0,
        sos: s.sos ?? 0,
      };
    };

    const stats1 = sanitizeStats(rawStats1);
    const stats2 = sanitizeStats(rawStats2);

    // Get all stats for z-score normalization context — sanitize all of them
    const allStats = Array.from(statsMap.values()).map(sanitizeStats);

    // Await schedules now (needed for both variance calculation and health assessment)
    const [schedule1, schedule2] = await Promise.all([schedule1Promise, schedule2Promise]);

    // Calculate coaching scores for target teams AND the full population (Bug 1 fix)
    const coach1 = COACH_DATA[id1];
    const coach2 = COACH_DATA[id2];
    const coachScore1 = coach1 ? calculateCoachingScore(coach1) : 0;
    const coachScore2 = coach2 ? calculateCoachingScore(coach2) : 0;

    // Build coaching scores for the entire population so z-score normalization
    // operates on the real distribution, not all-zeros
    const allTeamIds = Array.from(statsMap.keys());
    const allCoachingScores = allTeamIds.map((id) => {
      const coach = COACH_DATA[id];
      return coach ? calculateCoachingScore(coach) : 0;
    });

    // Calculate variance scores from schedule data (performance consistency)
    const varScore1 = calculateVariance(schedule1);
    const varScore2 = calculateVariance(schedule2);
    // For population variance, we'd ideally have all schedules but we only
    // fetch the two teams' schedules. Use zeros for population (safe default —
    // z-score normalization treats missing data as league-average).
    const allVarianceScores = allTeamIds.map(() => 0);

    // Calculate composite ratings (revised: 10 factors without tempo, with variance)
    const rating1 = calculateCompositeRating(
      stats1, allStats, 0, coachScore1, allCoachingScores, varScore1, allVarianceScores,
    );
    const rating2 = calculateCompositeRating(
      stats2, allStats, 0, coachScore2, allCoachingScores, varScore2, allVarianceScores,
    );

    // Convert overall ratings (0-100) to win probabilities for log5
    const pA = isNaN(rating1.overall) ? 0.5 : rating1.overall / 100;
    const pB = isNaN(rating2.overall) ? 0.5 : rating2.overall / 100;
    let team1WinProb = log5(pA, pB);

    // Guard against NaN from bad upstream data
    if (isNaN(team1WinProb)) team1WinProb = 0.5;

    // Apply matchup-specific adjustments
    const { team1Adj, team2Adj, factors: matchupFactors } =
      calculateMatchupAdjustment(stats1, stats2);
    team1WinProb = Math.max(0.01, Math.min(0.99, team1WinProb + team1Adj + team2Adj));

    // Apply location adjustment (post-log5, game-specific)
    const locationResult = round
      ? calculateLocationAdvantage(id1, id2, round as string, region as Region | undefined, team1.seed)
      : null;

    if (locationResult) {
      team1WinProb = Math.max(
        0.01,
        Math.min(0.99, team1WinProb + locationResult.team1Adj + locationResult.team2Adj),
      );
    }

    // Apply health adjustment (post-location, pre-market blend)
    // NOTE: We apply only team1Adj because team1WinProb is team 1's probability.
    // team1Adj and team2Adj are equal-and-opposite, so adding both would cancel to zero.
    // team2Adj exists for contexts where team 2's probability is tracked independently.
    const health1 = assessTeamHealth(schedule1);
    const health2 = assessTeamHealth(schedule2);
    const healthAdj = calculateHealthAdjustment(health1, health2);
    team1WinProb = Math.max(
      0.01,
      Math.min(0.99, team1WinProb + healthAdj.team1Adj),
    );

    // Apply seed-line upset calibration (blends model with historical base rates)
    const seed1 = team1.seed ?? 16;
    const seed2 = team2.seed ?? 16;
    team1WinProb = applySeedCalibration(team1WinProb, seed1, seed2);

    // Final NaN guard (before market blend)
    if (isNaN(team1WinProb)) team1WinProb = 0.5;

    // Await market odds (was running concurrently since we kicked it off earlier)
    const marketOdds = await marketOddsPromise;

    // Apply market ensemble blend (70% model / 30% market) — final step
    const blend = ensembleBlend(
      team1WinProb,
      marketOdds.team1Prob,
      marketOdds.available,
    );
    team1WinProb = blend.finalProb;

    const team1WinPct = Math.round(team1WinProb * 1000) / 10;
    const team2WinPct = Math.round((1 - team1WinProb) * 1000) / 10;

    // Helper to round safely (NaN → 0)
    const safeRound = (v: number, decimals = 1) => {
      const result = Math.round(v * 10 ** decimals) / 10 ** decimals;
      return isNaN(result) ? 0 : result;
    };

    // Build factors array
    const factors: PredictionFactor[] = [
      {
        name: 'Overall Rating',
        team1Value: safeRound(rating1.overall),
        team2Value: safeRound(rating2.overall),
        weight: 0.3,
        team1Edge: safeRound(rating1.overall - rating2.overall),
      },
      {
        name: 'Offensive Rating',
        team1Value: safeRound(rating1.offense),
        team2Value: safeRound(rating2.offense),
        weight: 0.2,
        team1Edge: safeRound(rating1.offense - rating2.offense),
      },
      {
        name: 'Defensive Rating',
        team1Value: safeRound(rating1.defense),
        team2Value: safeRound(rating2.defense),
        weight: 0.2,
        team1Edge: safeRound(rating1.defense - rating2.defense),
      },
      {
        name: 'Adj. Efficiency Margin',
        team1Value: safeRound(stats1.adjEM),
        team2Value: safeRound(stats2.adjEM),
        weight: 0.15,
        team1Edge: safeRound(stats1.adjEM - stats2.adjEM),
      },
      {
        name: 'Strength of Schedule',
        team1Value: safeRound(stats1.sos),
        team2Value: safeRound(stats2.sos),
        weight: 0.15,
        team1Edge: safeRound(stats1.sos - stats2.sos),
      },
    ];

    // Coaching Experience factor
    if (coach1 || coach2) {
      factors.push({
        name: 'Coaching Experience',
        team1Value: safeRound(coachScore1),
        team2Value: safeRound(coachScore2),
        weight: 0.08,
        team1Edge: safeRound(coachScore1 - coachScore2),
      });
    }

    // Add matchup-specific factors
    for (const mf of matchupFactors) {
      const t1 = mf.team1Impact ?? 0;
      const t2 = mf.team2Impact ?? 0;
      factors.push({
        name: mf.name,
        team1Value: safeRound(t1, 3),
        team2Value: safeRound(t2, 3),
        weight: 0.05,
        team1Edge: safeRound(t1 - t2, 3),
      });
    }

    // Location Advantage factor (Bug 3 fix: show proximity score, not raw miles)
    // Higher value = closer to venue = advantage. This way the FactorBar
    // correctly shows the closer team with the wider/winning bar.
    if (locationResult) {
      const prox1 = locationResult.team1Distance < 100 ? 1.0
        : locationResult.team1Distance < 300 ? 0.6
        : locationResult.team1Distance < 600 ? 0.25
        : 0.0;
      const prox2 = locationResult.team2Distance < 100 ? 1.0
        : locationResult.team2Distance < 300 ? 0.6
        : locationResult.team2Distance < 600 ? 0.25
        : 0.0;
      factors.push({
        name: 'Location Advantage',
        team1Value: safeRound(prox1, 2),
        team2Value: safeRound(prox2, 2),
        weight: 0.05,
        team1Edge: safeRound(prox1 - prox2, 2),
      });
    }

    // Player Availability factor (only when health differs)
    if (health1.status !== 'unknown' && health2.status !== 'unknown') {
      const healthDiff = Math.abs(health1.score - health2.score);
      if (healthDiff > 0.01) {
        factors.push({
          name: 'Player Availability',
          team1Value: safeRound(health1.score * 100),
          team2Value: safeRound(health2.score * 100),
          weight: 0.05,
          team1Edge: safeRound((health1.score - health2.score) * 100),
        });
      }
    }

    // Market Signal factor
    if (blend.marketAvailable) {
      factors.push({
        name: 'Market Signal',
        team1Value: safeRound(blend.marketProb * 100),
        team2Value: safeRound((1 - blend.marketProb) * 100),
        weight: 0.05,
        team1Edge: safeRound(blend.marketProb * 100 - (1 - blend.marketProb) * 100),
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
      ensemble: {
        modelProb: blend.modelProb,
        marketProb: blend.marketAvailable ? blend.marketProb : 0,
        marketAvailable: blend.marketAvailable,
        alpha: blend.alpha,
      },
      locationData: locationResult
        ? {
            team1Distance: locationResult.team1Distance,
            team2Distance: locationResult.team2Distance,
            venueName: locationResult.venueName,
            venueCity: locationResult.venueCity,
          }
        : undefined,
      healthData:
        health1.status !== 'unknown' && health2.status !== 'unknown'
          ? {
              team1Health: {
                score: health1.score,
                status: health1.status,
                players: health1.players.map((p) => ({
                  name: p.name,
                  shortName: p.shortName,
                  headshot: p.headshot,
                  category: p.category,
                  gamesLed: p.gamesLed,
                  totalGamesWithData: p.totalGamesWithData,
                  recentAppearances: p.recentAppearances,
                  status: p.status,
                  impact: p.impact,
                })),
              },
              team2Health: {
                score: health2.score,
                status: health2.status,
                players: health2.players.map((p) => ({
                  name: p.name,
                  shortName: p.shortName,
                  headshot: p.headshot,
                  category: p.category,
                  gamesLed: p.gamesLed,
                  totalGamesWithData: p.totalGamesWithData,
                  recentAppearances: p.recentAppearances,
                  status: p.status,
                  impact: p.impact,
                })),
              },
            }
          : undefined,
      // Pass coach names so the client can use them in commentary (Gap 2 fix)
      coach1Name: coach1?.name,
      coach2Name: coach2?.name,
    };

    return NextResponse.json(prediction, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Prediction failed:', error);
    return NextResponse.json(
      { error: 'Prediction failed' },
      { status: 500 },
    );
  }
}
