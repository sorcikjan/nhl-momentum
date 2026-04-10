// ─── Shared prediction model types and formulas ───────────────────────────────
// All model versions live here so both the daily ingest (snapshot generation)
// and the backtest route can run them from a single source of truth.

export interface ModelResult {
  homeXG: number; awayXG: number;
  homeWin: number; awayWin: number;
  homeOff?: number; awayOff?: number;
  homeDef?: number; awayDef?: number;
}

export interface SkaterSnap {
  compositePpm: number;
  momentumPpm?: number;
  seasonPpm?: number;
  injuryStatus: string | null;
}

export interface GoalieSnap {
  momentumShotsPerGoal: number;
  seasonShotsPerGoal?: number;
  teamRecentForm?: number;
  isBackToBack?: boolean;
  energyBar?: number;
}

export interface TeamSnap {
  energyBar: number;
  sosMultiplier: number;
  shToiPercentile: number;
  skaters: SkaterSnap[];
  goalie: GoalieSnap;
}

function energyMultiplierFromBar(energyBar: number): number {
  if (energyBar >= 70) return 1.0;
  return 0.6 + (energyBar / 70) * 0.4;
}

function goalieEnergyPenaltyFromBar(energyBar: number): number {
  if (energyBar >= 70) return 1.0;
  return 1.0 + ((70 - energyBar) / 70) * 0.15;
}

// v1.0 — original formula (kept for historical comparison)
function runModelV1(homeSnap: TeamSnap, awaySnap: TeamSnap): ModelResult {
  const DISCIPLINE_THRESHOLD = 0.9;
  const LEAGUE_AVG_BLOCK = 1.0;

  function offPotential(snap: TeamSnap) {
    const activeSkaters = snap.skaters.filter(s => !s.injuryStatus);
    const totalPPM = activeSkaters.reduce((sum, s) => sum + s.compositePpm, 0);
    return totalPPM * snap.sosMultiplier * energyMultiplierFromBar(snap.energyBar);
  }

  function defFilter(snap: TeamSnap) {
    const disciplinePenalty = snap.shToiPercentile >= DISCIPLINE_THRESHOLD ? 0.075 : 0;
    return snap.goalie.momentumShotsPerGoal * LEAGUE_AVG_BLOCK * (1 - disciplinePenalty);
  }

  const homeOff = offPotential(homeSnap);
  const awayOff = offPotential(awaySnap);
  const homeDef = defFilter(homeSnap);
  const awayDef = defFilter(awaySnap);

  const homeXG = awayDef > 0 ? homeOff / awayDef : 0;
  const awayXG = homeDef > 0 ? awayOff / homeDef : 0;
  const total = homeXG + awayXG;
  if (total === 0) return { homeXG: 0, awayXG: 0, homeWin: 0.5, awayWin: 0.5 };

  const homeBase = homeXG / total;
  const awayBase = awayXG / total;
  const homeAdj = Math.min(0.85, homeBase * 1.05);
  const awayAdj = Math.min(0.85, awayBase * 0.95);
  const homeWin = homeAdj / (homeAdj + awayAdj);

  return {
    homeXG: Math.round(homeXG * 100) / 100,
    awayXG: Math.round(awayXG * 100) / 100,
    homeWin: Math.round(homeWin * 1000) / 1000,
    awayWin: Math.round((1 - homeWin) * 1000) / 1000,
  };
}

