import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireIngestAuth } from '@/lib/ingest-auth';

// GET /api/ingest/outcomes-backfill
//
// Scores prediction_outcomes for every completed game that has predictions
// but is missing outcome records. Safe to re-run — uses upsert.
//
// Works for the entire season — fetches all completed games from the games table,
// then bulk-upserts outcomes for any predictions that don't have them yet.

export async function GET(req: NextRequest) {
  const authError = requireIngestAuth(req);
  if (authError) return authError;

  const log: string[] = [];
  let outcomesUpserted = 0;
  let gamesProcessed = 0;

  // Fetch all completed games with final scores (whole season)
  const { data: completedGames, error: gErr } = await supabaseAdmin
    .from('games')
    .select('id, home_score, away_score')
    .in('game_state', ['FINAL', 'OFF'])
    .not('home_score', 'is', null)
    .not('away_score', 'is', null)
    .order('id', { ascending: false });

  if (gErr) return NextResponse.json({ data: null, error: gErr.message }, { status: 500 });

  log.push(`Found ${completedGames?.length ?? 0} completed games`);

  // Process in batches of 50 games to avoid timeouts
  const games = completedGames ?? [];
  const BATCH = 50;

  for (let i = 0; i < games.length; i += BATCH) {
    const batch = games.slice(i, i + BATCH);
    const batchGameIds = batch.map(g => g.id);
    const scoreByGame = new Map(batch.map(g => [g.id, { home: g.home_score!, away: g.away_score! }]));

    // Fetch all predictions for this batch of games
    const { data: preds } = await supabaseAdmin
      .from('predictions')
      .select('id, game_id, predicted_home_score, predicted_away_score, home_win_probability, away_win_probability')
      .in('game_id', batchGameIds);

    if (!preds?.length) continue;

    // Upsert outcomes for all predictions (existing ones are a no-op due to onConflict)
    const outcomeRows = preds.map(pred => {
      const scores = scoreByGame.get(pred.game_id)!;
      const correctWinner =
        (pred.home_win_probability > pred.away_win_probability) ===
        (scores.home > scores.away);
      return {
        prediction_id: pred.id,
        game_id: pred.game_id,
        actual_home_score: scores.home,
        actual_away_score: scores.away,
        home_score_error: Math.abs(scores.home - Number(pred.predicted_home_score)),
        away_score_error: Math.abs(scores.away - Number(pred.predicted_away_score)),
        correct_winner: correctWinner,
      };
    });

    const { error } = await supabaseAdmin
      .from('prediction_outcomes')
      .upsert(outcomeRows, { onConflict: 'game_id,prediction_id' });

    if (error) {
      log.push(`Batch ${i}–${i + BATCH}: error — ${error.message}`);
    } else {
      outcomesUpserted += outcomeRows.length;
      gamesProcessed += batch.length;
    }
  }

  log.push(`Upserted ${outcomesUpserted} outcome records across ${gamesProcessed} games`);

  return NextResponse.json({
    data: { games_processed: gamesProcessed, outcomes_upserted: outcomesUpserted, log },
    error: null,
  });
}
