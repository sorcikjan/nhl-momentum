import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// ─── Backtest Engine ───────────────────────────────────────────────────────────
// Reads stored game_team_snapshots (the model-agnostic raw state captured at
// game time) and re-runs the specified model formula against them.
//
// POST /api/backtest
// Body: { model_version: "v1.1", formula_spec: { ... } }
//   — registers the model version and runs it against all stored snapshots
//     that don't yet have a prediction for this model version.
//
// GET /api/backtest?compare=v1.0,v1.1&game_id=123
//   — returns side-by-side predictions from multiple model versions for a game,
//     plus the actual outcome.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Shared helpers ────────────────────────────────────────────────────────────

function energyMultiplierFromBar(energyBar: number): number {
  if (energyBar >= 70) return 1.0;
  return 0.6 + (energyBar / 70) * 0.4;
}

interface ModelResult {
  homeXG: number; awayXG: number;
  homeWin: number; awayWin: number; ot: number;
  homeOff?: number; awayOff?: number;
  homeDef?: number; awayDef?: number;
}

interface SkaterSnap {
  compositePpm: number;
  momentumPpm?: number;
  seasonPpm?: number;
  injuryStatus: string | null;
}

interface GoalieSnap {
  momentumShotsPerGoal: number;
  seasonShotsPerGoal?: number;
  teamRecentForm?: number;
  isBackToBack?: boolean;
}

interface TeamSnap {
  energyBar: number;
  sosMultiplier: number;
  shToiPercentile: number;
  skaters: SkaterSnap[];
  goalie: GoalieSnap;
}

// v1.0 — original formula (kept for historical comparison; xG outputs were ~0.03 due to unit mismatch)
function runModelV1(homeSnap: TeamSnap, awaySnap: TeamSnap) {
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
  if (total === 0) return { homeXG: 0, awayXG: 0, homeWin: 0.33, awayWin: 0.33, ot: 0.34 };

  const homeBase = homeXG / total;
  const awayBase = awayXG / total;
  const homeAdj = Math.min(0.85, homeBase * 1.05);
  const awayAdj = Math.min(0.85, awayBase * 0.95);
  const convergence = 1 - Math.abs(homeXG - awayXG) / Math.max(homeXG, awayXG, 0.01);
  const otProb = Math.min(0.25, convergence * 0.2);
  const remaining = 1 - otProb;
  const homeWin = (homeAdj / (homeAdj + awayAdj)) * remaining;

  return {
    homeXG: Math.round(homeXG * 100) / 100,
    awayXG: Math.round(awayXG * 100) / 100,
    homeWin: Math.round(homeWin * 1000) / 1000,
    awayWin: Math.round((remaining - homeWin) * 1000) / 1000,
    ot: Math.round(otProb * 1000) / 1000,
  };
}

// v1.1 — same structure as v1.0 but adds GOAL_SCALE to fix the unit mismatch.
// compositePpm sums to ~0.5–1.5 for a team roster; momentumShotsPerGoal is ~15–35.
// Without scaling, homeXG ≈ 0.03 instead of ~3. GOAL_SCALE = 90 calibrates the
// output to realistic NHL scoring (avg ~3 goals per team per game).
function runModelV1_1(homeSnap: TeamSnap, awaySnap: TeamSnap) {
  const GOAL_SCALE = 90;        // calibration: maps PPM sum → expected goals
  const DISCIPLINE_THRESHOLD = 0.9;
  const MIN_SPG = 12;           // floor: even a bad goalie yields a goal every 12 shots
  const MAX_SPG = 40;           // cap: a hot goalie shouldn't suppress to near-zero

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
  if (total === 0) return {
    homeXG: 0, awayXG: 0, homeWin: 0.33, awayWin: 0.33, ot: 0.34,
    homeOff, awayOff, homeDef, awayDef,
  };

  const homeBase = homeXG / total;
  const awayBase = awayXG / total;
  const homeAdj = Math.min(0.85, homeBase * 1.05);
  const awayAdj = Math.min(0.85, awayBase * 0.95);
  const convergence = 1 - Math.abs(homeXG - awayXG) / Math.max(homeXG, awayXG, 0.01);
  const otProb = Math.min(0.25, convergence * 0.2);
  const remaining = 1 - otProb;
  const homeWin = (homeAdj / (homeAdj + awayAdj)) * remaining;

  return {
    homeXG: Math.round(homeXG * 10) / 10,
    awayXG: Math.round(awayXG * 10) / 10,
    homeWin: Math.round(homeWin * 1000) / 1000,
    awayWin: Math.round((remaining - homeWin) * 1000) / 1000,
    ot: Math.round(otProb * 1000) / 1000,
    homeOff: Math.round(homeOff * GOAL_SCALE * 10) / 10,
    awayOff: Math.round(awayOff * GOAL_SCALE * 10) / 10,
    homeDef: Math.round(homeDef * 10) / 10,
    awayDef: Math.round(awayDef * 10) / 10,
  };
}

