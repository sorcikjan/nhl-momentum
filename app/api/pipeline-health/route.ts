// Pipeline health & data integrity diagnostic endpoint.
//
// Verifies every stage of the ingest pipeline against live Supabase data:
//   1. Games    — recent games exist, have correct states, FINAL rows have scores
//   2. Gamelogs — every FINAL game in last 3 days has game_player_stats rows
//   3. Snapshots — active players who played recently have fresh metric snapshots
//   4. Predictions — today's and tomorrow's upcoming games have predictions
//   5. Outcomes — FINAL games with predictions have outcome rows
//   6. Energy   — energy bars are populated and recently updated
//   7. Extras   — completed games have three_stars and youtube_highlight_id
//   8. Recaps   — recent recap exists and has hero_image_url
//   9. Freshness — when did each phase last run (inferred from recorded_at cols)
//
// Protected by INGEST_API_KEY.
// Usage: GET /api/pipeline-health?key=<INGEST_API_KEY>
//        or header: x-api-key: <INGEST_API_KEY>
//
// Returns { ok: boolean, issues: string[], checks: {...} }
// ok=false means at least one check failed. Issues list every specific problem found.

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ─── helpers ─────────────────────────────────────────────────────────────────

function daysAgo(n: number) {
  return new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);
}

function hoursAgo(n: number) {
  return new Date(Date.now() - n * 3_600_000).toISOString();
}

