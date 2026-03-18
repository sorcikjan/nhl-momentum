import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { calcEnergyBar } from '@/lib/energy';

// GET /api/energy/[teamId]?opponentTeamId=XXX
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;
  const opponentId = req.nextUrl.searchParams.get('opponentTeamId');

  try {
    const now = new Date();
    const since72h = new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString();

    // TOI of all players for this team over last 72 hours
    const { data: recentStats, error } = await supabaseAdmin
      .from('game_player_stats')
      .select('player_id, toi_seconds, games(start_time_utc, home_team_id, away_team_id)')
      .eq('team_id', Number(teamId))
      .gte('games.start_time_utc', since72h);

    if (error) throw error;

    // Aggregate TOI per player
    const playerToi: Record<number, number> = {};
    for (const row of recentStats ?? []) {
      playerToi[row.player_id] = (playerToi[row.player_id] ?? 0) + row.toi_seconds;
    }

    // Get opponent defensive filter (from latest metric snapshot)
    let opponentDefFilter = 1.0;
    let leagueAvgDefFilter = 1.0;

    if (opponentId) {
      const { data: opponentMetrics } = await supabaseAdmin
        .from('player_metric_snapshots')
        .select('momentum_ppm, players(team_id, position_code)')
        .eq('players.team_id', Number(opponentId))
        .eq('players.position_code', 'G')
        .order('calculated_at', { ascending: false })
        .limit(1);

      if (opponentMetrics?.[0]) {
        opponentDefFilter = opponentMetrics[0].momentum_ppm ?? 1.0;
      }
    }

    // Calculate energy bar per player
    const energyBars = Object.entries(playerToi).map(([playerId, toi]) => ({
      playerId: Number(playerId),
      toiLast72h: toi,
      energyBar: calcEnergyBar(toi, opponentDefFilter, leagueAvgDefFilter),
    }));

    // Team-level energy = average of all active players
    const teamEnergy = energyBars.length > 0
      ? Math.round(energyBars.reduce((s, p) => s + p.energyBar, 0) / energyBars.length)
      : 100;

    return NextResponse.json({
      data: { teamId: Number(teamId), teamEnergy, players: energyBars },
      error: null,
    });
  } catch (err) {
    return NextResponse.json(
      { data: null, error: (err as Error).message },
      { status: 500 }
    );
  }
}
