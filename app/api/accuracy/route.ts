import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    // Model accuracy summary per version
    const { data: accuracy, error: accErr } = await supabaseAdmin
      .from('model_versions')
      .select('version, description, created_at, is_active');

    if (accErr) throw accErr;

    // Prediction history with outcomes
    const { data: predictions, error: predErr } = await supabaseAdmin
      .from('predictions')
      .select(`
        id, game_id, model_version, predicted_home_score, predicted_away_score,
        home_win_probability, away_win_probability, ot_probability,
        home_energy_bar, away_energy_bar, created_at,
        prediction_outcomes (
          actual_home_score, actual_away_score,
          home_score_error, away_score_error, correct_winner, recorded_at
        ),
        games (
          game_date,
          home_team:teams!games_home_team_id_fkey ( abbrev ),
          away_team:teams!games_away_team_id_fkey ( abbrev )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (predErr) throw predErr;

    // Compute accuracy stats per model version from outcomes
    const stats: Record<string, {
      total: number; withOutcome: number; correctWinner: number;
      totalHomeErr: number; totalAwayErr: number;
    }> = {};

    for (const p of predictions ?? []) {
      const v = p.model_version;
      if (!stats[v]) stats[v] = { total: 0, withOutcome: 0, correctWinner: 0, totalHomeErr: 0, totalAwayErr: 0 };
      stats[v].total++;
      const outcome = p.prediction_outcomes?.[0];
      if (outcome) {
        stats[v].withOutcome++;
        if (outcome.correct_winner) stats[v].correctWinner++;
        stats[v].totalHomeErr += outcome.home_score_error ?? 0;
        stats[v].totalAwayErr += outcome.away_score_error ?? 0;
      }
    }

    const modelStats = Object.entries(stats).map(([version, s]) => ({
      version,
      totalPredictions: s.total,
      withOutcome: s.withOutcome,
      winnerAccuracyPct: s.withOutcome > 0
        ? Math.round((s.correctWinner / s.withOutcome) * 1000) / 10
        : null,
      avgHomeError: s.withOutcome > 0
        ? Math.round((s.totalHomeErr / s.withOutcome) * 100) / 100
        : null,
      avgAwayError: s.withOutcome > 0
        ? Math.round((s.totalAwayErr / s.withOutcome) * 100) / 100
        : null,
    }));

    return NextResponse.json({
      data: { modelVersions: accuracy, predictions, modelStats },
      error: null,
    });
  } catch (err) {
    return NextResponse.json(
      { data: null, error: (err as Error).message },
      { status: 500 }
    );
  }
}
