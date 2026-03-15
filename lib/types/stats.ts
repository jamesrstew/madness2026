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

export interface GameResult {
  date: string;
  opponent: string;
  score: number;
  oppScore: number;
  location: 'home' | 'away' | 'neutral';
  result: 'W' | 'L';
}
