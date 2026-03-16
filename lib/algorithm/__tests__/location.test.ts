import { describe, it, expect } from 'vitest';
import {
  haversineDistance,
  proximityAdvantage,
  calculateLocationAdvantage,
} from '@/lib/algorithm/location';

describe('haversineDistance', () => {
  it('returns 0 for identical points', () => {
    const point = { lat: 40.0, lng: -74.0 };
    expect(haversineDistance(point, point)).toBeCloseTo(0, 1);
  });

  it('calculates distance between New York and Los Angeles (~2450 miles)', () => {
    const nyc = { lat: 40.7128, lng: -74.006 };
    const la = { lat: 34.0522, lng: -118.2437 };
    const dist = haversineDistance(nyc, la);
    expect(dist).toBeGreaterThan(2400);
    expect(dist).toBeLessThan(2500);
  });

  it('calculates distance between nearby cities (Durham to Raleigh ~25 miles)', () => {
    const durham = { lat: 36.0014, lng: -78.9382 };
    const raleigh = { lat: 35.7796, lng: -78.6382 };
    const dist = haversineDistance(durham, raleigh);
    expect(dist).toBeGreaterThan(15);
    expect(dist).toBeLessThan(35);
  });
});

describe('proximityAdvantage', () => {
  it('returns 1.0 for distances under 100 miles', () => {
    expect(proximityAdvantage(0)).toBe(1.0);
    expect(proximityAdvantage(50)).toBe(1.0);
    expect(proximityAdvantage(99)).toBe(1.0);
  });

  it('returns 0.6 for distances 100-300 miles', () => {
    expect(proximityAdvantage(100)).toBe(0.6);
    expect(proximityAdvantage(200)).toBe(0.6);
    expect(proximityAdvantage(299)).toBe(0.6);
  });

  it('returns 0.25 for distances 300-600 miles', () => {
    expect(proximityAdvantage(300)).toBe(0.25);
    expect(proximityAdvantage(450)).toBe(0.25);
    expect(proximityAdvantage(599)).toBe(0.25);
  });

  it('returns 0.0 for distances over 600 miles', () => {
    expect(proximityAdvantage(600)).toBe(0.0);
    expect(proximityAdvantage(1000)).toBe(0.0);
    expect(proximityAdvantage(3000)).toBe(0.0);
  });
});

describe('calculateLocationAdvantage', () => {
  it('returns null for unknown team IDs', () => {
    expect(calculateLocationAdvantage(99999, 99998, 'R64', 'East')).toBeNull();
  });

  it('returns null when no venue can be resolved', () => {
    expect(calculateLocationAdvantage(150, 41, 'INVALID_ROUND')).toBeNull();
  });

  it('produces zero-sum adjustments (team1Adj + team2Adj ≈ 0)', () => {
    const result = calculateLocationAdvantage(150, 41, 'R64', 'East', 1);
    expect(result).not.toBeNull();
    expect(result!.team1Adj + result!.team2Adj).toBeCloseTo(0, 10);
  });

  it('caps adjustment at ±3%', () => {
    const result = calculateLocationAdvantage(150, 62, 'R64', 'East', 1); // Duke vs Hawaii
    expect(result).not.toBeNull();
    expect(Math.abs(result!.team1Adj)).toBeLessThanOrEqual(0.03);
    expect(Math.abs(result!.team2Adj)).toBeLessThanOrEqual(0.03);
  });

  it('returns distance values in miles', () => {
    const result = calculateLocationAdvantage(150, 41, 'R64', 'East', 1);
    expect(result).not.toBeNull();
    expect(result!.team1Distance).toBeGreaterThan(0);
    expect(result!.team2Distance).toBeGreaterThan(0);
  });

  it('gives advantage to team closer to venue', () => {
    // St. John's (Queens, NY) vs Hawaii playing in East R64 top pod (Brooklyn)
    const result = calculateLocationAdvantage(2599, 62, 'R64', 'East', 5);
    expect(result).not.toBeNull();
    expect(result!.team1Adj).toBeGreaterThan(0); // St. John's is much closer
    expect(result!.team2Adj).toBeLessThan(0);    // Hawaii is far away
  });

  it('cancels when both teams are equidistant', () => {
    const result = calculateLocationAdvantage(150, 150, 'R64', 'East', 1);
    expect(result).not.toBeNull();
    expect(result!.team1Adj).toBeCloseTo(0);
    expect(result!.team2Adj).toBeCloseTo(0);
  });

  it('includes venue metadata', () => {
    const result = calculateLocationAdvantage(150, 41, 'FF');
    expect(result).not.toBeNull();
    expect(result!.venueName).toBe('Alamodome');
    expect(result!.venueCity).toBe('San Antonio, TX');
  });

  it('selects correct pod site based on seed (top half)', () => {
    // Seed 1 → top half pod (Brooklyn for East)
    const result = calculateLocationAdvantage(150, 2561, 'R64', 'East', 1);
    expect(result).not.toBeNull();
    expect(result!.venueName).toBe('Barclays Center');
  });

  it('selects correct pod site based on seed (bottom half)', () => {
    // Seed 2 → bottom half pod (Pittsburgh for East)
    const result = calculateLocationAdvantage(41, 231, 'R64', 'East', 2);
    expect(result).not.toBeNull();
    expect(result!.venueName).toBe('PPG Paints Arena');
  });
});
