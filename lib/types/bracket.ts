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

export interface ActualResult {
  winnerId: number; // ESPN team ID of real winner (0 if in_progress)
  score: { team1Score: number; team2Score: number };
  status: 'scheduled' | 'in_progress' | 'final';
  statusDetail?: string; // e.g. "Final", "2nd Half 12:34"
}

export interface Matchup {
  id: string;
  round: Round;
  region?: Region;
  team1?: Team;
  team2?: Team;
  winner?: Team;
  userPick?: Team; // user's original pick (preserved when actual overrides winner)
  actualResult?: ActualResult;
  winProb1?: number;
  winProb2?: number;
}

export interface BracketState {
  matchups: Map<string, Matchup>;
  selections: Map<string, number>; // matchupId → winning team id
  completionPct: number;
}
