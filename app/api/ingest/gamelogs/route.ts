import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { currentSeason, toiToSeconds } from '@/lib/nhl-api';

// GET /api/ingest/gamelogs?limit=30&offset=0
// Pulls game logs for active players and upserts into game_player_stats / game_goalie_stats
// Use offset to paginate: run with offset=0, 30, 60, ... until exhausted

export async function GET(req: NextRequest) {
  const limit  = Number(req.nextUrl.searchParams.get('limit')  ?? '30');
  const offset = Number(req.nextUrl.searchParams.get('offset') ?? '0');
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

  for (const player of players ?? []) {
    try {
      const res = await fetch(
        `https://api-web.nhle.com/v1/player/${player.id}/game-log/${season}/2`,
        { cache: 'no-store' }
      );
      if (!res.ok) continue;
      const json = await res.json();
      const logs = json.gameLog ?? [];

      if (player.position_code === 'G') {
        // Goalie stats
        const rows = logs.map((g: {
          gameId: number;
          gameDate: string;
          shotsAgainst: number;
          goalsAgainst: number;
          savePctg: number;
          decision: string | null;
          toi: string;
        }) => ({
          game_id:      g.gameId,
          player_id:    player.id,
          team_id:      player.team_id,
          shots_against: g.shotsAgainst ?? 0,
          goals_against: g.goalsAgainst ?? 0,
          save_pct:      g.savePctg ?? 0,
          decision:      g.decision ?? null,
          toi_seconds:   toiToSeconds(g.toi),
        }));

        if (rows.length > 0) {
          const { error } = await supabaseAdmin
            .from('game_goalie_stats')
            .upsert(rows, { onConflict: 'game_id,player_id' });
          if (error) errors.push(`goalie ${player.id}: ${error.message}`);
          else goalieRows += rows.length;
        }
      } else {
        // Skater stats
        const rows = logs.map((g: {
          gameId: number;
          gameDate: string;
          goals: number;
          assists: number;
          plusMinus: number;
          hits: number;
          blockedShots: number;
          shots: number;
          toi: string;
          powerPlayGoals: number;
          powerPlayPoints: number;
          powerPlayToi: string;
          shorthandedGoals: number;
          shorthandedPoints: number;
          shorthandedToi: string;
        }) => ({
          game_id:        g.gameId,
          player_id:      player.id,
          team_id:        player.team_id,
          goals:          g.goals          ?? 0,
          assists:        g.assists         ?? 0,
          plus_minus:     g.plusMinus       ?? 0,
          hits:           g.hits            ?? 0,
          blocked_shots:  g.blockedShots    ?? 0,
          shots_on_goal:  g.shots           ?? 0,
          toi_seconds:    toiToSeconds(g.toi),
          pp_goals:       g.powerPlayGoals  ?? 0,
          pp_points:      g.powerPlayPoints ?? 0,
          pp_toi_seconds: toiToSeconds(g.powerPlayToi),
          sh_goals:       g.shorthandedGoals   ?? 0,
          sh_points:      g.shorthandedPoints  ?? 0,
          sh_toi_seconds: toiToSeconds(g.shorthandedToi),
        }));

        if (rows.length > 0) {
          const { error } = await supabaseAdmin
            .from('game_player_stats')
            .upsert(rows, { onConflict: 'game_id,player_id' });
          if (error) errors.push(`skater ${player.id}: ${error.message}`);
          else skaterRows += rows.length;
        }
      }
    } catch (err) {
      errors.push(`player ${player.id}: ${(err as Error).message}`);
    }
  }

  return NextResponse.json({
    data: { skaterRows, goalieRows, errors },
    error: errors.length > 0 ? `${errors.length} errors` : null,
  });
}
