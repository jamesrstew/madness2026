import type { Team } from './team';
import type { PlayerStatus, TeamHealthStatus } from './stats';

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

export interface EnsembleData {
  modelProb: number;
  marketProb: number;
  marketAvailable: boolean;
  alpha: number;
}

export interface LocationData {
  team1Distance: number;
  team2Distance: number;
  venueName?: string;
  venueCity?: string;
}

export interface HealthDataPlayer {
  name: string;
  shortName: string;
  headshot?: string;
  category: 'points' | 'rebounds' | 'assists';
  gamesLed: number;
  totalGamesWithData: number;
  recentAppearances: number;
  status: PlayerStatus;
  impact: number;
}

export interface HealthDataTeam {
  score: number;
  status: TeamHealthStatus;
  players: HealthDataPlayer[];
}

export interface HealthData {
  team1Health: HealthDataTeam;
  team2Health: HealthDataTeam;
}

export interface Prediction {
  team1WinPct: number;
  team2WinPct: number;
  confidence: Confidence;
  factors: PredictionFactor[];
  favoredTeam: Team;
  ensemble?: EnsembleData;
  locationData?: LocationData;
  healthData?: HealthData;
  coach1Name?: string;
  coach2Name?: string;
}