// v1.2 — binary winner prediction. Removes OT as a possible outcome.
// Every game has a winner; OT just extends regulation. homeWin + awayWin = 1.0 always.
// Same xG formula as v1.1 (GOAL_SCALE=90); only the probability mapping changes.
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
  if (total === 0) return {
    homeXG: 0, awayXG: 0, homeWin: 0.5, awayWin: 0.5, ot: 0,
    homeOff, awayOff, homeDef, awayDef,
  };

  // Apply home-ice advantage and normalize to 1.0 (no OT bucket)
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
    ot: 0,
    homeOff: Math.round(homeOff * GOAL_SCALE * 10) / 10,
    awayOff: Math.round(awayOff * GOAL_SCALE * 10) / 10,
    homeDef: Math.round(homeDef * 10) / 10,
    awayDef: Math.round(awayDef * 10) / 10,
  };
}

// v1.3 — adds real team-strength signal via sos_multiplier (season win%).
// Previous versions had sos_multiplier = 1.0 for all teams (no quality signal).
// Changes vs v1.2:
//   • sos_multiplier now reflects actual season win% (0.92–1.16 range)
//   • Home ice calibrated to +8% (→ ~54–55% home win for equal teams, matches NHL avg)
//   • GOAL_SCALE reduced to 70 (tighter score predictions, avg NHL ~3 goals/team)
function runModelV1_3(homeSnap: TeamSnap, awaySnap: TeamSnap): ModelResult {
  const GOAL_SCALE = 70;
  const DISCIPLINE_THRESHOLD = 0.9;
  const MIN_SPG = 12;
  const MAX_SPG = 40;
  const HOME_EDGE = 1.08;  // home ice: ~54–55% win rate for equal teams
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
  if (total === 0) return {
    homeXG: 0, awayXG: 0, homeWin: 0.52, awayWin: 0.48, ot: 0,
    homeOff, awayOff, homeDef, awayDef,
  };

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
    ot: 0,
    homeOff: Math.round(homeOff * GOAL_SCALE * 10) / 10,
    awayOff: Math.round(awayOff * GOAL_SCALE * 10) / 10,
    homeDef: Math.round(homeDef * 10) / 10,
    awayDef: Math.round(awayDef * 10) / 10,
  };
}

