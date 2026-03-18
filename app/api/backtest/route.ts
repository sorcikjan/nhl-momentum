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

// ─── Model v1.0 formula (reproduced here so it can be applied to snapshots) ──

function energyMultiplierFromBar(energyBar: number): number {
  if (energyBar >= 70) return 1.0;
  // Linear penalty: 0 energy = 0.6, 70 = 1.0
  return 0.6 + (energyBar / 70) * 0.4;
}

interface SkaterSnap {
  compositePpm: number;
  injuryStatus: string | null;
}

interface GoalieSnap {
  momentumShotsPerGoal: number;
}

interface TeamSnap {
  energyBar: number;
  sosMultiplier: number;
  shToiPercentile: number;
  skaters: SkaterSnap[];
  goalie: GoalieSnap;
}

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

// Registry of available model formulas.
// When you create v1.1 with a modified formula, add it here.
// The formula_spec from model_versions can override default params.
const MODEL_FORMULAS: Record<string, (
  homeSnap: TeamSnap,
  awaySnap: TeamSnap,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formulaSpec?: Record<string, any>
) => ReturnType<typeof runModelV1>> = {
  'v1.0': (h, a) => runModelV1(h, a),
  // v1.1 will be registered here when built, using the same raw snapshots
  // e.g. 'v1.1': (h, a, spec) => runModelV1WithSosAdjustment(h, a, spec),
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

    // Find games that already have this model version predicted
    const { data: existingPreds } = await supabaseAdmin
      .from('predictions')
      .select('game_id')
      .eq('model_version', model_version);

    const alreadyPredicted = new Set((existingPreds ?? []).map(p => p.game_id));

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
        input_snapshot: { retroactive: true, model_version, home: homeSnap, away: awaySnap },
      });
    }

    if (toInsert.length > 0) {
      const { error: insertErr } = await supabaseAdmin
        .from('predictions')
        .insert(toInsert);
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
