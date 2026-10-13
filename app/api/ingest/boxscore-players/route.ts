import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireIngestAuth } from '@/lib/ingest-auth';

// Box-score reconciliation for completed games — one NHL request per game:
//   1. adds any player who appears in a box score but is missing from `players`
//   2. returns `needStats`: players who appeared but have no stat row for that game
//      in game_player_stats / game_goalie_stats. Workers pass these to
//      /api/ingest/gamelogs?playerIds=… instead of re-fetching every player's log.
//
// (1) exists because the roster sync only sees who is on a roster at sync time, so a
// call-up who plays and is sent down in between would otherwise never get stats
// (gamelogs only fetches players we already know about).
//
// ?ids=2026020088,2026020089  — specific games (post-game worker)
// ?since=YYYY-MM-DD           — all FINAL/OFF games since date (daily worker)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BoxPlayer = any;

export async function GET(req: NextRequest) {
  const authError = requireIngestAuth(req);
  if (authError) return authError;

  const idsParam = req.nextUrl.searchParams.get('ids');
  const since = req.nextUrl.searchParams.get('since');

  let gameIds: number[] = [];
  if (idsParam) {
    gameIds = idsParam.split(',').map(Number).filter(Boolean);
  } else if (since) {
    const { data, error } = await supabaseAdmin
      .from('games')
      .select('id')
      .in('game_state', ['FINAL', 'OFF'])
      .gte('game_date', since)
      .limit(200);
    if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 });
    gameIds = (data ?? []).map(g => g.id);
  } else {
    return NextResponse.json({ data: null, error: 'ids or since required' }, { status: 400 });
  }

  // player id → team id, from box scores; plus every (game, player) appearance
  const seen = new Map<number, number>();
  const appearances: { gid: number; pid: number; goalie: boolean }[] = [];
  const errors: string[] = [];
  await Promise.all(gameIds.map(async gid => {
    try {
      const res = await fetch(`https://api-web.nhle.com/v1/gamecenter/${gid}/boxscore`, {
        cache: 'no-store', signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) { errors.push(`${gid}: HTTP ${res.status}`); return; }
      const box = await res.json();
      for (const side of ['homeTeam', 'awayTeam'] as const) {
        const teamId: number | undefined = box[side]?.id;
        const stats = box.playerByGameStats?.[side] ?? {};
        for (const p of [...(stats.forwards ?? []), ...(stats.defense ?? [])] as BoxPlayer[]) {
          if (!p?.playerId || !teamId) continue;
          seen.set(p.playerId, teamId);
          appearances.push({ gid, pid: p.playerId, goalie: false });
        }
        for (const p of (stats.goalies ?? []) as BoxPlayer[]) {
          if (!p?.playerId || !teamId) continue;
          seen.set(p.playerId, teamId);
          // Dressed backup goalies are listed with 00:00 TOI and get no game-log row
          if (p.toi && p.toi !== '00:00') appearances.push({ gid, pid: p.playerId, goalie: true });
        }
      }
    } catch (err) {
      errors.push(`${gid}: ${(err as Error).message}`);
    }
  }));

  if (seen.size === 0) {
    return NextResponse.json({ data: { games: gameIds.length, checked: 0, added: [], needStats: [], errors }, error: null });
  }

  const { data: known, error: kErr } = await supabaseAdmin
    .from('players')
    .select('id')
    .in('id', [...seen.keys()]);
  if (kErr) return NextResponse.json({ data: null, error: kErr.message }, { status: 500 });
  const knownIds = new Set((known ?? []).map(p => p.id));
  const unknown = [...seen.keys()].filter(id => !knownIds.has(id));

  // Box scores only carry abbreviated names ("H. Stanley") — use the landing page.
  const added: string[] = [];
  for (const id of unknown) {
    try {
      const res = await fetch(`https://api-web.nhle.com/v1/player/${id}/landing`, {
        cache: 'no-store', signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) { errors.push(`player ${id}: HTTP ${res.status}`); continue; }
      const p = await res.json();
      const { error } = await supabaseAdmin.from('players').upsert({
        id,
        first_name:     p.firstName?.default ?? '',
        last_name:      p.lastName?.default ?? '',
        position_code:  p.position ?? null,
        sweater_number: p.sweaterNumber ?? null,
        team_id:        seen.get(id),
        headshot_url:   p.headshot ?? null,
        is_active:      true,
        updated_at:     new Date().toISOString(),
      }, { onConflict: 'id' });
      if (error) errors.push(`player ${id}: ${error.message}`);
      else added.push(`${id} ${p.firstName?.default ?? ''} ${p.lastName?.default ?? ''}`.trim());
    } catch (err) {
      errors.push(`player ${id}: ${(err as Error).message}`);
    }
  }

  // Which appearances already have stat rows? Chunk by game to stay under the
  // 1000-row response cap (~40 rows per game).
  const have = new Set<string>();
  const boxGameIds = [...new Set(appearances.map(a => a.gid))];
  for (let i = 0; i < boxGameIds.length; i += 20) {
    const chunk = boxGameIds.slice(i, i + 20);
    const [sk, gk] = await Promise.all([
      supabaseAdmin.from('game_player_stats').select('game_id, player_id').in('game_id', chunk).limit(1000),
      supabaseAdmin.from('game_goalie_stats').select('game_id, player_id').in('game_id', chunk).limit(1000),
    ]);
    if (sk.error || gk.error) {
      return NextResponse.json({ data: null, error: (sk.error ?? gk.error)!.message }, { status: 500 });
    }
    for (const r of sk.data ?? []) have.add(`s:${r.game_id}:${r.player_id}`);
    for (const r of gk.data ?? []) have.add(`g:${r.game_id}:${r.player_id}`);
  }
  const missing = appearances.filter(a => !have.has(`${a.goalie ? 'g' : 's'}:${a.gid}:${a.pid}`));
  const needStats = [...new Set(missing.map(a => a.pid))];
  const gamesMissingStats = [...new Set(missing.map(a => a.gid))];

  return NextResponse.json({
    data: { games: gameIds.length, checked: seen.size, added, needStats, gamesMissingStats, errors },
    error: errors.length ? `${errors.length} errors` : null,
  });
}
