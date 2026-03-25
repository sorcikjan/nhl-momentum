import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// ─── Momentum/Season Weight Grid Search ───────────────────────────────────────
// Tests all momentum weight values (0.1 → 0.9, step 0.1) against the full set
// of scored game_team_snapshots. For each weight w:
//
//   effectivePPM = w × momentumPpm + (1 - w) × seasonPpm
//
// All other parameters held constant at v1.6 baseline:
//   GOAL_SCALE = 70, HOME_EDGE = 1.03, REGRESSION = 0.6, last-5 recent form
//
// GET /api/backtest/weight-search
// Returns ranked table: weight → accuracy%, homePickRate%, avgConfidence
// ─────────────────────────────────────────────────────────────────────────────

function energyMultiplierFromBar(energyBar: number): number {
  if (energyBar >= 70) return 1.0;
  return 0.6 + (energyBar / 70) * 0.4;
}

interface RawSkater {
  momentumPpm?: number;
  seasonPpm?: number;
  compositePpm?: number;
  injuryStatus?: string | null;
}

interface RawGoalie {
  momentumShotsPerGoal?: number;
  teamRecentForm?: number;
  energyBar?: number;
}

interface RawSnap {
  game_id: number;
  is_home: boolean;
  team_energy_bar: number | null;
  sos_multiplier: number | null;
  skater_snapshots: RawSkater[] | null;
  goalie_snapshot: RawGoalie | null;
}

function runWithWeight(
  homeSnap: RawSnap,
  awaySnap: RawSnap,
  momentumWeight: number,
): { homeWin: number; awayWin: number } {
  const GOAL_SCALE = 70;
  const MIN_SPG = 12;
  const MAX_SPG = 40;
  const HOME_EDGE = 1.03;
  const AWAY_EDGE = 0.97;
  const REGRESSION = 0.6;
  const seasonWeight = 1 - momentumWeight;

  function effectivePPM(s: RawSkater): number {
    const momentum = s.momentumPpm ?? s.compositePpm ?? 0;
    const season = s.seasonPpm ?? s.compositePpm ?? 0;
    return momentumWeight * momentum + seasonWeight * season;
  }

  function offPotential(snap: RawSnap): number {
    const active = (snap.skater_snapshots ?? []).filter(s => !s.injuryStatus);
    const totalPPM = active.reduce((sum, s) => sum + Math.max(0, effectivePPM(s)), 0);
    const sos = Number(snap.sos_multiplier ?? 1.0);
    const form = snap.goalie_snapshot?.teamRecentForm ?? 1.0;
    const energy = energyMultiplierFromBar(snap.team_energy_bar ?? 100);
    return totalPPM * sos * form * energy;
  }

  function defFilter(snap: RawSnap): number {
    const spg = snap.goalie_snapshot?.momentumShotsPerGoal ?? 22;
    return Math.min(MAX_SPG, Math.max(MIN_SPG, spg));
  }

  const homeOff = offPotential(homeSnap);
  const awayOff = offPotential(awaySnap);
  const homeDef = defFilter(homeSnap);
  const awayDef = defFilter(awaySnap);

  const homeXG = awayDef > 0 ? (homeOff * GOAL_SCALE) / awayDef : 0;
  const awayXG = homeDef > 0 ? (awayOff * GOAL_SCALE) / homeDef : 0;
  const total = homeXG + awayXG;

  if (total === 0) return { homeWin: 0.5, awayWin: 0.5 };

  const homeBase = homeXG / total;
  const awayBase = awayXG / total;
  const homeAdj = Math.min(0.90, homeBase * HOME_EDGE);
  const awayAdj = Math.min(0.90, awayBase * AWAY_EDGE);
  const rawHomeWin = homeAdj / (homeAdj + awayAdj);
  const homeWin = 0.5 + (rawHomeWin - 0.5) * REGRESSION;

  return { homeWin, awayWin: 1 - homeWin };
}

export async function GET() {
  try {
    // Fetch all snapshots
    const { data: snapshots, error: snapErr } = await supabaseAdmin
      .from('game_team_snapshots')
      .select('game_id, is_home, team_energy_bar, sos_multiplier, skater_snapshots, goalie_snapshot')
      .order('game_id');

    if (snapErr) throw snapErr;

    // Fetch all scored games
    const { data: games, error: gamesErr } = await supabaseAdmin
      .from('games')
      .select('id, home_score, away_score')
      .not('home_score', 'is', null)
      .not('away_score', 'is', null);

    if (gamesErr) throw gamesErr;

    const scoredGameIds = new Set((games ?? []).map(g => g.id));
    const gameOutcomes = new Map((games ?? []).map(g => [g.id, g]));

    // Group snapshots by game — only keep games with both home + away + outcome
    const byGame = new Map<number, { home?: RawSnap; away?: RawSnap }>();
    for (const snap of snapshots ?? []) {
      if (!scoredGameIds.has(snap.game_id)) continue;
      if (!byGame.has(snap.game_id)) byGame.set(snap.game_id, {});
      const entry = byGame.get(snap.game_id)!;
      if (snap.is_home) entry.home = snap as RawSnap;
      else entry.away = snap as RawSnap;
    }

    const scoredPairs: Array<{ gameId: number; home: RawSnap; away: RawSnap; homeActuallyWon: boolean }> = [];
    for (const [gameId, { home, away }] of byGame) {
      if (!home || !away) continue;
      const outcome = gameOutcomes.get(gameId)!;
      if (outcome.home_score === null || outcome.away_score === null) continue;
      scoredPairs.push({
        gameId,
        home,
        away,
        homeActuallyWon: outcome.home_score > outcome.away_score,
      });
    }

    const totalGames = scoredPairs.length;

    // Grid search: weights 0.1 → 0.9
    const WEIGHTS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];

    const results = WEIGHTS.map(w => {
      let correct = 0;
      let homePicks = 0;
      let totalConfidence = 0;

      for (const { home, away, homeActuallyWon } of scoredPairs) {
        const { homeWin } = runWithWeight(home, away, w);
        const pickedHome = homeWin > 0.5;
        if (pickedHome === homeActuallyWon) correct++;
        if (pickedHome) homePicks++;
        totalConfidence += Math.max(homeWin, 1 - homeWin);
      }

      return {
        momentumWeight: w,
        seasonWeight: Math.round((1 - w) * 10) / 10,
        accuracyPct: totalGames > 0 ? Math.round((correct / totalGames) * 1000) / 10 : null,
        correctPicks: correct,
        homePickRate: totalGames > 0 ? Math.round((homePicks / totalGames) * 1000) / 10 : null,
        avgConfidencePct: totalGames > 0 ? Math.round((totalConfidence / totalGames) * 1000) / 10 : null,
      };
    });

    // Sort by accuracy descending
    const ranked = [...results].sort((a, b) => (b.accuracyPct ?? 0) - (a.accuracyPct ?? 0));

    return NextResponse.json({
      data: {
        totalGames,
        baseParams: { HOME_EDGE: 1.03, AWAY_EDGE: 0.97, REGRESSION: 0.6, GOAL_SCALE: 70, formWindow: 5 },
        ranked,
        allWeights: results,
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