// v1.5 — three targeted fixes from v1.4 analysis (54-game sample):
//
//   1. PROBABILITY REGRESSION toward 50% (×0.6 shrinkage factor)
//      v1.4 confidence buckets showed a clear inversion: 50–55% picks hit 68%
//      while 60–65% picks hit only 43%. Our signals (PPM × SOS × form) claim more
//      certainty than they can deliver against hockey's high per-game variance.
//      After computing the raw win probability, we shrink it toward 50%:
//        homeWin = 0.5 + (rawHomeWin – 0.5) × 0.6
//      Effect: a raw 74% pick becomes 64%; a 65% pick becomes 59%.
//      TODO: calibrate the 0.6 factor against a held-out outcome set rather than
//      picking it manually — logistic regression on confidence vs outcome would help.
//
//   2. NEUTRAL HOME ICE (1.01 / 0.99, down from 1.04 / 0.96)
//      v1.4 picked home 57.4% of games but homes actually won only 46.3% in the
//      sample. Model accuracy when picking home was 54.8% vs 65.2% when picking away.
//      Dropping HOME_EDGE to ~neutral lets the PPM/SOS signal carry directionality
//      rather than defaulting everything to a home lean.
//      TODO: replace with per-team home/away win% split once enough season data exists.
//
//   3. RECENT FORM WINDOW: last 5 games (down from 10)
//      10 games covers ~3 weeks of NHL play — too long to reflect current form.
//      A team that went 1-9 then won 4 straight shows as 5-10 (bad) but is hot.
//      Shrinking to 5 games makes the form signal more responsive to current streaks.
//      Requires re-running backfill-sos before backtesting so stored teamRecentForm
//      values reflect the new window.
//      TODO: calibrate window size and decay (recent 3 games > games 4-5).
function runModelV1_5(homeSnap: TeamSnap, awaySnap: TeamSnap): ModelResult {
  const GOAL_SCALE = 70;
  const MIN_SPG = 12;
  const MAX_SPG = 40;

  // Reduced from 1.04/0.96 — v1.4 data showed home bias overclaiming
  // TODO: replace with per-team home/away win% split
  const HOME_EDGE = 1.01;
  const AWAY_EDGE = 0.99;

  // Shrink raw win probability toward 50% to fix confidence inversion.
  // v1.4 high-confidence picks (≥60%) hit only ~45%; low-confidence (50-55%) hit 68%.
  // TODO: calibrate via logistic regression on confidence vs outcome
  const REGRESSION = 0.6;

  function offPotential(snap: TeamSnap) {
    const activeSkaters = snap.skaters.filter(s => !s.injuryStatus);
    const totalPPM = activeSkaters.reduce((sum, s) => sum + Math.max(0, s.compositePpm), 0);
    const sosEffect = snap.sosMultiplier;
    // teamRecentForm now reflects last-5 games (re-run backfill-sos before backtesting)
    const recentForm = snap.goalie.teamRecentForm ?? 1.0;
    return totalPPM * sosEffect * recentForm * energyMultiplierFromBar(snap.energyBar);
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
  if (total === 0) return {
    homeXG: 0, awayXG: 0, homeWin: 0.5, awayWin: 0.5, ot: 0,
    homeOff, awayOff, homeDef, awayDef,
  };

  const homeBase = homeXG / total;
  const awayBase = awayXG / total;
  const homeAdj = Math.min(0.90, homeBase * HOME_EDGE);
  const awayAdj = Math.min(0.90, awayBase * AWAY_EDGE);
  const rawHomeWin = homeAdj / (homeAdj + awayAdj);

  // Regress toward 50% to prevent overconfident picks
  const homeWin = 0.5 + (rawHomeWin - 0.5) * REGRESSION;

  return {
    homeXG: Math.round(homeXG * 10) / 10,
    awayXG: Math.round(awayXG * 10) / 10,
    homeWin: Math.round(homeWin * 1000) / 1000,
    awayWin: Math.round((1 - homeWin) * 1000) / 1000,
    ot: 0,
    homeOff: Math.round(homeOff * GOAL_SCALE * 10) / 10,
    awayOff: Math.round(awayOff * GOAL_SCALE * 10) / 10,
    homeDef: Math.round(homeDef * 10) / 10,
    awayDef: Math.round(awayDef * 10) / 10,
  };
}

// v1.6 — composite PPM reweighted based on weight-search grid results (31-game sample):
//
//   compositePPM = 0.2 × momentumPpm + 0.8 × seasonPpm
//
//   Weight-search showed momentum-heavy weights (0.5+) all tied at 45.2% accuracy,
//   while season-heavy weights (0.1–0.2) reached 48.4%. The full-season record is a
//   stronger predictor than the last-5-game streak on this dataset.
//   Falls back to stored compositePpm for snapshots captured before momentumPpm/seasonPpm
//   were individually stored (v1.3 era snapshots).
//
//   HOME_EDGE restored to 1.03 / 0.97 (up from v1.5's near-neutral 1.01 / 0.99).
//   v1.5 overcorrected — picked home only 40.5% while homes won ~55% in those games.
//   1.03 is between v1.4's 1.04 and v1.5's 1.01.
//
//   All other parameters unchanged from v1.5: GOAL_SCALE=70, REGRESSION=0.6, last-5 form.
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
    // Use raw components if available; fall back to pre-baked composite for old snapshots
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
  if (total === 0) return {
    homeXG: 0, awayXG: 0, homeWin: 0.5, awayWin: 0.5, ot: 0,
    homeOff, awayOff, homeDef, awayDef,
  };

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
    ot: 0,
    homeOff: Math.round(homeOff * GOAL_SCALE * 10) / 10,
    awayOff: Math.round(awayOff * GOAL_SCALE * 10) / 10,
    homeDef: Math.round(homeDef * 10) / 10,
    awayDef: Math.round(awayDef * 10) / 10,
  };
}