// v1.1 — adds GOAL_SCALE to fix unit mismatch
function runModelV1_1(homeSnap: TeamSnap, awaySnap: TeamSnap): ModelResult {
  const GOAL_SCALE = 90;
  const DISCIPLINE_THRESHOLD = 0.9;
  const MIN_SPG = 12;
  const MAX_SPG = 40;

  function offPotential(snap: TeamSnap) {
    const activeSkaters = snap.skaters.filter(s => !s.injuryStatus);
    const totalPPM = activeSkaters.reduce((sum, s) => sum + Math.max(0, s.compositePpm), 0);
    return totalPPM * snap.sosMultiplier * energyMultiplierFromBar(snap.energyBar);
  }

  function defFilter(snap: TeamSnap) {
    const spg = Math.min(MAX_SPG, Math.max(MIN_SPG, snap.goalie.momentumShotsPerGoal || 22));
    const disciplinePenalty = snap.shToiPercentile >= DISCIPLINE_THRESHOLD ? 0.075 : 0;
    return spg * (1 - disciplinePenalty);
  }

  const homeOff = offPotential(homeSnap);
  const awayOff = offPotential(awaySnap);
  const homeDef = defFilter(homeSnap);
  const awayDef = defFilter(awaySnap);

  const homeXG = awayDef > 0 ? (homeOff * GOAL_SCALE) / awayDef : 0;
  const awayXG = homeDef > 0 ? (awayOff * GOAL_SCALE) / homeDef : 0;
  const total = homeXG + awayXG;
  if (total === 0) return { homeXG: 0, awayXG: 0, homeWin: 0.5, awayWin: 0.5, homeOff, awayOff, homeDef, awayDef };

  const homeBase = homeXG / total;
  const awayBase = awayXG / total;
  const homeAdj = Math.min(0.85, homeBase * 1.05);
  const awayAdj = Math.min(0.85, awayBase * 0.95);
  const homeWin = homeAdj / (homeAdj + awayAdj);

  return {
    homeXG: Math.round(homeXG * 10) / 10,
    awayXG: Math.round(awayXG * 10) / 10,
    homeWin: Math.round(homeWin * 1000) / 1000,
    awayWin: Math.round((1 - homeWin) * 1000) / 1000,
    homeOff: Math.round(homeOff * GOAL_SCALE * 10) / 10,
    awayOff: Math.round(awayOff * GOAL_SCALE * 10) / 10,
    homeDef: Math.round(homeDef * 10) / 10,
    awayDef: Math.round(awayDef * 10) / 10,
  };
}

// v1.2 — binary winner, no OT bucket
function runModelV1_2(homeSnap: TeamSnap, awaySnap: TeamSnap): ModelResult {
  const GOAL_SCALE = 90;
  const DISCIPLINE_THRESHOLD = 0.9;
  const MIN_SPG = 12;
  const MAX_SPG = 40;

  function offPotential(snap: TeamSnap) {
    const activeSkaters = snap.skaters.filter(s => !s.injuryStatus);
    const totalPPM = activeSkaters.reduce((sum, s) => sum + Math.max(0, s.compositePpm), 0);
    return totalPPM * snap.sosMultiplier * energyMultiplierFromBar(snap.energyBar);
  }

  function defFilter(snap: TeamSnap) {
    const spg = Math.min(MAX_SPG, Math.max(MIN_SPG, snap.goalie.momentumShotsPerGoal || 22));
    const disciplinePenalty = snap.shToiPercentile >= DISCIPLINE_THRESHOLD ? 0.075 : 0;
    return spg * (1 - disciplinePenalty);
  }

  const homeOff = offPotential(homeSnap);
  const awayOff = offPotential(awaySnap);
  const homeDef = defFilter(homeSnap);
  const awayDef = defFilter(awaySnap);

  const homeXG = awayDef > 0 ? (homeOff * GOAL_SCALE) / awayDef : 0;
  const awayXG = homeDef > 0 ? (awayOff * GOAL_SCALE) / homeDef : 0;
  const total = homeXG + awayXG;
  if (total === 0) return { homeXG: 0, awayXG: 0, homeWin: 0.5, awayWin: 0.5,  homeOff, awayOff, homeDef, awayDef };

  const homeBase = homeXG / total;
  const awayBase = awayXG / total;
  const homeAdj = Math.min(0.9, homeBase * 1.05);
  const awayAdj = Math.min(0.9, awayBase * 0.95);
  const homeWin = homeAdj / (homeAdj + awayAdj);

  return {
    homeXG: Math.round(homeXG * 10) / 10,
    awayXG: Math.round(awayXG * 10) / 10,
    homeWin: Math.round(homeWin * 1000) / 1000,
    awayWin: Math.round((1 - homeWin) * 1000) / 1000,

    homeOff: Math.round(homeOff * GOAL_SCALE * 10) / 10,
    awayOff: Math.round(awayOff * GOAL_SCALE * 10) / 10,
    homeDef: Math.round(homeDef * 10) / 10,
    awayDef: Math.round(awayDef * 10) / 10,
  };
}

