import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const since = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10);

  const { data: games, error: gErr } = await supabaseAdmin
    .from('games')
    .select('id, game_date, game_state, home_score, away_score, home_team_id, away_team_id')
    .gte('game_date', since)
    .in('game_state', ['FINAL', 'OFF'])
    .order('game_date', { ascending: false })
    .limit(10);

  if (!games?.length) {
    return NextResponse.json({ error: 'no games', gErr });
  }

  const gameIds = games.map(g => g.id);

  const { data: preds, error: pErr } = await supabaseAdmin
    .from('predictions')
    .select('game_id, home_win_probability, predicted_home_score, predicted_away_score, model_version, prediction_outcomes(correct_winner)')
    .in('game_id', gameIds)
    .order('created_at', { ascending: false });

  return NextResponse.json({
    gameCount: games.length,
    gameIds,
    predCount: preds?.length ?? 0,
    predError: pErr,
    games: games.map(g => ({ id: g.id, date: g.game_date, state: g.game_state })),
    preds: (preds ?? []).map(p => ({
      game_id: p.game_id,
      model: p.model_version,
      homeProb: p.home_win_probability,
      xgHome: p.predicted_home_score,
      xgAway: p.predicted_away_score,
      outcomes: p.prediction_outcomes,
    })),
  });
}
