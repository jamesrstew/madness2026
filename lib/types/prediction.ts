import type { Team } from './team';

export interface PredictionFactor {
  name: string;
  team1Value: number;
  team2Value: number;
  weight: number;
  team1Edge: number;
}

export type Confidence =
  | 'Toss-up'
  | 'Slight edge'
  | 'Clear favorite'
  | 'Strong favorite'
  | 'Dominant';

export interface Prediction {
  team1WinPct: number;
  team2WinPct: number;
  confidence: Confidence;
  factors: PredictionFactor[];
  favoredTeam: Team;
}