// v1.3 — real SOS signal via sos_multiplier, HOME_EDGE=1.08, GOAL_SCALE=70
function runModelV1_3(homeSnap: TeamSnap, awaySnap: TeamSnap): ModelResult {
  const GOAL_SCALE = 70;
  const DISCIPLINE_THRESHOLD = 0.9;
  const MIN_SPG = 12;
  const MAX_SPG = 40;
  const HOME_EDGE = 1.08;
  const AWAY_EDGE = 0.92;

  function offPotential(snap: TeamSnap) {
    const activeSkaters = snap.skaters.filter(s => !s.injuryStatus);
    const totalPPM = activeSkaters.reduce((sum, s) => sum + Math.max(0, s.compositePpm), 0);
    return totalPPM * snap.sosMultiplier * energyMultiplierFromBar(snap.energyBar);
  }

  function defFilter(snap: TeamSnap) {
    const spg = Math.min(MAX_SPG, Math.max(MIN_SPG, snap.goalie.momentumShotsPerGoal || 22));
    const disciplinePenalty = snap.shToiPercentile >= DISCIPLINE_THRESHOLD ? 0.075 : 0;
    return spg * (1 - disciplinePenalty);
  }

  const homeOff = offPotential(homeSnap);
  const awayOff = offPotential(awaySnap);
  const homeDef = defFilter(homeSnap);
  const awayDef = defFilter(awaySnap);

  const homeXG = awayDef > 0 ? (homeOff * GOAL_SCALE) / awayDef : 0;
  const awayXG = homeDef > 0 ? (awayOff * GOAL_SCALE) / homeDef : 0;
  const total = homeXG + awayXG;
  if (total === 0) return { homeXG: 0, awayXG: 0, homeWin: 0.52, awayWin: 0.48,  homeOff, awayOff, homeDef, awayDef };

  const homeBase = homeXG / total;
  const awayBase = awayXG / total;
  const homeAdj = Math.min(0.92, homeBase * HOME_EDGE);
  const awayAdj = Math.min(0.92, awayBase * AWAY_EDGE);
  const homeWin = homeAdj / (homeAdj + awayAdj);

  return {
    homeXG: Math.round(homeXG * 10) / 10,
    awayXG: Math.round(awayXG * 10) / 10,
    homeWin: Math.round(homeWin * 1000) / 1000,
    awayWin: Math.round((1 - homeWin) * 1000) / 1000,

    homeOff: Math.round(homeOff * GOAL_SCALE * 10) / 10,
    awayOff: Math.round(awayOff * GOAL_SCALE * 10) / 10,
    homeDef: Math.round(homeDef * 10) / 10,
    awayDef: Math.round(awayDef * 10) / 10,
  };
}

