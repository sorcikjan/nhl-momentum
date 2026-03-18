import type { SkaterMomentumScore, GoalieMomentumScore, GamePrediction } from '@/types';
import { energyMultiplier } from './energy';

// ─── xG Prediction Engine ─────────────────────────────────────────────────────
// Model v1.0 — Pure statistical formula from PRD

const MODEL_VERSION = 'v1.0';

// League average team block factor baseline
const LEAGUE_AVG_BLOCK_FACTOR = 1.0;

// Top 10% SH TOI threshold for discipline penalty
const DISCIPLINE_SH_TOI_PERCENTILE_THRESHOLD = 0.9;

interface TeamInputs {
  skaters: SkaterMomentumScore[];     // Active, non-injured roster
  goalie: GoalieMomentumScore;
  energyBar: number;
  sosMultiplier: number;
  shToiPercentile: number;           // 0–1, league percentile for SH TOI
}

/**
 * Offensive Potential = Σ(individual skater PPM probabilities)
 *                       * SOS multiplier
 *                       * energy factor
 */
function calcOffensivePotential(inputs: TeamInputs): number {
  const totalPPM = inputs.skaters.reduce(
    (sum, s) => sum + s.composite.ppm,
    0
  );
  const energy = energyMultiplier(inputs.energyBar);
  return totalPPM * inputs.sosMultiplier * energy;
}

/**
 * Defensive Filter = (Goalie Momentum shotsPerGoal)
 *                    * team block factor
 *                    * (1 - discipline penalty)
 */
function calcDefensiveFilter(inputs: TeamInputs): number {
  const goalieStrength = inputs.goalie.momentum.shotsPerGoal;
  const blockFactor = LEAGUE_AVG_BLOCK_FACTOR; // TODO: derive from team blocks data
  const disciplinePenalty =
    inputs.shToiPercentile >= DISCIPLINE_SH_TOI_PERCENTILE_THRESHOLD
      ? 0.075 // 5–10% reduction, midpoint 7.5%
      : 0;

  return goalieStrength * blockFactor * (1 - disciplinePenalty);
}

/**
 * Expected Score = Offensive Potential / Defensive Filter
 */
function expectedScore(offPotential: number, defFilter: number): number {
  if (defFilter === 0) return 0;
  return offPotential / defFilter;
}

/**
 * Convert raw xG scores to win/OT probabilities using a simple softmax-like approach.
 * This will be replaced by a calibrated ML model once we have outcome data.
 */
function calcProbabilities(homeXG: number, awayXG: number) {
  const total = homeXG + awayXG;
  if (total === 0) return { home: 0.33, away: 0.33, ot: 0.34 };

  const homeBase = homeXG / total;
  const awayBase = awayXG / total;

  // Home ice advantage: ~55% historical win rate when even
  const homeAdj = Math.min(0.85, homeBase * 1.05);
  const awayAdj = Math.min(0.85, awayBase * 0.95);

  // OT probability increases as scores converge
  const convergence = 1 - Math.abs(homeXG - awayXG) / Math.max(homeXG, awayXG, 0.01);
  const otProb = Math.min(0.25, convergence * 0.2);

  const remainingProb = 1 - otProb;
  const homeWin = (homeAdj / (homeAdj + awayAdj)) * remainingProb;
  const awayWin = remainingProb - homeWin;

  return { home: homeWin, away: awayWin, ot: otProb };
}

// ─── Main Prediction Builder ───────────────────────────────────────────────────

export function buildPrediction(
  gameId: number,
  homeInputs: TeamInputs,
  awayInputs: TeamInputs,
): Omit<GamePrediction, 'id' | 'createdAt'> {
  const injuredExcluded: string[] = [
    ...homeInputs.skaters.filter(s => s.injuryStatus).map(s => String(s.playerId)),
    ...awayInputs.skaters.filter(s => s.injuryStatus).map(s => String(s.playerId)),
  ];

  const homeOffPotential = calcOffensivePotential(homeInputs);
  const awayOffPotential = calcOffensivePotential(awayInputs);
  const homeDefFilter    = calcDefensiveFilter(homeInputs);
  const awayDefFilter    = calcDefensiveFilter(awayInputs);

  const homeXG = expectedScore(homeOffPotential, awayDefFilter);
  const awayXG = expectedScore(awayOffPotential, homeDefFilter);

  const probs = calcProbabilities(homeXG, awayXG);

  const disciplinePenaltyApplied =
    homeInputs.shToiPercentile >= DISCIPLINE_SH_TOI_PERCENTILE_THRESHOLD ||
    awayInputs.shToiPercentile >= DISCIPLINE_SH_TOI_PERCENTILE_THRESHOLD;

  return {
    gameId,
    modelVersion: MODEL_VERSION,
    predictedHomeScore: Math.round(homeXG * 10) / 10,
    predictedAwayScore: Math.round(awayXG * 10) / 10,
    homeWinProbability: Math.round(probs.home * 1000) / 1000,
    awayWinProbability: Math.round(probs.away * 1000) / 1000,
    otProbability:      Math.round(probs.ot * 1000) / 1000,
    homeOffensivePotential: homeOffPotential,
    awayOffensivePotential: awayOffPotential,
    homeDefensiveFilter:    homeDefFilter,
    awayDefensiveFilter:    awayDefFilter,
    homeSosMultiplier:      homeInputs.sosMultiplier,
    awaySosMultiplier:      awayInputs.sosMultiplier,
    homeEnergyBar:          homeInputs.energyBar,
    awayEnergyBar:          awayInputs.energyBar,
    disciplinePenaltyApplied,
    injuredPlayersExcluded: injuredExcluded,
    inputSnapshot: {
      home: {
        skaterCount: homeInputs.skaters.length,
        goalie: homeInputs.goalie.playerName,
        energyBar: homeInputs.energyBar,
        sosMultiplier: homeInputs.sosMultiplier,
      },
      away: {
        skaterCount: awayInputs.skaters.length,
        goalie: awayInputs.goalie.playerName,
        energyBar: awayInputs.energyBar,
        sosMultiplier: awayInputs.sosMultiplier,
      },
    },
  };
}
