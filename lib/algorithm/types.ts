export interface CompositeFactors {
  adjEM: number;
  oEFG: number;
  dEFG: number;
  tov: number;
  orb: number;
  ftr: number;
  tempo: number;
  sos: number;
  recentForm: number;
}

export interface CompositeWeights {
  adjEM: number;
  oEFG: number;
  dEFG: number;
  tov: number;
  orb: number;
  ftr: number;
  tempo: number;
  sos: number;
  recentForm: number;
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
}

export interface SimulationResult {
  championshipPct: number;
  finalFourPct: number;
  eliteEightPct: number;
  sweetSixteenPct: number;
}
