/**
 * 2026 NCAA Tournament venue locations by round and region.
 * Updated with actual venue selections for the 2026 bracket.
 *
 * Gap 4 fix: Each region has TWO pod sites for R64/R32 (top half and bottom half
 * of the region bracket), reflecting the real tournament structure where 8 cities
 * host first/second round games.
 */

import type { Region } from '@/lib/types/bracket';
import type { GeoCoord } from './team-locations';

export interface Venue extends GeoCoord {
  name: string;
  city: string;
}

/** First Four — always Dayton, OH */
const FIRST_FOUR_VENUE: Venue = {
  name: 'UD Arena',
  city: 'Dayton, OH',
  lat: 39.7405,
  lng: -84.1797,
};

/**
 * R64/R32 pod sites — TWO hosts per region (top half and bottom half of bracket).
 * "top" hosts seed matchups 1v16, 8v9, 5v12, 4v13
 * "bottom" hosts seed matchups 6v11, 3v14, 7v10, 2v15
 */
const POD_SITES: Record<Region, { top: Venue; bottom: Venue }> = {
  East: {
    top: {
      name: 'Barclays Center',
      city: 'Brooklyn, NY',
      lat: 40.6826,
      lng: -73.9754,
    },
    bottom: {
      name: 'PPG Paints Arena',
      city: 'Pittsburgh, PA',
      lat: 40.4396,
      lng: -79.9893,
    },
  },
  West: {
    top: {
      name: 'T-Mobile Arena',
      city: 'Las Vegas, NV',
      lat: 36.1029,
      lng: -115.1784,
    },
    bottom: {
      name: 'Moda Center',
      city: 'Portland, OR',
      lat: 45.5316,
      lng: -122.6668,
    },
  },
  South: {
    top: {
      name: 'State Farm Arena',
      city: 'Atlanta, GA',
      lat: 33.7573,
      lng: -84.3963,
    },
    bottom: {
      name: 'American Airlines Center',
      city: 'Dallas, TX',
      lat: 32.7905,
      lng: -96.8103,
    },
  },
  Midwest: {
    top: {
      name: 'Gainbridge Fieldhouse',
      city: 'Indianapolis, IN',
      lat: 39.7640,
      lng: -86.1555,
    },
    bottom: {
      name: 'BOK Center',
      city: 'Tulsa, OK',
      lat: 36.1526,
      lng: -95.9920,
    },
  },
};

/** Top-half seed values for R64: 1, 8, 5, 4 and their opponents 16, 9, 12, 13 */
const TOP_HALF_SEEDS = new Set([1, 16, 8, 9, 5, 12, 4, 13]);

/**
 * Sweet 16 / Elite 8 regional sites.
 */
const REGIONAL_SITES: Record<Region, Venue> = {
  East: {
    name: 'Wells Fargo Center',
    city: 'Philadelphia, PA',
    lat: 39.9012,
    lng: -75.1720,
  },
  West: {
    name: 'Chase Center',
    city: 'San Francisco, CA',
    lat: 37.7680,
    lng: -122.3878,
  },
  South: {
    name: 'FedExForum',
    city: 'Memphis, TN',
    lat: 35.1383,
    lng: -90.0506,
  },
  Midwest: {
    name: 'Lucas Oil Stadium',
    city: 'Indianapolis, IN',
    lat: 39.7601,
    lng: -86.1639,
  },
};

/** Final Four & Championship — San Antonio, TX */
const FINAL_FOUR_VENUE: Venue = {
  name: 'Alamodome',
  city: 'San Antonio, TX',
  lat: 29.4167,
  lng: -98.4910,
};

type Round = 'FIRST_FOUR' | 'R64' | 'R32' | 'S16' | 'E8' | 'FF' | 'CHAMPIONSHIP';

/**
 * Look up the venue for a given round and region.
 * For R64/R32, optionally pass a seed to determine top-half vs bottom-half pod.
 * Returns undefined if the combination is invalid.
 */
export function getVenue(round: Round | string, region?: Region, seed?: number): Venue | undefined {
  switch (round) {
    case 'FIRST_FOUR':
      return FIRST_FOUR_VENUE;
    case 'R64':
    case 'R32':
      if (!region) return undefined;
      // Determine which pod site based on seed (top vs bottom half of bracket)
      if (seed != null && !TOP_HALF_SEEDS.has(seed)) {
        return POD_SITES[region].bottom;
      }
      return POD_SITES[region].top; // default to top if no seed info
    case 'S16':
    case 'E8':
      return region ? REGIONAL_SITES[region] : undefined;
    case 'FF':
    case 'CHAMPIONSHIP':
      return FINAL_FOUR_VENUE;
    default:
      return undefined;
  }
}
