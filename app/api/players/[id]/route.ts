import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/players/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const [playerRes, snapshotsRes, statsRes] = await Promise.all([
      supabaseAdmin
        .from('players')
        .select('*, teams(id, name, abbrev, logo_url)')
        .eq('id', Number(id))
        .single(),

      // All metric snapshots for this player (for timeline chart)
      supabaseAdmin
        .from('player_metric_snapshots')
        .select('momentum_ppm, season_ppm, breakout_delta, energy_bar, calculated_at')
        .eq('player_id', Number(id))
        .order('calculated_at', { ascending: true }),

      // Last 20 game stats for recent performance
      supabaseAdmin
        .from('game_player_stats')
        .select('*, games(game_date, home_team_id, away_team_id, home_score, away_score)')
        .eq('player_id', Number(id))
        .order('games.game_date', { ascending: false })
        .limit(20),
    ]);

    if (playerRes.error) throw playerRes.error;

    return NextResponse.json({
      data: {
        player: playerRes.data,
        metricTimeline: snapshotsRes.data ?? [],
        recentGames: statsRes.data ?? [],
      },
      error: null,
    });
  } catch (err) {
    return NextResponse.json(
      { data: null, error: (err as Error).message },
      { status: 500 }
    );
  }
}
