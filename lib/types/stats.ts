export interface TeamStats {
  adjOE: number;
  adjDE: number;
  adjEM: number;
  tempo: number;
  sos: number;
  oEFG: number;
  dEFG: number;
  oTOV: number;
  dTOV: number;
  oORB: number;
  dORB: number;
  oFTR: number;
  dFTR: number;
  ppg: number;
  oppg: number;
  fgPct: number;
  fg3Pct: number;
  ftPct: number;
  rpg: number;
  apg: number;
  spg: number;
  bpg: number;
  record: { wins: number; losses: number };
}

export interface GameLeader {
  name: string;
  shortName: string;
  value: number;
  headshot?: string;
  category: 'points' | 'rebounds' | 'assists';
}

export interface GameResult {
  date: string;
  opponent: string;
  score: number;
  oppScore: number;
  location: 'home' | 'away' | 'neutral';
  result: 'W' | 'L';
  leaders?: GameLeader[];
}

export interface SeasonLeader {
  name: string;
  shortName: string;
  headshot?: string;
  gamesLed: number;
  totalValue: number;
  category: 'points' | 'rebounds' | 'assists';
}

export type PlayerStatus = 'available' | 'questionable' | 'likely_out';
export type TeamHealthStatus = 'healthy' | 'minor_concern' | 'degraded' | 'significant_concern' | 'unknown';

export interface PlayerHealthAssessment {
  name: string;
  shortName: string;
  headshot?: string;
  category: 'points' | 'rebounds' | 'assists';
  gamesLed: number;
  totalGamesWithData: number;
  recentAppearances: number;
  dominance: number;
  absenceRatio: number;
  impact: number;
  status: PlayerStatus;
}

export interface TeamHealthAssessment {
  score: number;
  status: TeamHealthStatus;
  players: PlayerHealthAssessment[];
}
