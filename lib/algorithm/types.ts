export interface CompositeFactors {
  adjEM: number;
  oEFG: number;
  dEFG: number;
  tov: number;
  orb: number;
  ftr: number;
  sos: number;
  recentForm: number;
  coaching: number;
  variance: number; // performance consistency (lower stddev of margins = higher score)
}

export interface CompositeWeights {
  adjEM: number;
  oEFG: number;
  dEFG: number;
  tov: number;
  orb: number;
  ftr: number;
  sos: number;
  recentForm: number;
  coaching: number;
  variance: number;
}

export interface TeamRating {
  overall: number;
  offense: number;
  defense: number;
  factors: CompositeFactors;
}

export interface MatchupFactor {
  name: string;
  description: string;
  team1Impact: number;
  team2Impact: number;
  /** Optional display values (underlying stats) — used instead of tiny probability impacts in the UI. */
  team1Display?: number;
  team2Display?: number;
}

export interface SimulationResult {
  championshipPct: number;
  finalFourPct: number;
  eliteEightPct: number;
  sweetSixteenPct: number;
}