// v1.7 — four targeted fixes from v1.6 analysis:
//
//   1. HOME_EDGE = 1.0 (fully neutral)
//      v1.6 picked home 61% of games and hit only 50% on those picks.
//      The PPM/SOS signal should carry directionality — no artificial home boost.
//
//   2. GF/GA RATIO for SOS (replaces season win%)
//      Goals-for/against per game is more granular than binary W/L.
//      A team winning 4-1 is scored differently from one winning 2-1.
//      Formula: 1.0 + (gfPerGame/gaPerGame - 1.0) × 0.3
//      Requires re-running backfill-sos before backtesting.
//
//   3. BACK-TO-BACK FATIGUE (8% offensive output penalty)
//      Teams playing on consecutive nights show measurable performance drops.
//      Stored as isBackToBack in goalie_snapshot.isBackToBack.
//      Requires re-running backfill-sos before backtesting.
//
//   4. SEASON GOALIE SPG for defense filter (replaces last-5 momentum SPG)
//      5 games is too small a sample for goalie quality assessment.
//      Season SPG is more stable; stored as seasonShotsPerGoal.
//      Falls back to momentumShotsPerGoal for old snapshots.
//
//   Unchanged from v1.6: MOMENTUM_W=0.2/SEASON_W=0.8, REGRESSION=0.6, last-5 form.
function runModelV1_7(homeSnap: TeamSnap, awaySnap: TeamSnap): ModelResult {
  const GOAL_SCALE = 70;
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
    // Prefer season SPG (more stable); fall back to momentum for old snapshots
    const spg = snap.goalie.seasonShotsPerGoal ?? snap.goalie.momentumShotsPerGoal;
    return Math.min(MAX_SPG, Math.max(MIN_SPG, spg || 22));
  }

  const homeOff = offPotential(homeSnap);
  const awayOff = offPotential(awaySnap);
  const homeDef = defFilter(homeSnap);
  const awayDef = defFilter(awaySnap);

  const homeXG = awayDef > 0 ? (homeOff * GOAL_SCALE) / awayDef : 0;
  const awayXG = homeDef > 0 ? (awayOff * GOAL_SCALE) / homeDef : 0;

  const total = homeXG + awayXG;
  if (total === 0) return {
    homeXG: 0, awayXG: 0, homeWin: 0.5, awayWin: 0.5, ot: 0,
    homeOff, awayOff, homeDef, awayDef,
  };

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
    ot: 0,
    homeOff: Math.round(homeOff * GOAL_SCALE * 10) / 10,
    awayOff: Math.round(awayOff * GOAL_SCALE * 10) / 10,
    homeDef: Math.round(homeDef * 10) / 10,
    awayDef: Math.round(awayDef * 10) / 10,
  };
}

