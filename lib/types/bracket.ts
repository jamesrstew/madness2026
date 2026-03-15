import type { Team } from './team';

export type Region = 'East' | 'West' | 'South' | 'Midwest';

export type Round =
  | 'FIRST_FOUR'
  | 'R64'
  | 'R32'
  | 'S16'
  | 'E8'
  | 'FF'
  | 'CHAMPIONSHIP';

export interface Matchup {
  id: string;
  round: Round;
  region?: Region;
  team1?: Team;
  team2?: Team;
  winner?: Team;
  winProb1?: number;
  winProb2?: number;
}

export interface BracketState {
  matchups: Map<string, Matchup>;
  selections: Map<string, number>; // matchupId → winning team id
  completionPct: number;
}
