import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// ─── Backfill SOS + Recent Form ───────────────────────────────────────────────
// Populates sos_multiplier and goalie_snapshot.teamRecentForm on all
// game_team_snapshots using actual season game results.
//
// SOS formula:  1.0 + (seasonWinPct - 0.5) × 0.4
//   — scaling ×0.4 (v1.4 reduced from ×0.8 in v1.3 — see backtest/route.ts notes)
//   — TODO: linear scaling is artificial; calibrate against outcomes
//
// Recent form:  1.0 + (last5WinPct - 0.5) × 0.3
//   — captures hot/cold streaks not reflected in full-season SOS
//   — window reduced from 10 → 5 in v1.5: 10 games (~3 weeks) was too slow
//     to reflect current team state; 5 games (~1.5 weeks) is more responsive
//   — TODO: window size (5) and scaling (×0.3) should be calibrated
//   — TODO: weight recency (last 2 games > games 4–5)
//   — stored in goalie_snapshot.teamRecentForm (team-level metric — move to
//     dedicated column once schema migration is done)
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

    // 4. For each snapshot, compute season win% and last-10-game form
    const updates: {
      game_id: number;
      team_id: number;
      sos_multiplier: number;
      recent_form: number;
    }[] = [];

    for (const snap of snapshots ?? []) {
      const gameDate = gameDateMap.get(snap.game_id);
      if (!gameDate) continue;

      const teamId = snap.team_id;
      type GameRow = { id: number; game_date: string; home_team_id: number; away_team_id: number; home_score: number | null; away_score: number | null };
      const teamGames: GameRow[] = [];

      for (const g of allGames ?? []) {
        if (g.game_date >= gameDate) continue;
        if (g.home_score === null || g.away_score === null) continue;
        if (g.home_team_id !== teamId && g.away_team_id !== teamId) continue;
        teamGames.push(g);
      }

      // Season SOS — full-season win%
      // ×0.4 scaling: reduced from ×0.8 (v1.3) — see backtest/route.ts for rationale
      // TODO: linear scaling is a placeholder; should be calibrated against outcomes
      let seasonWins = 0;
      for (const g of teamGames) {
        const isHome = g.home_team_id === teamId;
        if ((isHome ? g.home_score! : g.away_score!) > (isHome ? g.away_score! : g.home_score!)) seasonWins++;
      }
      const seasonWinPct = teamGames.length >= 5 ? seasonWins / teamGames.length : 0.5;
      const sosMult = Math.round((1.0 + (seasonWinPct - 0.5) * 0.4) * 1000) / 1000;

      // Recent form — last 5 games (reduced from 10 in v1.5)
      // 10 games (~3 weeks) was too slow to capture current form
      // TODO: window (5) and scaling (×0.3) should be calibrated against outcomes
      // TODO: weight recency (last 2 games > games 4–5)
      const last5 = teamGames.slice(-5);
      let recentWins = 0;
      for (const g of last5) {
        const isHome = g.home_team_id === teamId;
        if ((isHome ? g.home_score! : g.away_score!) > (isHome ? g.away_score! : g.home_score!)) recentWins++;
      }
      const recentWinPct = last5.length >= 3 ? recentWins / last5.length : 0.5;
      const recentForm = Math.round((1.0 + (recentWinPct - 0.5) * 0.3) * 1000) / 1000;

      updates.push({ game_id: snap.game_id, team_id: teamId, sos_multiplier: sosMult, recent_form: recentForm });
    }

    // 5. Fetch all goalie_snapshots in one query, then update concurrently
    const { data: allSnaps } = await supabaseAdmin
      .from('game_team_snapshots')
      .select('game_id, team_id, goalie_snapshot');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const goalieMap = new Map<string, any>();
    for (const s of allSnaps ?? []) {
      goalieMap.set(`${s.game_id}_${s.team_id}`, s.goalie_snapshot);
    }

    let updated = 0;
    const CONCURRENCY = 10;
    for (let i = 0; i < updates.length; i += CONCURRENCY) {
      const batch = updates.slice(i, i + CONCURRENCY);
      const results = await Promise.all(batch.map(u => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const existing = (goalieMap.get(`${u.game_id}_${u.team_id}`) as any) ?? {};
        const mergedGoalie = { ...existing, teamRecentForm: u.recent_form };
        return supabaseAdmin
          .from('game_team_snapshots')
          .update({ sos_multiplier: u.sos_multiplier, goalie_snapshot: mergedGoalie })
          .eq('game_id', u.game_id)
          .eq('team_id', u.team_id);
      }));
      updated += results.filter(r => !r.error).length;
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
