import type { LayerMetrics, GoalieLayerMetrics, SkaterMomentumScore } from '@/types';

// ─── Layer Weights ─────────────────────────────────────────────────────────────
// Career weight is 0 because career data is currently identical to season
// (we only have one season in the DB). Setting it to 0 avoids artificially
// double-counting season stats.
// TODO: backfill multi-season career data from NHL API historical game logs,
//       then raise career weight to ~0.10–0.15 to add stability for young players
//       or players coming off injury with a short current-season sample.
const WEIGHTS = { momentum: 0.5, season: 0.5, career: 0 } as const;

// ─── PPM Calculation ──────────────────────────────────────────────────────────

export function calcPPM(points: number, toiSeconds: number): number {
  if (toiSeconds === 0) return 0;
  return points / (toiSeconds / 60);
}

// ─── Layer Metric Builder ─────────────────────────────────────────────────────

export function buildLayerMetrics(games: {
  goals: number;
  assists: number;
  shots_on_goal: number;
  toi_seconds: number;
  hits: number;
  blocked_shots: number;
  plus_minus: number;
  pim?: number;
  pp_goals: number;
  pp_points: number;
  sh_goals: number;
  sh_points: number;
  sh_toi_seconds: number;
  game_winning_goals?: number;
  ot_goals?: number;
}[]): LayerMetrics {
  const g = games.reduce(
    (acc, row) => ({
      goals:      acc.goals      + row.goals,
      assists:    acc.assists    + row.assists,
      shots:      acc.shots      + row.shots_on_goal,
      toi:        acc.toi        + row.toi_seconds,
      hits:       acc.hits       + row.hits,
      blocks:     acc.blocks     + row.blocked_shots,
      plusMinus:  acc.plusMinus  + row.plus_minus,
      pim:        acc.pim        + (row.pim ?? 0),
      ppGoals:    acc.ppGoals    + row.pp_goals,
      ppPoints:   acc.ppPoints   + row.pp_points,
      shGoals:    acc.shGoals    + row.sh_goals,
      shPoints:   acc.shPoints   + row.sh_points,
      shToi:      acc.shToi      + row.sh_toi_seconds,
      gwGoals:    acc.gwGoals    + (row.game_winning_goals ?? 0),
      otGoals:    acc.otGoals    + (row.ot_goals ?? 0),
    }),
    { goals: 0, assists: 0, shots: 0, toi: 0, hits: 0, blocks: 0,
      plusMinus: 0, pim: 0, ppGoals: 0, ppPoints: 0, shGoals: 0, shPoints: 0,
      shToi: 0, gwGoals: 0, otGoals: 0 }
  );

  const points = g.goals + g.assists;
  const ppm    = calcPPM(points, g.toi);
  const sPct   = g.shots > 0 ? g.goals / g.shots : 0;

  return {
    gamesPlayed:           games.length,
    goals:                 g.goals,
    assists:               g.assists,
    points,
    toiSeconds:            g.toi,
    ppm,
    shotsOnGoal:           g.shots,
    shootingPct:           sPct,
    hits:                  g.hits,
    blockedShots:          g.blocks,
    plusMinus:             g.plusMinus,
    pim:                   g.pim,
    powerPlayGoals:        g.ppGoals,
    powerPlayPoints:       g.ppPoints,
    shorthandedGoals:      g.shGoals,
    shorthandedPoints:     g.shPoints,
    gameWinningGoals:      g.gwGoals,
    otGoals:               g.otGoals,
    shorthandedToiSeconds: g.shToi,
  };
}

// ─── Composite Weighted Layer ─────────────────────────────────────────────────