// v1.4 — fixes two systematic biases identified from v1.3 backtesting:
//
//   1. HOME ICE: reduced from +8% to +4%.
//      v1.3 picked home as favourite 63% of the time vs real NHL ~55%, and
//      home accuracy was only 52%. The +8% was overclaiming.
//
//      TODO: home ice advantage should ultimately be team-specific — some
//      arenas/fanbases create materially more advantage than others. Requires
//      per-team home vs away win% split, which needs more historical game data.
//
//   2. SOS MULTIPLIER: scaling factor reduced from ×0.8 to ×0.4.
//      v1.3 showed an inverted confidence curve: high-confidence picks (driven
//      by SOS spread) were LESS accurate than low-confidence ones. The season
//      win% signal is real but one strong team doesn't win every individual game
//      — hockey variance is too high for aggressive scaling.
//
//      TODO: the linear scaling formula (1.0 + (winPct - 0.5) × k) is artificial.
//      A proper calibration would fit k against historical outcomes to find the
//      multiplier that maximises accuracy without overfitting.
//
//   3. RECENT FORM: adds last-10-game win% as a separate multiplier on top of
//      season SOS. A team on a hot/cold streak is meaningfully different from
//      their season average, but short runs are noisy — scaling kept at ×0.3.
//
//      TODO: optimal window (10 games?) and scaling should be calibrated.
//      Also: form should decay by recency (last 3 games matter more than games 8-10).
function runModelV1_4(homeSnap: TeamSnap, awaySnap: TeamSnap): ModelResult {
  const GOAL_SCALE = 70;
  const MIN_SPG = 12;
  const MAX_SPG = 40;

  // TODO: replace with per-team home/away win% split once enough game history exists
  const HOME_EDGE = 1.04;
  const AWAY_EDGE = 0.96;

  function offPotential(snap: TeamSnap) {
    const activeSkaters = snap.skaters.filter(s => !s.injuryStatus);
    const totalPPM = activeSkaters.reduce((sum, s) => sum + Math.max(0, s.compositePpm), 0);

    // sosMultiplier: season win% signal, scaling ×0.4 (reduced from ×0.8 in v1.3
    // to prevent overconfident picks — see analysis notes above)
    const sosEffect = snap.sosMultiplier; // already computed as 1.0 + (winPct-0.5)×0.4

    // recentForm: last-10-game win% — hot/cold streaks not captured by full-season SOS
    // Falls back to neutral (1.0) for snapshots captured before v1.4 backfill
    const recentForm = snap.goalie.teamRecentForm ?? 1.0;

    return totalPPM * sosEffect * recentForm * energyMultiplierFromBar(snap.energyBar);
  }

  function defFilter(snap: TeamSnap) {
    const spg = Math.min(MAX_SPG, Math.max(MIN_SPG, snap.goalie.momentumShotsPerGoal || 22));
    return spg;
  }

  const homeOff = offPotential(homeSnap);
  const awayOff = offPotential(awaySnap);
  const homeDef = defFilter(homeSnap);
  const awayDef = defFilter(awaySnap);

  const homeXG = awayDef > 0 ? (homeOff * GOAL_SCALE) / awayDef : 0;
  const awayXG = homeDef > 0 ? (awayOff * GOAL_SCALE) / homeDef : 0;

  const total = homeXG + awayXG;
  if (total === 0) return {
    homeXG: 0, awayXG: 0, homeWin: 0.52, awayWin: 0.48, ot: 0,
    homeOff, awayOff, homeDef, awayDef,
  };

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
    ot: 0,
    homeOff: Math.round(homeOff * GOAL_SCALE * 10) / 10,
    awayOff: Math.round(awayOff * GOAL_SCALE * 10) / 10,
    homeDef: Math.round(homeDef * 10) / 10,
    awayDef: Math.round(awayDef * 10) / 10,
  };
}

// Registry of available model formulas.
// When you create v1.1 with a modified formula, add it here.
// The formula_spec from model_versions can override default params.
const MODEL_FORMULAS: Record<string, (
  homeSnap: TeamSnap,
  awaySnap: TeamSnap,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formulaSpec?: Record<string, any>
) => ModelResult> = {
  'v1.0': (h, a) => runModelV1(h, a),
  'v1.1': (h, a) => runModelV1_1(h, a),
  'v1.2': (h, a) => runModelV1_2(h, a),
  'v1.3': (h, a) => runModelV1_3(h, a),
  'v1.4': (h, a) => runModelV1_4(h, a),
  'v1.5': (h, a) => runModelV1_5(h, a),
  'v1.6': (h, a) => runModelV1_6(h, a),
  'v1.7': (h, a) => runModelV1_7(h, a),
};

