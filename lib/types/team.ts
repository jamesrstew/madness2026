export interface Team {
  id: number; // ESPN numeric ID
  name: string;
  shortName: string;
  abbreviation: string;
  seed?: number;
  region?: Region;
  conference: string;
  record: { wins: number; losses: number };
  color: string; // primary hex
  alternateColor: string;
  logo: string; // ESPN CDN URL
  cbbdName?: string; // CBBD team name for cross-reference
}

export type Region = 'East' | 'West' | 'South' | 'Midwest';
