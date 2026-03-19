import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { calculatePlayerEnergy, type GameRecord } from '@/lib/energy';

// GET /api/energy/[teamId]
// Returns real-time energy bars for all active players on a team.
// Uses the same calculatePlayerEnergy algorithm as the ingest route.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;

  try {
    const now       = new Date();
    const since     = new Date(now.getTime() - 72 * 3_600_000);
    const sinceDate = since.toISOString().slice(0, 10);

    // Recent completed games (last 72h)
    const { data: recentGames } = await supabaseAdmin
      .from('games')
      .select('id, game_date, start_time_utc')
      .gte('game_date', sinceDate)
      .in('game_state', ['FINAL', 'OFF']);

    const gameMap = new Map((recentGames ?? []).map(g => [g.id, g]));
    const recentGameIds = Array.from(gameMap.keys());

    // Skater stats for this team
    const { data: recentStats, error } = await supabaseAdmin
      .from('game_player_stats')
      .select('player_id, game_id, toi_seconds')
      .eq('team_id', Number(teamId))
      .in('game_id', recentGameIds.length ? recentGameIds : [-1]);

    if (error) throw error;

    // Group by player
    const recordsByPlayer = new Map<number, GameRecord[]>();
    for (const row of recentStats ?? []) {
      const game = gameMap.get(row.game_id);
      if (!game) continue;
      const startUtc = game.start_time_utc
        ? new Date(game.start_time_utc)
        : new Date(`${game.game_date}T20:00:00Z`);
      const gameEnd = new Date(startUtc.getTime() + 2.5 * 3_600_000);
      if (!recordsByPlayer.has(row.player_id)) recordsByPlayer.set(row.player_id, []);
      recordsByPlayer.get(row.player_id)!.push({ game_end_utc: gameEnd, toi_seconds: row.toi_seconds ?? 0 });
    }

    const players = Array.from(recordsByPlayer.entries()).map(([playerId, records]) => ({
      playerId,
      energyBar: calculatePlayerEnergy(records, now),
    }));

    const teamEnergy = players.length
      ? Math.round(players.reduce((s, p) => s + p.energyBar, 0) / players.length)
      : 100;

    return NextResponse.json({
      data: { teamId: Number(teamId), teamEnergy, players },
      error: null,
    });
  } catch (err) {
    return NextResponse.json(
      { data: null, error: (err as Error).message },
      { status: 500 },
    );
  }
}