// v1.4 — HOME_EDGE=1.04, SOS scaling ×0.4, adds recent form
function runModelV1_4(homeSnap: TeamSnap, awaySnap: TeamSnap): ModelResult {
  const GOAL_SCALE = 70;
  const MIN_SPG = 12;
  const MAX_SPG = 40;
  const HOME_EDGE = 1.04;
  const AWAY_EDGE = 0.96;

  function offPotential(snap: TeamSnap) {
    const activeSkaters = snap.skaters.filter(s => !s.injuryStatus);
    const totalPPM = activeSkaters.reduce((sum, s) => sum + Math.max(0, s.compositePpm), 0);
    const recentForm = snap.goalie.teamRecentForm ?? 1.0;
    return totalPPM * snap.sosMultiplier * recentForm * energyMultiplierFromBar(snap.energyBar);
  }

  function defFilter(snap: TeamSnap) {
    return Math.min(MAX_SPG, Math.max(MIN_SPG, snap.goalie.momentumShotsPerGoal || 22));
  }

  const homeOff = offPotential(homeSnap);
  const awayOff = offPotential(awaySnap);
  const homeDef = defFilter(homeSnap);
  const awayDef = defFilter(awaySnap);

  const homeXG = awayDef > 0 ? (homeOff * GOAL_SCALE) / awayDef : 0;
  const awayXG = homeDef > 0 ? (awayOff * GOAL_SCALE) / homeDef : 0;
  const total = homeXG + awayXG;
  if (total === 0) return { homeXG: 0, awayXG: 0, homeWin: 0.52, awayWin: 0.48,  homeOff, awayOff, homeDef, awayDef };

  const homeBase = homeXG / total;
  const awayBase = awayXG / total;
  const homeAdj = Math.min(0.90, homeBase * HOME_EDGE);
  const awayAdj = Math.min(0.90, awayBase * AWAY_EDGE);
  const homeWin = homeAdj / (homeAdj + awayAdj);

  return {
    homeXG: Math.round(homeXG * 10) / 10,
    awayXG: Math.round(awayXG * 10) / 10,
    homeWin: Math.round(homeWin * 1000) / 1000,
    awayWin: Math.round((1 - homeWin) * 1000) / 1000,

    homeOff: Math.round(homeOff * GOAL_SCALE * 10) / 10,
    awayOff: Math.round(awayOff * GOAL_SCALE * 10) / 10,
    homeDef: Math.round(homeDef * 10) / 10,
    awayDef: Math.round(awayDef * 10) / 10,
  };
}

// v1.5 — probability regression toward 50%, near-neutral home ice, last-5 form
function runModelV1_5(homeSnap: TeamSnap, awaySnap: TeamSnap): ModelResult {
  const GOAL_SCALE = 70;
  const MIN_SPG = 12;
  const MAX_SPG = 40;
  const HOME_EDGE = 1.01;
  const AWAY_EDGE = 0.99;
  const REGRESSION = 0.6;

  function offPotential(snap: TeamSnap) {
    const activeSkaters = snap.skaters.filter(s => !s.injuryStatus);
    const totalPPM = activeSkaters.reduce((sum, s) => sum + Math.max(0, s.compositePpm), 0);
    const recentForm = snap.goalie.teamRecentForm ?? 1.0;
    return totalPPM * snap.sosMultiplier * recentForm * energyMultiplierFromBar(snap.energyBar);
  }

  function defFilter(snap: TeamSnap) {
    return Math.min(MAX_SPG, Math.max(MIN_SPG, snap.goalie.momentumShotsPerGoal || 22));
  }

  const homeOff = offPotential(homeSnap);
  const awayOff = offPotential(awaySnap);
  const homeDef = defFilter(homeSnap);
  const awayDef = defFilter(awaySnap);

  const homeXG = awayDef > 0 ? (homeOff * GOAL_SCALE) / awayDef : 0;
  const awayXG = homeDef > 0 ? (awayOff * GOAL_SCALE) / homeDef : 0;
  const total = homeXG + awayXG;
  if (total === 0) return { homeXG: 0, awayXG: 0, homeWin: 0.5, awayWin: 0.5,  homeOff, awayOff, homeDef, awayDef };

  const homeBase = homeXG / total;
  const awayBase = awayXG / total;
  const homeAdj = Math.min(0.90, homeBase * HOME_EDGE);
  const awayAdj = Math.min(0.90, awayBase * AWAY_EDGE);
  const rawHomeWin = homeAdj / (homeAdj + awayAdj);
  const homeWin = 0.5 + (rawHomeWin - 0.5) * REGRESSION;

  return {
    homeXG: Math.round(homeXG * 10) / 10,
    awayXG: Math.round(awayXG * 10) / 10,
    homeWin: Math.round(homeWin * 1000) / 1000,
    awayWin: Math.round((1 - homeWin) * 1000) / 1000,

    homeOff: Math.round(homeOff * GOAL_SCALE * 10) / 10,
    awayOff: Math.round(awayOff * GOAL_SCALE * 10) / 10,
    homeDef: Math.round(homeDef * 10) / 10,
    awayDef: Math.round(awayDef * 10) / 10,
  };
}

