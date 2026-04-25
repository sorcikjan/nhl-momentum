import { NextRequest, NextResponse } from 'next/server';
import { requireIngestAuth } from '@/lib/ingest-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { fetchRecapData, fetchRecentSoftSignals } from '@/lib/data';
import { generateDailyRecap } from '@/lib/ai';
import type { RecapGame, RecapPerformer, RecapShutout } from '@/lib/ai';

// Fetch a free hockey photo from Pixabay (Pixabay License — no attribution required).
// Uses a date-seeded page offset so each recap gets a different image.
async function fetchPixabayHockeyImage(date: string, query: string): Promise<string | null> {
  const apiKey = process.env.PIXABAY_API_KEY;
  if (!apiKey) return null;

  // Seed page from date so different recaps get different images (1–50)
  const seed = (parseInt(date.replace(/-/g, ''), 10) % 50) + 1;

  const tryQuery = async (q: string) => {
    const url = new URL('https://pixabay.com/api/');
    url.searchParams.set('key', apiKey);
    url.searchParams.set('q', q);
    url.searchParams.set('image_type', 'photo');
    url.searchParams.set('orientation', 'horizontal');
    url.searchParams.set('min_width', '1200');
    url.searchParams.set('safesearch', 'true');
    url.searchParams.set('per_page', '5');
    url.searchParams.set('page', String(seed));

    const res = await fetch(url.toString(), { next: { revalidate: 0 } });
    if (!res.ok) return null;
    const json = await res.json() as { hits?: { largeImageURL?: string }[] };
    return json.hits?.[0]?.largeImageURL ?? null;
  };

  try {
    // Try AI-suggested query first, fall back to generic if no results
    return (await tryQuery(query)) ?? (await tryQuery('ice hockey arena'));
  } catch {
    return null;
  }
}

