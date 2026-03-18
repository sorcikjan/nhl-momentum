import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/rankings
// Returns TOP 100, Breakout Watch (top 10 delta), and Momentum Leaders (top 5)
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('player_metric_snapshots')
      .select(`
        *,
        players (
          id, first_name, last_name, position_code, team_id,
          headshot_url, injury_status,
          teams ( abbrev, name )
        )
      `)
      .order('calculated_at', { ascending: false })
      // Latest snapshot per player only
      .limit(500);

    if (error) throw error;

    // Deduplicate — keep latest per player
    const seen = new Set<number>();
    const latest = (data ?? []).filter(row => {
      if (seen.has(row.player_id)) return false;
      seen.add(row.player_id);
      return true;
    });

    const skaters = latest.filter(
      r => r.players?.position_code !== 'G'
    );

    const top100 = skaters
      .sort((a, b) => (b.momentum_rank ?? 999) - (a.momentum_rank ?? 999))
      .slice(0, 100);

    const breakoutWatch = [...skaters]
      .sort((a, b) => (b.breakout_delta ?? 0) - (a.breakout_delta ?? 0))
      .slice(0, 10);

    const momentumLeaderSkaters = [...skaters]
      .sort((a, b) => (b.momentum_ppm ?? 0) - (a.momentum_ppm ?? 0))
      .slice(0, 5);

    const goalies = latest.filter(r => r.players?.position_code === 'G');
    const momentumLeaderGoalies = [...goalies]
      .sort((a, b) => (b.momentum_ppm ?? 0) - (a.momentum_ppm ?? 0))
      .slice(0, 5);

    return NextResponse.json({
      data: {
        top100,
        breakoutWatch,
        momentumLeaders: {
          skaters: momentumLeaderSkaters,
          goalies: momentumLeaderGoalies,
        },
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
