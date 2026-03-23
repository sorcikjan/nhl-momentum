import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// ─── Backfill SOS Multiplier ───────────────────────────────────────────────────
// Populates sos_multiplier on all game_team_snapshots using real season win%
// for each team at the time of that snapshot's game.
//
// Formula: sos_multiplier = 1.0 + (winPct - 0.5) × 0.8
//   — 40% win team  → 0.92 (below average)
//   — 50% win team  → 1.00 (average)
//   — 60% win team  → 1.08 (above average)
//   — 70% win team  → 1.16 (elite)
//
// GET /api/ingest/backfill-sos
// ─────────────────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    // 1. Fetch all completed games this season with scores
    const { data: allGames, error: gamesErr } = await supabaseAdmin
      .from('games')
      .select('id, game_date, home_team_id, away_team_id, home_score, away_score')
      .eq('season', '20252026')
      .not('home_score', 'is', null)
      .order('game_date', { ascending: true });

    if (gamesErr) throw gamesErr;

    // 2. Fetch all game_team_snapshots
    const { data: snapshots, error: snapErr } = await supabaseAdmin
      .from('game_team_snapshots')
      .select('game_id, team_id, sos_multiplier');

    if (snapErr) throw snapErr;

    // 3. Get game dates for each snapshot's game_id
    const gameDateMap = new Map<number, string>();
    for (const g of allGames ?? []) {
      gameDateMap.set(g.id, g.game_date);
    }

    // Fetch dates for snapshot games not in allGames (future/unscored games)
    const snapshotGameIds = [...new Set((snapshots ?? []).map(s => s.game_id))];
    const missingIds = snapshotGameIds.filter(id => !gameDateMap.has(id));
    if (missingIds.length > 0) {
      const { data: extraGames } = await supabaseAdmin
        .from('games')
        .select('id, game_date')
        .in('id', missingIds);
      for (const g of extraGames ?? []) gameDateMap.set(g.id, g.game_date);
    }

    // 4. For each snapshot, compute team win% in games BEFORE snapshot date
    const updates: { game_id: number; team_id: number; sos_multiplier: number }[] = [];

    for (const snap of snapshots ?? []) {
      const gameDate = gameDateMap.get(snap.game_id);
      if (!gameDate) continue;

      const teamId = snap.team_id;
      let wins = 0;
      let totalGames = 0;

      for (const g of allGames ?? []) {
        if (g.game_date >= gameDate) continue; // only games before this snapshot
        if (g.home_score === null || g.away_score === null) continue;

        const isHome = g.home_team_id === teamId;
        const isAway = g.away_team_id === teamId;
        if (!isHome && !isAway) continue;

        totalGames++;
        const myScore  = isHome ? g.home_score  : g.away_score;
        const oppScore = isHome ? g.away_score : g.home_score;
        if (myScore > oppScore) wins++;
      }

      // Minimum 5 games to use real data; otherwise stay at 1.0
      const winPct = totalGames >= 5 ? wins / totalGames : 0.5;
      const sosMult = Math.round((1.0 + (winPct - 0.5) * 0.8) * 1000) / 1000;

      updates.push({ game_id: snap.game_id, team_id: teamId, sos_multiplier: sosMult });
    }

    // 5. Apply updates in batches
    let updated = 0;
    for (const u of updates) {
      const { error } = await supabaseAdmin
        .from('game_team_snapshots')
        .update({ sos_multiplier: u.sos_multiplier })
        .eq('game_id', u.game_id)
        .eq('team_id', u.team_id);
      if (!error) updated++;
    }

    return NextResponse.json({
      data: {
        snapshots_processed: snapshots?.length ?? 0,
        snapshots_updated: updated,
        sample: updates.slice(0, 5),
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
