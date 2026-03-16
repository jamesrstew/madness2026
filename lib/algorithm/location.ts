/**
 * Location/travel advantage calculation for tournament matchups.
 *
 * Teams playing closer to home get a small crowd/travel advantage.
 * Applied post-log5, alongside matchup adjustments.
 */

import type { Region } from '@/lib/types/bracket';
import { TEAM_LOCATIONS, type GeoCoord } from '@/lib/data/team-locations';
import { getVenue } from '@/lib/data/venue-locations';

const MAX_LOCATION_ADJ = 0.03; // ±3% max adjustment

/**
 * Great-circle distance between two points using the Haversine formula.
 * Returns distance in miles.
 */
export function haversineDistance(a: GeoCoord, b: GeoCoord): number {
  const R = 3958.8; // Earth radius in miles
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Asymmetric proximity advantage based on distance to venue.
 * Returns a score from 0 (no advantage) to 1 (strong home-crowd effect).
 *
 * - < 100 mi: 1.0 (strong home-crowd effect)
 * - 100-300 mi: 0.6 (regional advantage)
 * - 300-600 mi: 0.25 (slight edge)
 * - > 600 mi: 0.0 (neutral)
 */
export function proximityAdvantage(distanceMiles: number): number {
  if (distanceMiles < 100) return 1.0;
  if (distanceMiles < 300) return 0.6;
  if (distanceMiles < 600) return 0.25;
  return 0.0;
}

export interface LocationResult {
  team1Adj: number;
  team2Adj: number;
  team1Distance: number;
  team2Distance: number;
  venueName?: string;
  venueCity?: string;
}

/**
 * Calculate the location advantage for a matchup at a given round/region.
 *
 * The adjustment is differential: if both teams are equidistant,
 * it cancels to zero. Max adjustment is ±3%.
 *
 * Returns null when data is missing (graceful degradation).
 */
export function calculateLocationAdvantage(
  team1Id: number,
  team2Id: number,
  round: string,
  region?: Region,
  team1Seed?: number,
): LocationResult | null {
  const loc1 = TEAM_LOCATIONS[team1Id];
  const loc2 = TEAM_LOCATIONS[team2Id];
  const venue = getVenue(round, region, team1Seed);

  if (!loc1 || !loc2 || !venue) return null;

  const dist1 = haversineDistance(loc1, venue);
  const dist2 = haversineDistance(loc2, venue);

  const adv1 = proximityAdvantage(dist1);
  const adv2 = proximityAdvantage(dist2);

  // Differential advantage scaled to max adjustment
  const rawDiff = adv1 - adv2;
  const team1Adj = rawDiff * MAX_LOCATION_ADJ;
  const team2Adj = -rawDiff * MAX_LOCATION_ADJ;

  return {
    team1Adj: Math.max(-MAX_LOCATION_ADJ, Math.min(MAX_LOCATION_ADJ, team1Adj)),
    team2Adj: Math.max(-MAX_LOCATION_ADJ, Math.min(MAX_LOCATION_ADJ, team2Adj)),
    team1Distance: Math.round(dist1),
    team2Distance: Math.round(dist2),
    venueName: venue.name,
    venueCity: venue.city,
  };
}