// Pick the best hero image for a recap:
//   1. YouTube thumbnail from the featured game (the one mentioned in the headline)
//   2. YouTube thumbnail from the highest-scoring game as fallback
//   3. Pixabay hockey photo as last resort (when highlights aren't published yet)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function pickHeroImage(date: string, games?: any[], featuredGame?: string | null): Promise<string | null> {
  // Helper to build YouTube thumbnail URL
  const ytUrl = (id: string) => `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;

  if (games?.length) {
    // 1. Try the featured game first (headline match)
    if (featuredGame) {
      // featuredGame is like "MTL @ TOR" — parse away and home abbrevs
      const parts = featuredGame.replace(/\s/g, '').split('@');
      if (parts.length === 2) {
        const [awayAbbrev, homeAbbrev] = parts;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const featured = games.find((g: any) =>
          g.away_team?.abbrev === awayAbbrev && g.home_team?.abbrev === homeAbbrev
        );
        if (featured?.youtube_highlight_id) {
          return ytUrl(featured.youtube_highlight_id);
        }
      }
    }

    // 2. Fallback: highest-scoring game with a highlight
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const withVideo = [...games]
      .filter((g: any) => g.youtube_highlight_id)
      .sort((a: any, b: any) =>
        ((b.home_score ?? 0) + (b.away_score ?? 0)) - ((a.home_score ?? 0) + (a.away_score ?? 0))
      );
    if (withVideo.length > 0) {
      return ytUrl(withVideo[0].youtube_highlight_id);
    }
  }

  // Fallback: fetch games for this date if not provided, try YouTube thumbnails
  if (!games) {
    const { data } = await supabaseAdmin
      .from('games')
      .select('youtube_highlight_id, home_score, away_score')
      .eq('game_date', date)
      .in('game_state', ['FINAL', 'OFF'])
      .not('youtube_highlight_id', 'is', null);
    if (data?.length) {
      const best = data.sort((a, b) =>
        ((b.home_score ?? 0) + (b.away_score ?? 0)) - ((a.home_score ?? 0) + (a.away_score ?? 0))
      )[0];
      if (best.youtube_highlight_id) {
        return ytUrl(best.youtube_highlight_id);
      }
    }
  }

  return fetchPixabayHockeyImage(date, 'ice hockey');
}

// POST /api/ingest/recap?date=YYYY-MM-DD
// Generates and stores a daily recap article for the given date (default: yesterday).
// Skips if a fresh recap already exists (< 12h old) unless ?force=1.

export async function GET(req: NextRequest) {
  const authError = requireIngestAuth(req);
  if (authError) return authError;

  const dateParam  = req.nextUrl.searchParams.get('date');
  const force      = req.nextUrl.searchParams.get('force') === '1';
  const imageOnly  = req.nextUrl.searchParams.get('image_only') === '1';

  const date = dateParam ?? (() => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
  })();

  // image_only: just refresh the hero photo for an existing recap, no AI re-run
  if (imageOnly) {
    const heroImageUrl = await pickHeroImage(date);
    if (!heroImageUrl) {
      return NextResponse.json({ data: { skipped: true, date, reason: 'no image found' }, error: null });
    }
    const { error: imgErr } = await supabaseAdmin
      .from('daily_recaps')
      .update({ hero_image_url: heroImageUrl })
      .eq('date', date);
    if (imgErr) return NextResponse.json({ data: null, error: imgErr.message }, { status: 500 });
    return NextResponse.json({ data: { date, hero_image_url: heroImageUrl }, error: null });
  }

  // Skip if fresh recap already exists
  if (!force) {
    const { data: existing } = await supabaseAdmin
      .from('daily_recaps')
      .select('date, generated_at')
      .eq('date', date)
      .single();

    if (existing?.generated_at) {
      const ageH = (Date.now() - new Date(existing.generated_at).getTime()) / 3_600_000;
      if (ageH < 12) {
        return NextResponse.json({ data: { skipped: true, date, reason: 'fresh recap exists' }, error: null });
      }
    }
  }

  // Fetch all game data for that date
  const raw = await fetchRecapData(date);
  if (!raw || !raw.games.length) {
    return NextResponse.json({ data: { skipped: true, date, reason: 'no games found' }, error: null });
  }

  // Build AI input
  const dateLabel = new Date(date + 'T12:00:00Z').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const games: RecapGame[] = (raw.games as any[]).map(g => {
    const pred = raw.predMap.get(g.id);
    let predictedCorrectly: boolean | null = null;
    if (pred) {
      const homeWon = (g.home_score ?? 0) > (g.away_score ?? 0);
      const predHomeWin = (pred.home_win_probability ?? 0.5) >= 0.5;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const outcome = (pred.prediction_outcomes as any[])?.[0];
      predictedCorrectly = outcome?.correct_winner != null
        ? outcome.correct_winner === true
        : predHomeWin === homeWon;
    }
    return {
      awayTeam: g.away_team?.abbrev ?? '?',
      homeTeam: g.home_team?.abbrev ?? '?',
      awayScore: g.away_score ?? 0,
      homeScore: g.home_score ?? 0,
      predictedCorrectly,
      homeWinProbability: pred?.home_win_probability ?? null,
      seriesContext: raw.seriesMap?.get(g.id),
    };
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const topPerformers: RecapPerformer[] = (raw.topPerformers as any[]).map(p => ({
    name:           `${p.players.first_name} ${p.players.last_name}`,
    team:           p.teams?.abbrev ?? '?',
    position:       p.players.position_code,
    goals:          p.goals ?? 0,
    assists:        p.assists ?? 0,
    plusMinus:      p.plus_minus ?? 0,
    toiMin:         (p.toi_seconds ?? 0) / 60,
    momentumPpm:    p.snapshot?.momentum_ppm ?? null,
    seasonPpm:      p.snapshot?.season_ppm ?? null,
    momentumRank:   p.snapshot?.momentum_rank ?? null,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shutouts: RecapShutout[] = (raw.shutouts as any[]).map(s => ({
    name:  `${s.players?.first_name} ${s.players?.last_name}`,
    team:  s.teams?.abbrev ?? '?',
    saves: (s.saves ?? 0) - (s.goals_against ?? 0),
  }));

  // Pull recent news signals to enrich the recap narrative
  const signals = await fetchRecentSoftSignals(48, 10).catch(() => []);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const newsContext = (signals as any[]).length
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? (signals as any[]).map((s: any) => `- ${s.title}${s.content ? ': ' + s.content.slice(0, 120) : ''} (${s.source})`).join('\n')
    : null;

  const hasGeminiKey = !!process.env.GEMINI_API_KEY;
  if (!hasGeminiKey) {
    return NextResponse.json({ data: null, error: 'GEMINI_API_KEY not configured' }, { status: 500 });
  }

  const result = await generateDailyRecap({ date, dateLabel, games, topPerformers, shutouts, newsContext });

  if (!result) {
    return NextResponse.json({ data: null, error: 'AI generation failed — check Netlify function logs for [ai] ask error' }, { status: 500 });
  }

  const heroImageUrl: string | null = await pickHeroImage(date, raw.games, result.featured_game);

  const { error: upsertErr } = await supabaseAdmin
    .from('daily_recaps')
    .upsert({
      date,
      title:          result.title,
      summary:        result.summary,
      content:        result.content,
      games_count:    games.length,
      hero_image_url: heroImageUrl,
      generated_at:   new Date().toISOString(),
    }, { onConflict: 'date' });

  if (upsertErr) {
    return NextResponse.json({ data: null, error: upsertErr.message }, { status: 500 });
  }

  return NextResponse.json({
    data: { date, title: result.title, gamesCount: games.length },
    error: null,
  });
}
