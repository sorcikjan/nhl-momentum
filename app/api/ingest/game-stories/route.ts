import { NextRequest, NextResponse } from 'next/server';
import { requireIngestAuth } from '@/lib/ingest-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { fetchRecapData } from '@/lib/data';
import { generateGameStory, lastAiError, type RecapGame, type RecapPerformer } from '@/lib/ai';
import { fetchScoreFeed } from '@/lib/score-feed';

export const maxDuration = 300;

// GET /api/ingest/game-stories?date=YYYY-MM-DD[&limit=1]
// One story per finished game of the date (default: yesterday), each with its
// own fact check, so one bad draft costs one game, not the night. Writes at
// most `limit` stories per call (each takes 10–40s) and reports how many games
// still need one; the daily worker calls it until none remain. Games that
// already have a story are skipped (delete a row to rewrite it). Runs after
// the night recap, so the recap gets the Gemini quota first.
export async function GET(req: NextRequest) {
  const authError = requireIngestAuth(req);
  if (authError) return authError;
  if (!process.env.GEMINI_API_KEY) return NextResponse.json({ data: null, error: 'GEMINI_API_KEY not configured' }, { status: 500 });

  const date = req.nextUrl.searchParams.get('date')
    ?? new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const limit = Math.min(15, Math.max(1, Number(req.nextUrl.searchParams.get('limit')) || 1));

  const { data: existing, error: exErr } = await supabaseAdmin.from('game_stories').select('game_id').eq('game_date', date);
  if (exErr) {
    return NextResponse.json({ data: null, error: `game_stories unavailable (run migration 017): ${exErr.message}` }, { status: 500 });
  }
  const done = new Set((existing ?? []).map(r => r.game_id as number));

  const raw = await fetchRecapData(date);
  if (!raw?.games.length) return NextResponse.json({ data: { date, skipped: true, reason: 'no finished games' }, error: null });
  const scoring = await fetchScoreFeed(date);
  const dateLabel = new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

  const results: { game: string; status: string }[] = [];
  // Without the official scoring there's nothing to check a story against.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const todo = (raw.games as any[]).filter(g => !done.has(g.id) && scoring.has(g.id));
  for (const g of todo.slice(0, limit)) {
    const label = `${g.away_team?.abbrev} @ ${g.home_team?.abbrev}`;
    const feed = scoring.get(g.id)!;

    const pred = raw.predMap.get(g.id);
    const outcome = pred?.prediction_outcomes?.[0]?.correct_winner;
    const game: RecapGame = {
      awayTeam: g.away_team?.abbrev ?? '?', homeTeam: g.home_team?.abbrev ?? '?',
      awayName: g.away_team?.name ?? undefined, homeName: g.home_team?.name ?? undefined,
      awayScore: g.away_score ?? 0, homeScore: g.home_score ?? 0,
      finish: feed.finish, goals: feed.goals, tallies: feed.tallies,
      predictedCorrectly: outcome == null ? null : outcome === true,
      homeWinProbability: pred?.home_win_probability ?? null,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stars = ((g.three_stars ?? []) as any[]).map(s =>
      `  ${s.star}. ${s.name?.default ?? ''} (${s.teamAbbrev})${s.position === 'G' ? `: goalie${s.savePctg != null ? `, ${(s.savePctg * 100).toFixed(1)}% saves` : ''}` : `: ${s.goals ?? 0}G ${s.assists ?? 0}A`}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const performers: RecapPerformer[] = (raw.gamePerformers.get(g.id) ?? []).map((p: any) => ({
      name: `${p.players.first_name} ${p.players.last_name}`, team: p.teams?.abbrev ?? '?', position: p.players.position_code,
      goals: p.goals ?? 0, assists: p.assists ?? 0, plusMinus: p.plus_minus ?? 0, toiMin: (p.toi_seconds ?? 0) / 60,
      momentumPpm: null, seasonPpm: null, momentumRank: null,
    }));

    const story = await generateGameStory({ dateLabel, game, stars, performers });
    if (!story) { results.push({ game: label, status: `failed: ${lastAiError ?? 'no output'}` }); continue; }
    const { error } = await supabaseAdmin.from('game_stories').upsert({
      game_id: g.id, game_date: date, headline: story.headline, dek: story.dek, body: story.body,
      generated_at: new Date().toISOString(),
    }, { onConflict: 'game_id' });
    results.push({ game: label, status: error ? `save failed: ${error.message}` : story.headline });
  }
  const written = results.filter(r => !/^(failed|save failed)/.test(r.status)).length;
  const failed = results.length - written;
  // Failed games stay in `remaining`; the caller stops when a batch writes nothing.
  return NextResponse.json({ data: { date, written, failed, remaining: todo.length - written, results }, error: null });
}