// v1.6 — season-weighted PPM (0.2 momentum + 0.8 season), HOME_EDGE=1.03
function runModelV1_6(homeSnap: TeamSnap, awaySnap: TeamSnap): ModelResult {
  const GOAL_SCALE = 70;
  const MIN_SPG = 12;
  const MAX_SPG = 40;
  const HOME_EDGE = 1.03;
  const AWAY_EDGE = 0.97;
  const REGRESSION = 0.6;
  const MOMENTUM_W = 0.2;
  const SEASON_W = 0.8;

  function effectivePPM(s: SkaterSnap): number {
    if (s.momentumPpm !== undefined && s.seasonPpm !== undefined) {
      return MOMENTUM_W * s.momentumPpm + SEASON_W * s.seasonPpm;
    }
    return s.compositePpm;
  }

  function offPotential(snap: TeamSnap) {
    const activeSkaters = snap.skaters.filter(s => !s.injuryStatus);
    const totalPPM = activeSkaters.reduce((sum, s) => sum + Math.max(0, effectivePPM(s)), 0);
    const recentForm = snap.goalie.teamRecentForm ?? 1.0;
    return totalPPM * snap.sosMultiplier * recentForm * energyMultiplierFromBar(snap.energyBar);
  }

  function defFilter(snap: TeamSnap) {
    return Math.min(MAX_SPG, Math.max(MIN_SPG, snap.goalie.momentumShotsPerGoal || 22));
  }

  const homeOff = offPotential(homeSnap);
  const awayOff = offPotential(awaySnap);
  const homeDef = defFilter(homeSnap);
  const awayDef = defFilter(awaySnap);

  const homeXG = awayDef > 0 ? (homeOff * GOAL_SCALE) / awayDef : 0;
  const awayXG = homeDef > 0 ? (awayOff * GOAL_SCALE) / homeDef : 0;
  const total = homeXG + awayXG;
  if (total === 0) return { homeXG: 0, awayXG: 0, homeWin: 0.5, awayWin: 0.5,  homeOff, awayOff, homeDef, awayDef };

  const homeBase = homeXG / total;
  const awayBase = awayXG / total;
  const homeAdj = Math.min(0.90, homeBase * HOME_EDGE);
  const awayAdj = Math.min(0.90, awayBase * AWAY_EDGE);
  const rawHomeWin = homeAdj / (homeAdj + awayAdj);
  const homeWin = 0.5 + (rawHomeWin - 0.5) * REGRESSION;

  return {
    homeXG: Math.round(homeXG * 10) / 10,
    awayXG: Math.round(awayXG * 10) / 10,
    homeWin: Math.round(homeWin * 1000) / 1000,
    awayWin: Math.round((1 - homeWin) * 1000) / 1000,

    homeOff: Math.round(homeOff * GOAL_SCALE * 10) / 10,
    awayOff: Math.round(awayOff * GOAL_SCALE * 10) / 10,
    homeDef: Math.round(homeDef * 10) / 10,
    awayDef: Math.round(awayDef * 10) / 10,
  };
}

