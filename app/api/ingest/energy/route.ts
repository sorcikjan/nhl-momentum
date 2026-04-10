import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { calculatePlayerEnergy, GOALIE_DRAIN_PER_MIN, type GameRecord } from '@/lib/energy';
import { requireIngestAuth } from '@/lib/ingest-auth';

// GET /api/ingest/energy?offset=0&limit=100
//
// For each active player:
//   1. Look up their game stats (game_player_stats / game_goalie_stats) over last 72h
//   2. Join with games table for start_time_utc (game end ≈ start + 2.5h)
//   3. Run calculatePlayerEnergy algorithm
//   4. Update energy_bar on their latest player_metric_snapshots row
//      (or insert a minimal snapshot if none exists yet — used for goalies)
//
// Run AFTER /api/ingest/metrics so the snapshot rows exist for skaters.

const GAME_DURATION_MS = 2.5 * 3_600_000; // avg NHL game length (2h30m)

export async function GET(req: NextRequest) {
  const authError = requireIngestAuth(req);
  if (authError) return authError;

  const limit  = Math.min(500, Math.max(1, Number(req.nextUrl.searchParams.get('limit')  ?? '100')));
  const offset = Math.max(0, Number(req.nextUrl.searchParams.get('offset') ?? '0'));

  try {
    const now     = new Date();
    const since   = new Date(now.getTime() - 72 * 3_600_000);
    const sinceDate = since.toISOString().slice(0, 10);

    // 1. Active players (paginated)
    const { data: players, error: pErr } = await supabaseAdmin
      .from('players')
      .select('id, position_code')
      .eq('is_active', true)
      .order('id')
      .range(offset, offset + limit - 1);

    if (pErr) throw pErr;
    if (!players?.length) return NextResponse.json({ data: { updated: 0, inserted: 0 }, error: null });

    const playerIds = players.map(p => p.id);
    const skaterIds = players.filter(p => p.position_code !== 'G').map(p => p.id);
    const goalieIds = players.filter(p => p.position_code === 'G').map(p => p.id);

    // 2. Recent games (last 72h) — no game_state filter: if outcomes phase hasn't
    // marked a game FINAL yet, we'd lose energy data for those players.
    const { data: recentGames } = await supabaseAdmin
      .from('games')
      .select('id, game_date, start_time_utc')
      .gte('game_date', sinceDate)
      .limit(200);

    const gameMap = new Map((recentGames ?? []).map(g => [g.id, g]));
    const recentGameIds = Array.from(gameMap.keys());

    // 3a. Skater stats for recent games
    const { data: skaterStats } = skaterIds.length && recentGameIds.length
      ? await supabaseAdmin
          .from('game_player_stats')
          .select('player_id, game_id, toi_seconds')
          .in('player_id', skaterIds)
          .in('game_id', recentGameIds)
      : { data: [] };

    // 3b. Goalie stats for recent games
    const { data: goalieStats } = goalieIds.length && recentGameIds.length
      ? await supabaseAdmin
          .from('game_goalie_stats')
          .select('player_id, game_id, toi_seconds')
          .in('player_id', goalieIds)
          .in('game_id', recentGameIds)
      : { data: [] };

    // 4. Group stats into GameRecord[] per player
    const recordsByPlayer = new Map<number, GameRecord[]>();
    for (const row of [...(skaterStats ?? []), ...(goalieStats ?? [])]) {
      const game = gameMap.get(row.game_id);
      if (!game) continue;
      const startUtc = game.start_time_utc
        ? new Date(game.start_time_utc)
        : new Date(`${game.game_date}T20:00:00Z`); // fallback: typical 8pm UTC puck drop
      const gameEnd = new Date(startUtc.getTime() + GAME_DURATION_MS);

      if (!recordsByPlayer.has(row.player_id)) recordsByPlayer.set(row.player_id, []);
      recordsByPlayer.get(row.player_id)!.push({
        game_end_utc: gameEnd,
        toi_seconds: row.toi_seconds ?? 0,
      });
    }

    // 5. Get latest snapshot ID per player — limit to 3× player count so each
    // player's latest row is always included (Supabase default cap is 1000)
    const { data: latestSnaps } = await supabaseAdmin
      .from('player_metric_snapshots')
      .select('id, player_id')
      .in('player_id', playerIds)
      .order('calculated_at', { ascending: false })
      .limit(playerIds.length * 3);

    const latestIdByPlayer = new Map<number, string>();
    for (const snap of latestSnaps ?? []) {
      if (!latestIdByPlayer.has(snap.player_id)) latestIdByPlayer.set(snap.player_id, snap.id);
    }

    // 6. Compute energy and split into updates vs inserts
    const updates: { id: string; energy_bar: number }[] = [];
    const inserts: { player_id: number; energy_bar: number; momentum_rank: number }[] = [];

    for (const player of players) {
      const drainRate = player.position_code === 'G' ? GOALIE_DRAIN_PER_MIN : undefined;
      const records   = recordsByPlayer.get(player.id) ?? [];
      const energy    = calculatePlayerEnergy(records, now, drainRate);
      const snapId    = latestIdByPlayer.get(player.id);

      if (snapId) {
        updates.push({ id: snapId, energy_bar: energy });
      } else {
        // No snapshot yet (common for goalies) — insert minimal row
        inserts.push({ player_id: player.id, energy_bar: energy, momentum_rank: 0 });
      }
    }

    // 7. Batch updates (10 concurrent)
    let updated = 0;
    const CONCURRENT = 10;
    for (let i = 0; i < updates.length; i += CONCURRENT) {
      const batch = updates.slice(i, i + CONCURRENT);
      const results = await Promise.all(
        batch.map(({ id, energy_bar }) =>
          supabaseAdmin
            .from('player_metric_snapshots')
            .update({ energy_bar })
            .eq('id', id),
        ),
      );
      updated += results.filter(r => !r.error).length;
    }

    // 8. Batch inserts for players with no snapshot
    let inserted = 0;
    if (inserts.length) {
      const BATCH = 50;
      for (let i = 0; i < inserts.length; i += BATCH) {
        const { error } = await supabaseAdmin
          .from('player_metric_snapshots')
          .insert(inserts.slice(i, i + BATCH));
        if (!error) inserted += Math.min(BATCH, inserts.length - i);
      }
    }

    return NextResponse.json({
      data: { updated, inserted, total: players.length },
      error: null,
    });
  } catch (err) {
    return NextResponse.json(
      { data: null, error: (err as Error).message },
      { status: 500 },
    );
  }
}