function ago(isoString: string | null | undefined): string {
  if (!isoString) return 'never';
  const ms = Date.now() - new Date(isoString).getTime();
  const h = Math.round(ms / 3_600_000);
  if (h < 1) return `${Math.round(ms / 60_000)}m ago`;
  if (h < 48) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

// ─── route ───────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // Auth
  const keyHeader = req.headers.get('x-api-key') ?? '';
  const keyParam  = req.nextUrl.searchParams.get('key') ?? '';
  const expected  = process.env.INGEST_API_KEY ?? '';
  if (!expected || (keyHeader !== expected && keyParam !== expected)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const issues: string[] = [];
  const checks: Record<string, unknown> = {};
  const today    = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  const since3d  = daysAgo(3);
  const since7d  = daysAgo(7);

  // ── 1. GAMES ──────────────────────────────────────────────────────────────
  // Check: FINAL games in last 3 days have non-null scores.
  // Check: today's schedule rows exist (may be 0 if no games today).
  {
    const { data: recentFinal } = await supabaseAdmin
      .from('games')
      .select('id, game_date, home_score, away_score, game_state')
      .gte('game_date', since3d)
      .in('game_state', ['FINAL', 'OFF'])
      .order('game_date', { ascending: false });

    const { data: todayGames } = await supabaseAdmin
      .from('games')
      .select('id, game_state')
      .eq('game_date', today);

    const missingScores = (recentFinal ?? []).filter(
      g => g.home_score == null || g.away_score == null
    );

    checks.games = {
      finalLast3Days: recentFinal?.length ?? 0,
      todayInDB: todayGames?.length ?? 0,
      todayStates: (todayGames ?? []).map(g => g.game_state),
      missingScores: missingScores.map(g => ({
        game_id: g.id, date: g.game_date, state: g.game_state,
      })),
    };

    if (missingScores.length > 0) {
      issues.push(`GAMES: ${missingScores.length} FINAL/OFF game(s) have null scores (IDs: ${missingScores.map(g => g.id).join(', ')})`);
    }
    if ((recentFinal?.length ?? 0) === 0) {
      issues.push('GAMES: no FINAL games in last 3 days — season may be over or ingestion broken');
    }
  }

  // ── 2. GAMELOGS ───────────────────────────────────────────────────────────
  // For each FINAL game in last 3 days, verify game_player_stats rows exist.
  // A game with 0 stat rows means gamelogs ingestion never ran for it.
  {
    const { data: finalGames } = await supabaseAdmin
      .from('games')
      .select('id, game_date, home_team:teams!games_home_team_id_fkey(abbrev), away_team:teams!games_away_team_id_fkey(abbrev)')
      .gte('game_date', since3d)
      .in('game_state', ['FINAL', 'OFF']);

    const gameIds = (finalGames ?? []).map(g => g.id);

    // Count stats rows per game in a single query
    const { data: statCounts } = gameIds.length
      ? await supabaseAdmin
          .from('game_player_stats')
          .select('game_id')
          .in('game_id', gameIds)
      : { data: [] };

    const countByGame = new Map<number, number>();
    for (const row of statCounts ?? []) {
      countByGame.set(row.game_id, (countByGame.get(row.game_id) ?? 0) + 1);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gamesWithStats    = (finalGames ?? []).filter(g => (countByGame.get(g.id) ?? 0) > 0) as any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gamesMissingStats = (finalGames ?? []).filter(g => (countByGame.get(g.id) ?? 0) === 0) as any[];

    // Freshness: newest recorded_at in game_player_stats
    const { data: newestStat } = await supabaseAdmin
      .from('game_player_stats')
      .select('recorded_at')
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single();

    checks.gamelogs = {
      finalGamesLast3Days: finalGames?.length ?? 0,
      gamesWithStats: gamesWithStats.length,
      gamesMissingStats: gamesMissingStats.map(g => ({
        game_id: g.id,
        date: g.game_date,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        matchup: `${(g.away_team as any)?.abbrev ?? '?'} @ ${(g.home_team as any)?.abbrev ?? '?'}`,
      })),
      lastIngested: ago(newestStat?.recorded_at),
    };

    if (gamesMissingStats.length > 0) {
      const names = gamesMissingStats
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map(g => `${(g.away_team as any)?.abbrev ?? '?'}@${(g.home_team as any)?.abbrev ?? '?'} (${g.game_date})`)
        .join(', ');
      issues.push(`GAMELOGS: ${gamesMissingStats.length} FINAL game(s) have NO player stats: ${names}`);
    }

    const statAgeh = newestStat?.recorded_at
      ? (Date.now() - new Date(newestStat.recorded_at).getTime()) / 3_600_000
      : Infinity;
    if (statAgeh > 28 && (finalGames?.length ?? 0) > 0) {
      issues.push(`GAMELOGS: last stat ingestion was ${Math.round(statAgeh)}h ago — pipeline may be stale`);
    }
  }

  // ── 3. PLAYER SNAPSHOTS ───────────────────────────────────────────────────
  // Active skaters who appear in game_player_stats in last 3 days should have
  // a player_metric_snapshot within the last 26 hours (daily pipeline runs at 08:00 UTC).
  {
    // Players who actually played in last 3 days
    const { data: recentStats } = await supabaseAdmin
      .from('game_player_stats')
      .select('player_id')
      .gte('recorded_at', hoursAgo(72));

    const recentPlayerIds = [...new Set((recentStats ?? []).map(r => r.player_id))];

    // Latest snapshot per player (single query, ordered newest first)
    const { data: snapshots } = recentPlayerIds.length
      ? await supabaseAdmin
          .from('player_metric_snapshots')
          .select('player_id, calculated_at, momentum_ppm, energy_bar')
          .in('player_id', recentPlayerIds)
          .order('calculated_at', { ascending: false })
          .limit(recentPlayerIds.length * 3) // headroom for duplicates
      : { data: [] };

    // Deduplicate to latest per player
    const latestSnap = new Map<number, { calculated_at: string; momentum_ppm: number | null; energy_bar: number | null }>();
    for (const s of snapshots ?? []) {
      if (!latestSnap.has(s.player_id)) latestSnap.set(s.player_id, s);
    }

    const cutoff = hoursAgo(26); // pipeline should have run within last 26h
    const stale: number[] = [];
    const missing: number[] = [];

    for (const pid of recentPlayerIds) {
      const snap = latestSnap.get(pid);
      if (!snap) {
        missing.push(pid);
      } else if (snap.calculated_at < cutoff) {
        stale.push(pid);
      }
    }

    // Newest snapshot overall
    const { data: newestSnap } = await supabaseAdmin
      .from('player_metric_snapshots')
      .select('calculated_at')
      .order('calculated_at', { ascending: false })
      .limit(1)
      .single();

    checks.snapshots = {
      activePlayers: recentPlayerIds.length,
      withFreshSnapshot: recentPlayerIds.length - missing.length - stale.length,
      staleSnapshots: stale.length,   // had a game recently but snapshot >26h old
      missingSnapshots: missing.length, // played recently but NO snapshot ever
      lastCalculated: ago(newestSnap?.calculated_at),
    };

    if (missing.length > 0) {
      issues.push(`SNAPSHOTS: ${missing.length} player(s) who played recently have NO metric snapshot (player_ids: ${missing.slice(0, 10).join(', ')}${missing.length > 10 ? '...' : ''})`);
    }
    if (stale.length > 5) {
      issues.push(`SNAPSHOTS: ${stale.length} player(s) have stale snapshots (>26h old) — metrics phase may have failed`);
    }
  }

  // ── 4. PREDICTIONS ────────────────────────────────────────────────────────
  // Today's and tomorrow's scheduled games should have predictions.
  {
    const { data: scheduledGames } = await supabaseAdmin
      .from('games')
      .select('id, game_date, game_state')
      .in('game_date', [today, tomorrow])
      .in('game_state', ['FUT', 'PRE', 'LIVE']);

    const scheduledIds = (scheduledGames ?? []).map(g => g.id);

    const { data: preds } = scheduledIds.length
      ? await supabaseAdmin
          .from('predictions')
          .select('game_id, model_version, created_at')
          .in('game_id', scheduledIds)
          .order('created_at', { ascending: false })
      : { data: [] };

    const predGameIds = new Set((preds ?? []).map(p => p.game_id));
    const unpredicted = (scheduledGames ?? []).filter(g => !predGameIds.has(g.id));

    // Active model version
    const { data: activeModel } = await supabaseAdmin
      .from('model_versions')
      .select('version')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Count how many scheduled games have active-model predictions
    const activeModelPreds = (preds ?? []).filter(p => p.model_version === activeModel?.version);
    const activeModelGameIds = new Set(activeModelPreds.map(p => p.game_id));
    const missingActiveModel = (scheduledGames ?? []).filter(g => !activeModelGameIds.has(g.id));

    checks.predictions = {
      scheduledGamesToday: (scheduledGames ?? []).filter(g => g.game_date === today).length,
      scheduledGamesTomorrow: (scheduledGames ?? []).filter(g => g.game_date === tomorrow).length,
      withAnyPrediction: predGameIds.size,
      withActiveModelPrediction: activeModelGameIds.size,
      activeModel: activeModel?.version ?? 'unknown',
      missingPredictions: unpredicted.map(g => ({ game_id: g.id, date: g.game_date })),
      missingActiveModel: missingActiveModel.map(g => ({ game_id: g.id, date: g.game_date })),
    };

    if (unpredicted.length > 0) {
      issues.push(`PREDICTIONS: ${unpredicted.length} scheduled game(s) have NO predictions at all`);
    }
    if (missingActiveModel.length > 0) {
      issues.push(`PREDICTIONS: ${missingActiveModel.length} scheduled game(s) missing active model (${activeModel?.version}) prediction`);
    }
  }

  // ── 5. OUTCOMES ───────────────────────────────────────────────────────────
  // Every FINAL game with a prediction should have a prediction_outcome row.
  {
    // Step 1: get FINAL game IDs from last 7 days
    const { data: finalGamesWeek } = await supabaseAdmin
      .from('games')
      .select('id')
      .gte('game_date', since7d)
      .in('game_state', ['FINAL', 'OFF']);

    const finalGameIds = (finalGamesWeek ?? []).map(g => g.id);

    // Step 2: get predictions for those games
    const { data: finalWithPreds } = finalGameIds.length
      ? await supabaseAdmin
          .from('predictions')
          .select('id, game_id')
          .in('game_id', finalGameIds)
          .limit(500)
      : { data: [] };

    const predIds = (finalWithPreds ?? []).map((p: { id: number }) => p.id);

    const { data: outcomes } = predIds.length
      ? await supabaseAdmin
          .from('prediction_outcomes')
          .select('prediction_id')
          .in('prediction_id', predIds)
      : { data: [] };

    const outcomeSet = new Set((outcomes ?? []).map(o => o.prediction_id));
    const missingOutcomes = (finalWithPreds ?? []).filter((p: { id: number }) => !outcomeSet.has(p.id));

    const { data: newestOutcome } = await supabaseAdmin
      .from('prediction_outcomes')
      .select('recorded_at')
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single();

    checks.outcomes = {
      finalPredictionsChecked: (finalWithPreds ?? []).length,
      withOutcomes: outcomeSet.size,
      missingOutcomes: missingOutcomes.length,
      lastRecorded: ago(newestOutcome?.recorded_at),
    };

    if (missingOutcomes.length > 0) {
      issues.push(`OUTCOMES: ${missingOutcomes.length} prediction(s) for FINAL games are missing outcome rows — outcomes-backfill may have failed`);
    }
  }

  // ── 6. ENERGY BARS ────────────────────────────────────────────────────────
  // Energy bars should be populated for all active players and recently updated.
  {
    const { data: energyStats } = await supabaseAdmin
      .from('player_metric_snapshots')
      .select('player_id, energy_bar, calculated_at')
      .not('energy_bar', 'is', null)
      .order('calculated_at', { ascending: false })
      .limit(1000);

    // Deduplicate to latest per player
    const latestEnergy = new Map<number, { energy_bar: number; calculated_at: string }>();
    for (const s of energyStats ?? []) {
      if (!latestEnergy.has(s.player_id)) latestEnergy.set(s.player_id, s);
    }

    const bars = [...latestEnergy.values()];
    const above90 = bars.filter(b => b.energy_bar >= 90).length;
    const below30  = bars.filter(b => b.energy_bar < 30).length;
    const nullEnergy = bars.filter(b => b.energy_bar == null).length;

    // Newest energy update
    const newestEnergyAt = bars.reduce((max, b) =>
      b.calculated_at > (max ?? '') ? b.calculated_at : max, null as string | null
    );

    checks.energy = {
      playersWithEnergy: bars.length,
      above90: above90,
      below30: below30,
      nullEnergy,
      lastUpdated: ago(newestEnergyAt),
    };

    const energyAgeH = newestEnergyAt
      ? (Date.now() - new Date(newestEnergyAt).getTime()) / 3_600_000
      : Infinity;
    if (energyAgeH > 28 && bars.length > 0) {
      issues.push(`ENERGY: energy bars last updated ${Math.round(energyAgeH)}h ago — energy phase may have failed`);
    }
    if (bars.length < 100) {
      issues.push(`ENERGY: only ${bars.length} players have energy bars — expected 400+`);
    }
  }

  // ── 7. GAME EXTRAS (three stars + highlights) ─────────────────────────────
  {
    const { data: finalGames7d } = await supabaseAdmin
      .from('games')
      .select('id, game_date, three_stars, youtube_highlight_id')
      .gte('game_date', since7d)
      .in('game_state', ['FINAL', 'OFF']);

    const withThreeStars = (finalGames7d ?? []).filter(g => g.three_stars != null).length;
    const withHighlight  = (finalGames7d ?? []).filter(g => g.youtube_highlight_id != null).length;
    const total          = finalGames7d?.length ?? 0;

    // Games >24h old should definitely have highlights by now
    const eligibleForHighlight = (finalGames7d ?? []).filter(g => {
      const ageH = (Date.now() - new Date(g.game_date + 'T12:00:00Z').getTime()) / 3_600_000;
      return ageH > 24;
    });
    const missingHighlight = eligibleForHighlight.filter(g => !g.youtube_highlight_id);

    checks.extras = {
      finalGamesLast7Days: total,
      withThreeStars,
      withHighlight,
      missingHighlightOldGames: missingHighlight.length,
    };

    if (missingHighlight.length > total * 0.5 && total > 0) {
      issues.push(`EXTRAS: ${missingHighlight.length}/${eligibleForHighlight.length} games >24h old are missing YouTube highlights`);
    }
    if (withThreeStars < total * 0.5 && total > 2) {
      issues.push(`EXTRAS: only ${withThreeStars}/${total} FINAL games have three_stars data`);
    }
  }

  // ── 8. RECAPS ─────────────────────────────────────────────────────────────
  {
    const { data: recaps } = await supabaseAdmin
      .from('daily_recaps')
      .select('date, title, hero_image_url, generated_at')
      .order('date', { ascending: false })
      .limit(3);

    const newest = recaps?.[0] ?? null;
    const newestAgeH = newest?.generated_at
      ? (Date.now() - new Date(newest.generated_at).getTime()) / 3_600_000
      : Infinity;

    // Expect a recap for yesterday (by 10:00 UTC)
    const yesterday = daysAgo(1);
    const hasYesterdayRecap = (recaps ?? []).some(r => r.date === yesterday);

    checks.recaps = {
      count: recaps?.length ?? 0,
      newest: newest?.date ?? 'none',
      newestAge: ago(newest?.generated_at),
      hasHeroImage: newest?.hero_image_url != null,
      recentDates: (recaps ?? []).map(r => r.date),
    };

    if (!hasYesterdayRecap && new Date().getUTCHours() >= 10) {
      issues.push(`RECAPS: no recap for yesterday (${yesterday}) — recap generation may have failed`);
    }
    if (newest && !newest.hero_image_url) {
      issues.push('RECAPS: newest recap has no hero_image_url — Pixabay fetch may have failed');
    }
    if (newestAgeH > 48) {
      issues.push(`RECAPS: newest recap is ${Math.round(newestAgeH)}h old — recap pipeline may be broken`);
    }
  }

  // ── 9. PIPELINE FRESHNESS ─────────────────────────────────────────────────
  // Infer last run time for each phase from timestamp columns.
  {
    const [
      { data: newestGamelog },
      { data: newestSnapshot },
      { data: newestOutcome },
      { data: newestOdds },
    ] = await Promise.all([
      supabaseAdmin.from('game_player_stats').select('recorded_at').order('recorded_at', { ascending: false }).limit(1).single(),
      supabaseAdmin.from('player_metric_snapshots').select('calculated_at').order('calculated_at', { ascending: false }).limit(1).single(),
      supabaseAdmin.from('prediction_outcomes').select('recorded_at').order('recorded_at', { ascending: false }).limit(1).single(),
      supabaseAdmin.from('external_odds').select('fetched_at').order('fetched_at', { ascending: false }).limit(1).single(),
    ]);

    checks.freshness = {
      gamelogs:  ago(newestGamelog?.recorded_at),
      snapshots: ago(newestSnapshot?.calculated_at),
      outcomes:  ago(newestOutcome?.recorded_at),
      odds:      ago(newestOdds?.fetched_at),
    };
  }

  // ── result ────────────────────────────────────────────────────────────────

  return NextResponse.json({
    ok: issues.length === 0,
    timestamp: new Date().toISOString(),
    issues,
    checks,
  }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