// ─── GET — compare model versions for a specific game ─────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const compareParam = searchParams.get('compare');   // "v1.0,v1.1"
  const gameId = searchParams.get('game_id');

  if (!compareParam || !gameId) {
    return NextResponse.json({ data: null, error: 'compare and game_id params required' }, { status: 400 });
  }

  const versions = compareParam.split(',').map(v => v.trim());

  // Fetch predictions for all requested versions for this game
  const { data: predictions, error: predErr } = await supabaseAdmin
    .from('predictions')
    .select(`
      model_version, predicted_home_score, predicted_away_score,
      home_win_probability, away_win_probability, ot_probability,
      home_offensive_potential, away_offensive_potential,
      home_defensive_filter, away_defensive_filter,
      home_energy_bar, away_energy_bar, created_at
    `)
    .eq('game_id', gameId)
    .in('model_version', versions);

  if (predErr) return NextResponse.json({ data: null, error: predErr.message }, { status: 500 });

  // Fetch outcome
  const { data: outcomes } = await supabaseAdmin
    .from('prediction_outcomes')
    .select('actual_home_score, actual_away_score, correct_winner, prediction_id')
    .eq('game_id', gameId)
    .limit(1);

  // Fetch game metadata
  const { data: game } = await supabaseAdmin
    .from('games')
    .select(`
      game_date, home_score, away_score,
      home_team:teams!games_home_team_id_fkey(abbrev),
      away_team:teams!games_away_team_id_fkey(abbrev)
    `)
    .eq('id', gameId)
    .single();

  const outcome = outcomes?.[0] ?? null;

  const comparison = versions.map(v => {
    const pred = predictions?.find(p => p.model_version === v) ?? null;
    if (!pred) return { version: v, prediction: null, correct: null };

    const correct = outcome
      ? (pred.home_win_probability > pred.away_win_probability) ===
        ((outcome.actual_home_score ?? 0) > (outcome.actual_away_score ?? 0))
      : null;

    return { version: v, prediction: pred, correct };
  });

  return NextResponse.json({
    data: { game, comparison, outcome },
    error: null,
  });
}