// v1.7 — neutral home ice, GF/GA SOS, B2B fatigue, season goalie SPG
function runModelV1_7(homeSnap: TeamSnap, awaySnap: TeamSnap): ModelResult {
  const GOAL_SCALE = 100;
  const MIN_SPG = 12;
  const MAX_SPG = 40;
  const HOME_EDGE = 1.0;
  const AWAY_EDGE = 1.0;
  const REGRESSION = 0.6;
  const MOMENTUM_W = 0.2;
  const SEASON_W = 0.8;
  const B2B_PENALTY = 0.92;

  function effectivePPM(s: SkaterSnap): number {
    if (s.momentumPpm !== undefined && s.seasonPpm !== undefined) {
      return MOMENTUM_W * s.momentumPpm + SEASON_W * s.seasonPpm;
    }
    return s.compositePpm;
  }

  function offPotential(snap: TeamSnap) {
    const activeSkaters = snap.skaters.filter(s => !s.injuryStatus);
    const totalPPM = activeSkaters.reduce((sum, s) => sum + Math.max(0, effectivePPM(s)), 0);
    const recentForm = snap.goalie.teamRecentForm ?? 1.0;
    const b2bMult = snap.goalie.isBackToBack ? B2B_PENALTY : 1.0;
    return totalPPM * snap.sosMultiplier * recentForm * energyMultiplierFromBar(snap.energyBar) * b2bMult;
  }

  function defFilter(snap: TeamSnap) {
    const spg = snap.goalie.seasonShotsPerGoal ?? snap.goalie.momentumShotsPerGoal;
    return Math.min(MAX_SPG, Math.max(MIN_SPG, spg || 22))
      * goalieEnergyPenaltyFromBar(snap.goalie.energyBar ?? 100);
  }

  const homeOff = offPotential(homeSnap);
  const awayOff = offPotential(awaySnap);
  const homeDef = defFilter(homeSnap);
  const awayDef = defFilter(awaySnap);

  const homeXG = awayDef > 0 ? (homeOff * GOAL_SCALE) / awayDef : 0;
  const awayXG = homeDef > 0 ? (awayOff * GOAL_SCALE) / homeDef : 0;
  const total = homeXG + awayXG;
  if (total === 0) return { homeXG: 0, awayXG: 0, homeWin: 0.5, awayWin: 0.5,  homeOff, awayOff, homeDef, awayDef };

  const homeBase = homeXG / total;
  const awayBase = awayXG / total;
  const homeAdj = Math.min(0.90, homeBase * HOME_EDGE);
  const awayAdj = Math.min(0.90, awayBase * AWAY_EDGE);
  const rawHomeWin = homeAdj / (homeAdj + awayAdj);
  const homeWin = 0.5 + (rawHomeWin - 0.5) * REGRESSION;

  return {
    homeXG: Math.round(homeXG * 10) / 10,
    awayXG: Math.round(awayXG * 10) / 10,
    homeWin: Math.round(homeWin * 1000) / 1000,
    awayWin: Math.round((1 - homeWin) * 1000) / 1000,

    homeOff: Math.round(homeOff * GOAL_SCALE * 10) / 10,
    awayOff: Math.round(awayOff * GOAL_SCALE * 10) / 10,
    homeDef: Math.round(homeDef * 10) / 10,
    awayDef: Math.round(awayDef * 10) / 10,
  };
}

// Registry of all model versions — add new versions here
export const MODEL_REGISTRY: Record<string, (home: TeamSnap, away: TeamSnap) => ModelResult> = {
  'v1.0': runModelV1,
  'v1.1': runModelV1_1,
  'v1.2': runModelV1_2,
  'v1.3': runModelV1_3,
  'v1.4': runModelV1_4,
  'v1.5': runModelV1_5,
  'v1.6': runModelV1_6,
  'v1.7': runModelV1_7,
};
