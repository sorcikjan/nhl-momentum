import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { currentSeason, toiToSeconds } from '@/lib/nhl-api';
import { requireIngestAuth } from '@/lib/ingest-auth';

// GET /api/ingest/gamelogs?since=YYYY-MM-DD   ← preferred: only teams that played since date
// GET /api/ingest/gamelogs?limit=50&offset=0  ← full sweep: all active players paginated
//
// The ?since= mode is the correct path for nightly syncs. It filters to only players
// on teams that have played since the given date — typically 100–200 players during
// playoffs vs 500+ for the full sweep. This stays well within the NHL API rate limit.
//
// The full sweep (no since) is for weekly historical refreshes only.
//
// NHL API rate limit: ~90 req burst. We fire (sub_batch_size × 2) requests per batch.
// Sub-batch of 3 with 300ms gaps = 6 parallel requests, ~2 req/s sustained — safe.

export async function GET(req: NextRequest) {
  const authError = requireIngestAuth(req);
  if (authError) return authError;

  const sinceParam = req.nextUrl.searchParams.get('since');
  const limit  = Math.min(200, Math.max(1, Number(req.nextUrl.searchParams.get('limit')  ?? '50')));
  const offset = Math.max(0, Number(req.nextUrl.searchParams.get('offset') ?? '0'));
  const season = currentSeason();

  let players: { id: number; position_code: string; team_id: number | null }[] | null = null;

  if (sinceParam) {
    // Targeted mode: only players on teams that played since `sinceParam`.
    // Find all teams with completed/live games since that date.
    // No game_state filter — any game in the DB for this date range means that team played.
    // State values vary (OFF, FINAL, LIVE, FUT, PRE, CRIT) and change over time;
    // filtering by state here would silently exclude teams whose games have unexpected states.
    const { data: recentGames } = await supabaseAdmin
      .from('games')
      .select('home_team_id, away_team_id')
      .gte('game_date', sinceParam)
      .limit(500);

    const activeTeamIds = new Set<number>();
    for (const g of recentGames ?? []) {
      if (g.home_team_id) activeTeamIds.add(g.home_team_id);
      if (g.away_team_id) activeTeamIds.add(g.away_team_id);
    }

    if (activeTeamIds.size === 0) {
      return NextResponse.json({ data: { skaterRows: 0, goalieRows: 0, playersProcessed: 0, rateLimited: 0, errors: [] }, error: null });
    }

    // Still paginate — each call must complete within Netlify's 26s function limit.
    // The filtered team set keeps total players low (~200 playoffs) but we still chunk.
    const { data, error } = await supabaseAdmin
      .from('players')
      .select('id, position_code, team_id')
      .eq('is_active', true)
      .in('team_id', [...activeTeamIds])
      .order('id')
      .range(offset, offset + limit - 1);

    if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 });
    players = data ?? [];
  } else {
    // Full sweep mode: paginate through all active players.
    const { data, error } = await supabaseAdmin
      .from('players')
      .select('id, position_code, team_id')
      .eq('is_active', true)
      .order('id')
      .range(offset, offset + limit - 1);

    if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 });
    players = data ?? [];
  }

  let skaterRows = 0;
  let goalieRows = 0;
  let rateLimited = 0;
  const errors: string[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results: PromiseSettledResult<{ player: typeof players[0]; logs: any[]; rateLimitHits: number }>[] = [];

  // Sub-batch of 3 with 300ms gaps:
  //   - fires 6 parallel requests per batch (3 players × 2 game types)
  //   - ~2 req/s sustained — well under the NHL API ~90 req/burst limit
  //   - previous value of 5 players / 150ms was firing 10 req per 150ms = ~67 req/s, causing silent failures
  const SUB_BATCH = 3;
  const SUB_DELAY = 300;

  for (let si = 0; si < players.length; si += SUB_BATCH) {
    const sub = players.slice(si, si + SUB_BATCH);
    const subResults = await Promise.allSettled(
      sub.map(async player => {
        const ac = new AbortController();
        const timer = setTimeout(() => ac.abort(), 8000);
        let rateLimitHits = 0;
        try {
          const [regRes, playoffRes] = await Promise.all([
            fetch(`https://api-web.nhle.com/v1/player/${player.id}/game-log/${season}/2`, { cache: 'no-store', signal: ac.signal }),
            fetch(`https://api-web.nhle.com/v1/player/${player.id}/game-log/${season}/3`, { cache: 'no-store', signal: ac.signal }),
          ]);

          // Detect rate limiting: NHL API returns HTML with 200 status when throttled.
          // Check Content-Type — if not JSON, the response is an error page.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const safeJson = async (res: Response): Promise<{ gameLog?: any[] }> => {
            if (!res.ok) { rateLimitHits++; return { gameLog: [] }; }
            const ct = res.headers.get('content-type') ?? '';
            if (!ct.includes('json')) { rateLimitHits++; return { gameLog: [] }; }
            try { return await res.json(); } catch { rateLimitHits++; return { gameLog: [] }; }
          };

          const [regJson, playoffJson] = await Promise.all([safeJson(regRes), safeJson(playoffRes)]);

          const seen = new Set<number>();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const logs = [...(regJson.gameLog ?? []), ...(playoffJson.gameLog ?? [])].filter((g: any) => {
            if (seen.has(g.gameId)) return false;
            seen.add(g.gameId);
            return true;
          });
          return { player, logs, rateLimitHits };
        } finally {
          clearTimeout(timer);
        }
      })
    );
    results.push(...subResults);
    if (si + SUB_BATCH < players.length) {
      await new Promise(r => setTimeout(r, SUB_DELAY));
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const skaterBatch: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const goalieBatch: any[] = [];

  for (const result of results) {
    if (result.status === 'rejected') {
      errors.push(`fetch error: ${result.reason}`);
      continue;
    }
    const { player, logs, rateLimitHits: rh } = result.value;
    rateLimited += rh;

    if (player.position_code === 'G') {
      for (const g of logs) {
        goalieBatch.push({
          game_id:       g.gameId,
          player_id:     player.id,
          team_id:       player.team_id,
          shots_against: g.shotsAgainst ?? 0,
          goals_against: g.goalsAgainst ?? 0,
          save_pct:      g.savePctg ?? 0,
          decision:      g.decision ?? null,
          toi_seconds:   toiToSeconds(g.toi),
        });
      }
    } else {
      for (const g of logs) {
        skaterBatch.push({
          game_id:            g.gameId,
          player_id:          player.id,
          team_id:            player.team_id,
          goals:              g.goals             ?? 0,
          assists:            g.assists            ?? 0,
          plus_minus:         g.plusMinus          ?? 0,
          pim:                g.pim                ?? 0,
          hits:               g.hits               ?? 0,
          blocked_shots:      g.blockedShots       ?? 0,
          shots_on_goal:      g.shots              ?? 0,
          toi_seconds:        toiToSeconds(g.toi),
          pp_goals:           g.powerPlayGoals     ?? 0,
          pp_points:          g.powerPlayPoints    ?? 0,
          pp_toi_seconds:     toiToSeconds(g.powerPlayToi),
          sh_goals:           g.shorthandedGoals   ?? 0,
          sh_points:          g.shorthandedPoints  ?? 0,
          sh_toi_seconds:     toiToSeconds(g.shorthandedToi),
          game_winning_goals: g.gameWinningGoals   ?? 0,
          ot_goals:           g.otGoals            ?? 0,
        });
      }
    }
  }

  const BATCH = 200;
  for (let i = 0; i < skaterBatch.length; i += BATCH) {
    const { error } = await supabaseAdmin
      .from('game_player_stats')
      .upsert(skaterBatch.slice(i, i + BATCH), { onConflict: 'game_id,player_id' });
    if (error) errors.push(`skater upsert batch ${i}: ${error.message}`);
    else skaterRows += Math.min(BATCH, skaterBatch.length - i);
  }
  for (let i = 0; i < goalieBatch.length; i += BATCH) {
    const { error } = await supabaseAdmin
      .from('game_goalie_stats')
      .upsert(goalieBatch.slice(i, i + BATCH), { onConflict: 'game_id,player_id' });
    if (error) errors.push(`goalie upsert batch ${i}: ${error.message}`);
    else goalieRows += Math.min(BATCH, goalieBatch.length - i);
  }

  return NextResponse.json({
    data: { skaterRows, goalieRows, playersProcessed: players.length, rateLimited, errors },
    error: errors.length > 0 ? `${errors.length} errors` : rateLimited > 0 ? `${rateLimited} rate-limited responses` : null,
  });
}