export function compositeLayer(
  momentum: LayerMetrics,
  season: LayerMetrics,
  career: LayerMetrics,
): LayerMetrics {
  const w = WEIGHTS;
  const blend = (a: number, b: number, c: number) =>
    a * w.momentum + b * w.season + c * w.career;

  return {
    gamesPlayed:           momentum.gamesPlayed,
    goals:                 blend(momentum.goals,               season.goals,               career.goals),
    assists:               blend(momentum.assists,             season.assists,             career.assists),
    points:                blend(momentum.points,              season.points,              career.points),
    toiSeconds:            blend(momentum.toiSeconds,          season.toiSeconds,          career.toiSeconds),
    ppm:                   blend(momentum.ppm,                 season.ppm,                 career.ppm),
    shotsOnGoal:           blend(momentum.shotsOnGoal,         season.shotsOnGoal,         career.shotsOnGoal),
    shootingPct:           blend(momentum.shootingPct,         season.shootingPct,         career.shootingPct),
    hits:                  blend(momentum.hits,                season.hits,                career.hits),
    blockedShots:          blend(momentum.blockedShots,        season.blockedShots,        career.blockedShots),
    plusMinus:             blend(momentum.plusMinus,           season.plusMinus,           career.plusMinus),
    pim:                   blend(momentum.pim,                 season.pim,                 career.pim),
    powerPlayGoals:        blend(momentum.powerPlayGoals,      season.powerPlayGoals,      career.powerPlayGoals),
    powerPlayPoints:       blend(momentum.powerPlayPoints,     season.powerPlayPoints,     career.powerPlayPoints),
    shorthandedGoals:      blend(momentum.shorthandedGoals,    season.shorthandedGoals,    career.shorthandedGoals),
    shorthandedPoints:     blend(momentum.shorthandedPoints,   season.shorthandedPoints,   career.shorthandedPoints),
    gameWinningGoals:      blend(momentum.gameWinningGoals,    season.gameWinningGoals,    career.gameWinningGoals),
    otGoals:               blend(momentum.otGoals,             season.otGoals,             career.otGoals),
    shorthandedToiSeconds: blend(momentum.shorthandedToiSeconds, season.shorthandedToiSeconds, career.shorthandedToiSeconds),
  };
}

// ─── Momentum Rank Score ──────────────────────────────────────────────────────
// Score = (Momentum PPM * 0.4) + (S% * 0.2) + (SOS Coefficient * 0.4)

export function calcMomentumRankScore(
  momentumPPM: number,
  shootingPct: number,
  sosCoefficient: number,
): number {
  return momentumPPM * 0.4 + shootingPct * 0.2 + sosCoefficient * 0.4;
}

// ─── Breakout Delta ───────────────────────────────────────────────────────────

export function calcBreakoutDelta(momentumPPM: number, seasonPPM: number): number {
  return momentumPPM - seasonPPM;
}

// ─── Goalie Layer Metrics ─────────────────────────────────────────────────────

export function buildGoalieLayerMetrics(games: {
  shots_against: number;
  goals_against: number;
  decision: string | null;
  toi_seconds: number;
}[]): GoalieLayerMetrics {
  const totals = games.reduce(
    (acc, row) => ({
      shots:  acc.shots + row.shots_against,
      goals:  acc.goals + row.goals_against,
      wins:   acc.wins + (row.decision === 'W' ? 1 : 0),
      toi:    acc.toi + row.toi_seconds,
    }),
    { shots: 0, goals: 0, wins: 0, toi: 0 }
  );

  return {
    gamesPlayed:    games.length,
    shotsAgainst:   totals.shots,
    goalsAgainst:   totals.goals,
    savePct:        totals.shots > 0 ? (totals.shots - totals.goals) / totals.shots : 0,
    shotsPerGoal:   totals.goals > 0 ? totals.shots / totals.goals : totals.shots,
    wins:           totals.wins,
    toiSeconds:     totals.toi,
  };
}

export function compositeGoalieLayer(
  momentum: GoalieLayerMetrics,
  season: GoalieLayerMetrics,
  career: GoalieLayerMetrics,
): GoalieLayerMetrics {
  const w = WEIGHTS;
  const blend = (a: number, b: number, c: number) =>
    a * w.momentum + b * w.season + c * w.career;

  return {
    gamesPlayed:  momentum.gamesPlayed,
    shotsAgainst: blend(momentum.shotsAgainst, season.shotsAgainst, career.shotsAgainst),
    goalsAgainst: blend(momentum.goalsAgainst, season.goalsAgainst, career.goalsAgainst),
    savePct:      blend(momentum.savePct,      season.savePct,      career.savePct),
    shotsPerGoal: blend(momentum.shotsPerGoal, season.shotsPerGoal, career.shotsPerGoal),
    wins:         blend(momentum.wins,         season.wins,         career.wins),
    toiSeconds:   blend(momentum.toiSeconds,   season.toiSeconds,   career.toiSeconds),
  };
}

// ─── Ranking Sort ─────────────────────────────────────────────────────────────

export function rankSkaters(players: SkaterMomentumScore[]): SkaterMomentumScore[] {
  return players
    .sort((a, b) =>
      calcMomentumRankScore(b.momentum.ppm, b.momentum.shootingPct, b.sosCoefficient) -
      calcMomentumRankScore(a.momentum.ppm, a.momentum.shootingPct, a.sosCoefficient)
    )
    .map((p, i) => ({ ...p, momentumRank: i + 1 }));
}
