// ─── Raw NHL API Types ────────────────────────────────────────────────────────

export interface NHLPlayer {
  playerId: number;
  firstName: { default: string };
  lastName: { default: string };
  sweaterNumber: number;
  positionCode: 'C' | 'L' | 'R' | 'D' | 'G';
  teamId: number;
  teamAbbrev: string;
  headshot: string;
}

export interface NHLTeam {
  id: number;
  name: string;
  abbrev: string;
  logo: string;
  conference: string;
  division: string;
}

export interface NHLGameLog {
  gameId: number;
  gameDate: string;         // YYYY-MM-DD
  opponentAbbrev: string;
  homeRoadFlag: 'H' | 'R';
  goals: number;
  assists: number;
  points: number;
  plusMinus: number;
  hits: number;
  blockedShots: number;
  shots: number;
  toi: string;              // "MM:SS"
  toiSeconds: number;
  powerPlayGoals: number;
  powerPlayPoints: number;
  shorthandedGoals: number;
  shorthandedPoints: number;
  powerPlayToi: string;
  shorthandedToi: string;
}

export interface NHLGoalieLog {
  gameId: number;
  gameDate: string;
  opponentAbbrev: string;
  homeRoadFlag: 'H' | 'R';
  decision: 'W' | 'L' | 'O' | null;
  shotsAgainst: number;
  goalsAgainst: number;
  savePct: number;
  toi: string;
  toiSeconds: number;
}

export interface NHLScheduledGame {
  id: number;
  gameDate: string;
  startTimeUTC: string;
  homeTeam: { id: number; abbrev: string; score?: number };
  awayTeam: { id: number; abbrev: string; score?: number };
  gameState: 'FUT' | 'PRE' | 'LIVE' | 'CRIT' | 'FINAL' | 'OFF';
  venue: { default: string };
}

// ─── 3-Layer Metric Model ─────────────────────────────────────────────────────

export interface LayerMetrics {
  gamesPlayed: number;
  goals: number;
  assists: number;
  points: number;
  toiSeconds: number;
  ppm: number;              // Points Per Minute
  shotsOnGoal: number;
  shootingPct: number;      // S%
  hits: number;
  blockedShots: number;
  plusMinus: number;
  powerPlayPoints: number;
  shorthandedToiSeconds: number;
}

export interface GoalieLayerMetrics {
  gamesPlayed: number;
  shotsAgainst: number;
  goalsAgainst: number;
  savePct: number;
  shotsPerGoal: number;     // Goalkeeper efficiency: shots faced / goals against
  wins: number;
  toiSeconds: number;
}

export interface SkaterMomentumScore {
  playerId: number;
  playerName: string;
  teamAbbrev: string;
  positionCode: string;
  momentum: LayerMetrics;   // Last 5 games — 50% weight
  season: LayerMetrics;     // Current season — 35% weight
  career: LayerMetrics;     // Career — 15% weight
  composite: LayerMetrics;  // Weighted composite
  sosCoefficient: number;   // 0.8 – 1.2
  energyBar: number;        // 0 – 100
  momentumRank: number;
  breakoutDelta: number;    // Momentum PPM - Season PPM
  injuryStatus: string | null;
  calculatedAt: string;     // ISO timestamp
}

export interface GoalieMomentumScore {
  playerId: number;
  playerName: string;
  teamAbbrev: string;
  momentum: GoalieLayerMetrics;
  season: GoalieLayerMetrics;
  career: GoalieLayerMetrics;
  composite: GoalieLayerMetrics;
  energyBar: number;
  calculatedAt: string;
}

// ─── Prediction Model ─────────────────────────────────────────────────────────

export interface GamePrediction {
  id: string;
  gameId: number;
  modelVersion: string;
  predictedHomeScore: number;
  predictedAwayScore: number;
  homeWinProbability: number;
  awayWinProbability: number;
  otProbability: number;
  // Breakdown of factors
  homeOffensivePotential: number;
  awayOffensivePotential: number;
  homeDefensiveFilter: number;
  awayDefensiveFilter: number;
  homeSosMultiplier: number;
  awaySosMultiplier: number;
  homeEnergyBar: number;
  awayEnergyBar: number;
  disciplinePenaltyApplied: boolean;
  injuredPlayersExcluded: string[];  // playerIds excluded
  inputSnapshot: Record<string, unknown>;  // full input for auditability
  createdAt: string;
}

export interface PredictionOutcome {
  id: string;
  predictionId: string;
  gameId: number;
  actualHomeScore: number;
  actualAwayScore: number;
  homeScoreError: number;   // |predicted - actual|
  awayScoreError: number;
  correctWinner: boolean;
  recordedAt: string;
}

export interface ModelAccuracy {
  modelVersion: string;
  totalPredictions: number;
  avgHomeScoreError: number;
  avgAwayScoreError: number;
  winnerAccuracyPct: number;
  avgTotalScoreError: number;
}

// ─── API Response Wrappers ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  error: string | null;
  cachedAt?: string;
}

export interface RankingsResponse {
  top100: SkaterMomentumScore[];
  breakoutWatch: SkaterMomentumScore[];  // Top 10 by breakoutDelta
  momentumLeaders: {
    skaters: SkaterMomentumScore[];      // Top 5
    goalies: GoalieMomentumScore[];      // Top 5
  };
}
