import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { currentSeason, toiToSeconds } from '@/lib/nhl-api';
import { requireIngestAuth } from '@/lib/ingest-auth';

// GET /api/ingest/gamelogs?limit=30&offset=0
// Pulls game logs for active players and upserts into game_player_stats / game_goalie_stats
// Use offset to paginate: run with offset=0, 30, 60, ... until exhausted

export async function GET(req: NextRequest) {
  const authError = requireIngestAuth(req);
  if (authError) return authError;

  const limit  = Math.min(200, Math.max(1, Number(req.nextUrl.searchParams.get('limit')  ?? '30')));
  const offset = Math.max(0, Number(req.nextUrl.searchParams.get('offset') ?? '0'));
  const season = currentSeason();

  // Fetch active players from DB with pagination
  const { data: players, error: playerErr } = await supabaseAdmin
    .from('players')
    .select('id, position_code, team_id')
    .eq('is_active', true)
    .order('id')
    .range(offset, offset + limit - 1);

  if (playerErr) {
    return NextResponse.json({ data: null, error: playerErr.message }, { status: 500 });
  }

  let skaterRows = 0;
  let goalieRows = 0;
  const errors: string[] = [];

  // Fetch regular season (type 2) AND playoff (type 3) game logs.
  // Before playoffs: type 3 returns empty — no overhead. After playoffs start: both populated.
  // Deduplication by gameId ensures no double-counting if a game ID ever appears in both.
  //
  // NHL API rate-limits aggressively (~90 req burst cap). Fetching all players simultaneously
  // causes silent HTML responses for mid-run players. Use micro-batches of 5 with 150ms gaps
  // to stay under the limit while still completing a 30-player page in ~1s.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results: PromiseSettledResult<{ player: NonNullable<typeof players>[0]; logs: any[] }>[] = [];
  const SUB_BATCH = 5;
  for (let si = 0; si < (players ?? []).length; si += SUB_BATCH) {
    const sub = (players ?? []).slice(si, si + SUB_BATCH);
    const subResults = await Promise.allSettled(
      sub.map(async player => {
        const ac = new AbortController();
        const timer = setTimeout(() => ac.abort(), 8000); // 8s per player
        try {
          const [regRes, playoffRes] = await Promise.all([
            fetch(`https://api-web.nhle.com/v1/player/${player.id}/game-log/${season}/2`, { cache: 'no-store', signal: ac.signal }),
            fetch(`https://api-web.nhle.com/v1/player/${player.id}/game-log/${season}/3`, { cache: 'no-store', signal: ac.signal }),
          ]);
          // Safe JSON parse — NHL API may return HTML on rate-limit even with 200 status
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const safeJson = async (res: Response): Promise<{ gameLog?: any[] }> => {
            if (!res.ok) return { gameLog: [] };
            try { return await res.json(); } catch { return { gameLog: [] }; }
          };
          const [regJson, playoffJson] = await Promise.all([safeJson(regRes), safeJson(playoffRes)]);

          // Merge regular season + playoff logs, dedup by gameId
          const seen = new Set<number>();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const logs = [...(regJson.gameLog ?? []), ...(playoffJson.gameLog ?? [])].filter((g: any) => {
            if (seen.has(g.gameId)) return false;
            seen.add(g.gameId);
            return true;
          });
          return { player, logs };
        } finally {
          clearTimeout(timer);
        }
      })
    );
    results.push(...subResults);
    // 150ms pause between sub-batches to stay under NHL API rate limit
    if (si + SUB_BATCH < (players ?? []).length) {
      await new Promise(r => setTimeout(r, 150));
    }
  }

  // Build DB rows from fetched logs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const skaterBatch: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const goalieBatch: any[] = [];

  for (const result of results) {
    if (result.status === 'rejected') {
      errors.push(`fetch error: ${result.reason}`);
      continue;
    }
    const { player, logs } = result.value;

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

  // Upsert in batches of 200 to stay within PostgREST limits
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
    data: { skaterRows, goalieRows, playersProcessed: (players ?? []).length, errors },
    error: errors.length > 0 ? `${errors.length} errors` : null,
  });
}