// ─── POST — run a model version against all stored snapshots ──────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { model_version, description, formula_spec } = body as {
      model_version: string;
      description?: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formula_spec?: Record<string, any>;
    };

    if (!model_version) {
      return NextResponse.json({ data: null, error: 'model_version required' }, { status: 400 });
    }

    if (!MODEL_FORMULAS[model_version]) {
      return NextResponse.json({
        data: null,
        error: `No formula registered for ${model_version}. Add it to MODEL_FORMULAS in /api/backtest/route.ts`,
      }, { status: 400 });
    }

    // Register model version if not exists
    await supabaseAdmin
      .from('model_versions')
      .upsert({
        version: model_version,
        description: description ?? `Backtested ${model_version}`,
        formula_spec: formula_spec ?? null,
        is_active: false,
      }, { onConflict: 'version' });

    // Fetch all game_team_snapshots that have a paired home + away entry
    // and don't yet have a prediction for this model version
    const { data: snapshots, error: snapErr } = await supabaseAdmin
      .from('game_team_snapshots')
      .select('game_id, team_id, is_home, team_energy_bar, sos_multiplier, sh_toi_percentile, skater_snapshots, goalie_snapshot')
      .order('game_id');

    if (snapErr) throw snapErr;

    const alreadyPredicted = new Set<number>(); // upsert handles re-runs

    // Group snapshots by game_id
    const byGame = new Map<number, { home?: typeof snapshots[0]; away?: typeof snapshots[0] }>();
    for (const snap of snapshots ?? []) {
      if (!byGame.has(snap.game_id)) byGame.set(snap.game_id, {});
      const entry = byGame.get(snap.game_id)!;
      if (snap.is_home) entry.home = snap;
      else entry.away = snap;
    }

    const formula = MODEL_FORMULAS[model_version];
    const toInsert = [];
    let skipped = 0;

    for (const [gameId, { home, away }] of byGame) {
      if (!home || !away) continue;
      if (alreadyPredicted.has(gameId)) { skipped++; continue; }

      const homeSnap: TeamSnap = {
        energyBar: home.team_energy_bar ?? 100,
        sosMultiplier: Number(home.sos_multiplier ?? 1.0),
        shToiPercentile: Number(home.sh_toi_percentile ?? 0.5),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        skaters: (home.skater_snapshots as any[]) ?? [],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        goalie: (home.goalie_snapshot as any) ?? { momentumShotsPerGoal: 20 },
      };
      const awaySnap: TeamSnap = {
        energyBar: away.team_energy_bar ?? 100,
        sosMultiplier: Number(away.sos_multiplier ?? 1.0),
        shToiPercentile: Number(away.sh_toi_percentile ?? 0.5),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        skaters: (away.skater_snapshots as any[]) ?? [],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        goalie: (away.goalie_snapshot as any) ?? { momentumShotsPerGoal: 20 },
      };

      const result = formula(homeSnap, awaySnap, formula_spec);

      toInsert.push({
        game_id: gameId,
        model_version,
        predicted_home_score: result.homeXG,
        predicted_away_score: result.awayXG,
        home_win_probability: result.homeWin,
        away_win_probability: result.awayWin,
        ot_probability: result.ot,
        home_energy_bar: homeSnap.energyBar,
        away_energy_bar: awaySnap.energyBar,
        home_sos_multiplier: homeSnap.sosMultiplier,
        away_sos_multiplier: awaySnap.sosMultiplier,
        home_offensive_potential: result.homeOff,
        away_offensive_potential: result.awayOff,
        home_defensive_filter: result.homeDef,
        away_defensive_filter: result.awayDef,
        input_snapshot: { retroactive: true, model_version, home: homeSnap, away: awaySnap },
      });
    }

    if (toInsert.length > 0) {
      const { error: insertErr } = await supabaseAdmin
        .from('predictions')
        .upsert(toInsert, { onConflict: 'game_id,model_version' });
      if (insertErr) throw insertErr;
    }

    // Now score any new predictions against existing outcomes
    const newGameIds = toInsert.map(p => p.game_id);
    let scored = 0;

    if (newGameIds.length > 0) {
      const { data: games } = await supabaseAdmin
        .from('games')
        .select('id, home_score, away_score')
        .in('id', newGameIds)
        .not('home_score', 'is', null);

      const { data: newPreds } = await supabaseAdmin
        .from('predictions')
        .select('id, game_id, predicted_home_score, predicted_away_score, home_win_probability, away_win_probability')
        .eq('model_version', model_version)
        .in('game_id', newGameIds);

      const predById = new Map((newPreds ?? []).map(p => [p.game_id, p]));

      for (const g of games ?? []) {
        const pred = predById.get(g.id);
        if (!pred || g.home_score === null || g.away_score === null) continue;

        const correctWinner =
          (pred.home_win_probability > pred.away_win_probability) ===
          (g.home_score > g.away_score);

        await supabaseAdmin
          .from('prediction_outcomes')
          .upsert({
            prediction_id: pred.id,
            game_id: g.id,
            actual_home_score: g.home_score,
            actual_away_score: g.away_score,
            home_score_error: Math.abs(g.home_score - Number(pred.predicted_home_score)),
            away_score_error: Math.abs(g.away_score - Number(pred.predicted_away_score)),
            correct_winner: correctWinner,
          }, { onConflict: 'game_id,prediction_id' });

        scored++;
      }
    }

    return NextResponse.json({
      data: {
        model_version,
        new_predictions: toInsert.length,
        skipped_existing: skipped,
        outcomes_scored: scored,
      },
      error: null,
    });
  } catch (err) {
    return NextResponse.json(
      { data: null, error: (err as Error).message },
      { status: 500 }
    );
  }
}
