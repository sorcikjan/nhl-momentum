import type { BackgroundHandler } from '@netlify/functions';

// Background function — up to 15-minute runtime.
// Triggered via POST /.netlify/functions/daily-worker-background
// POST body JSON: { phases?: string[], date?: string }
// If no phases, runs the full daily pipeline.

import { call, paginate, alert, syncMissingStats, waitForDb, teamsThatPlayed, etDate } from '../lib/pipeline';

// Recap generation: fetchRecapData (~3s) + Gemini generation (30-120s) + retries
// on 503/429 = can easily exceed 55s. The recap route has maxDuration=300,
// so we wait up to 250s — leaves 50s margin and fits in the 15-min background budget.
const RECAP_TIMEOUT_MS = 250_000;

const handler: BackgroundHandler = async (event) => {
  const base = process.env.INTERNAL_URL ?? 'https://nhl-momentum.netlify.app';
  const ingestKey = process.env.INGEST_API_KEY ?? '';
  const h = { 'x-api-key': ingestKey };

  // Auth
  const key = event.headers['x-api-key'] ?? event.headers['X-Api-Key'] ?? '';
  if (key !== ingestKey) {
    console.error('[daily-worker] unauthorized');
    return;
  }

  const body = event.body ? JSON.parse(event.body) : {};
  // Which pages to render again afterwards (/api/revalidate): 'full' once a
  // day (the 08:00 run), otherwise the league-wide pages and recent games.
  const scope: 'full' | 'summary' = body.revalidate === 'full' ? 'full' : 'summary';
  const phases: string[] = body.phases ?? ['rosters', 'backfill', 'outcomes', 'outcomes-backfill', 'gamelogs', 'metrics', 'snapshots', 'odds', 'energy', 'extras', 'assignments', 'recap', 'game-stories', 'prune'];
  const dateParam: string = body.date ?? '';
  const dateSuffix = dateParam ? `&date=${dateParam}` : '';

  const log: string[] = [];
  // Anything here is sent to ALERT_WEBHOOK_URL at the end of the run.
  const problems: string[] = [];
  console.log('[daily-worker] start — phases:', phases.join(', '));

  // Backpressure (netlify/lib/pipeline.ts): never start piling work onto a
  // database that is already struggling. The health check and the next run
  // catch up once it recovers.
  if (!(await waitForDb({ maxWaitMs: 180_000 }))) {
    const msg = 'database slow or down for 3 min: run skipped, nothing written';
    console.error('[daily-worker]', msg);
    await alert('daily worker', [msg, `phases: ${phases.join(', ')}`]);
    return;
  }
  // Before each heavy phase: wait up to 2 min for the database, else skip it.
  const gate = async (phase: string): Promise<boolean> => {
    if (await waitForDb()) return true;
    log.push(`${phase}: skipped, database slow`);
    problems.push(`${phase} skipped: database slow`);
    return false;
  };

  // 0a. Rosters — sync team membership from NHL rosters before anything reads
  // players.team_id (trades/signings/call-ups; scratch detection depends on it)
  if (phases.includes('rosters')) {
    try {
      const r = await call(`${base}/api/ingest/rosters`, h);
      log.push(`rosters: ${r.data?.upserted ?? 0} upserted, ${r.data?.deactivated ?? 0} deactivated${r.error ? ` err: ${r.error}` : ''}`);
    } catch (e) { log.push(`rosters: exception ${e}`); }
  }

  // 0. Backfill — predictions for past 3 days (catches any cron failures)
  if (phases.includes('backfill')) {
    try {
      const r = await call(`${base}/api/ingest/predictions-backfill?days=3`, h);
      log.push(`backfill: ${r.data?.total_predictions ?? `err: ${r.error}`} predictions`);
    } catch (e) { log.push(`backfill: exception ${e}`); }
  }

  // 1. Outcomes — record yesterday's results (schedule-API-based, fast path)
  if (phases.includes('outcomes')) {
    try {
      const r = await call(`${base}/api/ingest/daily?phase=outcomes${dateSuffix}`, h);
      log.push(`outcomes: ${r.data?.outcomes_recorded ?? `err: ${r.error}`}`);
    } catch (e) { log.push(`outcomes: exception ${e}`); }
  }

  // 1b. Outcomes backfill — DB-based sweep for any FINAL games whose prediction_outcomes
  //     were missed by phase 1 (e.g. schedule-API cache returned stale LIVE state).
  //     Reads scores from the games table directly — no NHL API dependency.
  if (phases.includes('outcomes-backfill')) {
    try {
      const r = await call(`${base}/api/ingest/outcomes-backfill?limit=100`, h);
      log.push(`outcomes-backfill: ${r.data?.outcomes_upserted ?? 0} upserted across ${r.data?.games_processed ?? 0} games${r.error ? ` err: ${r.error}` : ''}`);
    } catch (e) { log.push(`outcomes-backfill: exception ${e}`); }
  }

  // 2. Gamelogs — box-score reconciliation for games in the last 3 days: one NHL
  //    request per game finds exactly which players lack stat rows, and only those
  //    players' logs are fetched. The old approach re-fetched every player on every
  //    team that played (~780 players ≈ 13+ min), which consumed the whole 15-min
  //    background budget and starved energy/extras/recap.
  if (phases.includes('gamelogs')) {
    const since = new Date(Date.now() - 3 * 86_400_000).toISOString().slice(0, 10);
    const r = await syncMissingStats(base, h, `since=${since}`);
    if (r.stillMissing === null) {
      // Reconciliation unavailable — fall back to the per-team sweep.
      const sweep = await paginate(
        offset => call(`${base}/api/ingest/gamelogs?since=${since}&offset=${offset}&limit=15`, h, { timeoutMs: 60_000 }),
        { pageSize: 15, maxOffset: 1200, done: p => (p.data?.playersProcessed ?? 0) < 15 },
      );
      const rows = sweep.pages.reduce((n, p) => n + (p.data?.skaterRows ?? 0) + (p.data?.goalieRows ?? 0), 0);
      log.push(`gamelogs (fallback sweep): ${rows} rows, ${sweep.failedOffsets.length} failed pages`);
      problems.push(...r.errors);
      if (sweep.failedOffsets.length) problems.push(`gamelogs sweep failed at offsets ${sweep.failedOffsets.join(',')}`);
    } else {
      log.push(`gamelogs: ${r.needed} players needed stats, ${r.rows} rows written, ${r.stillMissing} still missing${r.added.length ? `, added players: ${r.added.join('; ')}` : ''}`);
      problems.push(...r.errors);
      if (r.stillMissing > 0) problems.push(`gamelogs: ${r.stillMissing} players still missing stats for games since ${since}`);
    }
  }

  // 2b. Gamelogs full sweep — only run when explicitly requested (e.g. weekly historical refresh)
  if (phases.includes('gamelogs-full')) {
    const sweep = await paginate(
      offset => call(`${base}/api/ingest/gamelogs?offset=${offset}&limit=15`, h, { timeoutMs: 60_000 }),
      { pageSize: 15, maxOffset: 2000, done: p => (p.data?.playersProcessed ?? 0) < 15 },
    );
    const rows = sweep.pages.reduce((n, p) => n + (p.data?.skaterRows ?? 0) + (p.data?.goalieRows ?? 0), 0);
    log.push(`gamelogs-full: ${rows} rows, ${sweep.failedOffsets.length} failed pages`);
    if (sweep.failedOffsets.length) problems.push(`gamelogs-full failed at offsets ${sweep.failedOffsets.join(',')}`);
  }

  // 3. Metrics — only the teams that played last night (ET). A player's numbers
  //    change only when he plays: recalculating all ~900 every morning took the
  //    database down on nights with no games at all (26–27 Nov 2026). The
  //    game-finish worker already recalculates each team as its game ends; this
  //    is the safety net for any it missed. { fullMetrics: true } (or an
  //    unreadable schedule) recalculates everyone, paced.
  if (phases.includes('metrics') && await gate('metrics')) {
    const teams = body.fullMetrics ? null : await teamsThatPlayed(etDate(1));
    if (teams && teams.length === 0) {
      log.push(`metrics: no games on ${etDate(1)}, nothing to recalculate`);
    } else {
      const filter = teams ? `&teamIds=${teams.join(',')}` : '';
      const res = await paginate(
        offset => call(`${base}/api/ingest/metrics?offset=${offset}&limit=100${filter}`, h),
        {
          pageSize: 100, maxOffset: 2000, done: p => (p.data?.playersProcessed ?? 0) < 100,
          pauseMs: 2_000,
          beforePage: () => waitForDb(),
        },
      );
      const snaps = res.pages.reduce((n, p) => n + (p.data?.snapshotsInserted ?? 0), 0);
      log.push(`metrics (${teams ? `${teams.length} teams` : 'all players'}): ${snaps} snapshots${res.failedOffsets.length ? `, failed offsets ${res.failedOffsets.join(',')}` : ''}${res.stoppedAt != null ? `, stopped at offset ${res.stoppedAt}: database slow` : ''}`);
      if (res.failedOffsets.length) problems.push(`metrics failed at offsets ${res.failedOffsets.join(',')}`);
      if (res.stoppedAt != null) problems.push(`metrics stopped at offset ${res.stoppedAt}: database slow`);
    }
  }

  // 4. Snapshots + predictions — today (and tomorrow look-ahead)
  if (phases.includes('snapshots') && await gate('snapshots')) {
    try {
      // Today
      let offset = 0, snaps = 0, preds = 0;
      for (;;) {
        const r = await call(`${base}/api/ingest/daily?phase=snapshots&game_offset=${offset}&game_limit=2${dateSuffix}`, h);
        if (r.error) { log.push(`snapshots err: ${r.error}`); break; }
        snaps += r.data?.snapshots_saved ?? 0;
        preds += r.data?.predictions_stored ?? 0;
        if (!r.data?.has_more) break;
        offset += 2;
        if (offset > 50) break;
      }
      log.push(`snapshots today: ${snaps} saved, ${preds} predictions`);

      // Tomorrow look-ahead
      const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
      let tOffset = 0, tSnaps = 0, tPreds = 0;
      for (;;) {
        const r = await call(`${base}/api/ingest/daily?phase=snapshots&date=${tomorrow}&game_offset=${tOffset}&game_limit=2`, h);
        if (r.error) break;
        tSnaps += r.data?.snapshots_saved ?? 0;
        tPreds += r.data?.predictions_stored ?? 0;
        if (!r.data?.has_more) break;
        tOffset += 2;
        if (tOffset > 50) break;
      }
      log.push(`snapshots tomorrow (${tomorrow}): ${tSnaps} saved, ${tPreds} predictions`);
    } catch (e) { log.push(`snapshots: exception ${e}`); }
  }

  // 5. Odds — fetch from The Odds API (runs after snapshots so game IDs are in DB)
  if (phases.includes('odds')) {
    try {
      const r = await call(`${base}/api/ingest/odds`, h);
      log.push(`odds: ${r.matched ?? 0} matched, ${r.upserted ?? 0} upserted${r.error ? ` err: ${r.error}` : ''}`);
    } catch (e) { log.push(`odds: exception ${e}`); }
  }

  // 6. Energy — full sweep
  if (phases.includes('energy') && await gate('energy')) {
    try {
      const r = await call(`${base}/api/ingest/daily?phase=energy`, h);
      log.push(`energy: ${r.data?.energy_updated ?? `err: ${r.error}`} updated`);
    } catch (e) { log.push(`energy: exception ${e}`); }
  }

  // 7. Game extras — three stars, team box score, YouTube highlights for recent completed games
  if (phases.includes('extras')) {
    try {
      let offset = 0, updated = 0, ytFound = 0;
      for (;;) {
        const r = await call(`${base}/api/ingest/game-extras?days=7&offset=${offset}&limit=20`, h);
        if (r.error && !r.data) { log.push(`extras err: ${r.error}`); break; }
        updated += r.data?.updated ?? 0;
        ytFound += r.data?.youtubeFound ?? 0;
        if ((r.data?.processed ?? 0) < 20) break;
        offset += 20;
        if (offset > 200) break;
      }
      log.push(`extras: ${updated} games updated, ${ytFound} YouTube highlights found`);
    } catch (e) { log.push(`extras: exception ${e}`); }
  }

  // 8. Player assignments — detect AHL/minor league assignments
  if (phases.includes('assignments')) {
    try {
      const r = await call(`${base}/api/ingest/player-assignments`, h, { timeoutMs: 60_000 });
      log.push(`assignments: ${r.data?.flagged_in_minors ?? 0} in minors, ${r.data?.unflagged ?? 0} recalled, checked ${r.data?.checked ?? 0}${r.error ? ` err: ${r.error}` : ''}`);
    } catch (e) { log.push(`assignments: exception ${e}`); }
  }

  // 9. Daily recap article — generated after outcomes/gamelogs are fresh, and before
  //    signals so bulk AI calls can't use up the Gemini quota first
  if (phases.includes('recap')) {
    try {
      // Respect explicit date param (for manual backfills); fall back to yesterday.
      const recapDate = dateParam || new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const r = await call(`${base}/api/ingest/recap?date=${recapDate}`, h, { timeoutMs: RECAP_TIMEOUT_MS, retries: 1 });
      log.push(`recap: ${r.data?.skipped ? `skipped (${r.data.reason})` : r.data?.title ?? `err: ${r.error}`}`);
    } catch (e) { log.push(`recap: exception ${e}`); }
  }

  // 9a. Game stories — one article per finished game, on its game page. One
  //     game per call: each is a 10–40s AI call and the route runs as a
  //     synchronous function (direct recap calls hit its time limit on
  //     2026-10-23). Stops when a call writes nothing (all done, or the AI keeps
  //     failing — the next run retries).
  if (phases.includes('game-stories')) {
    try {
      const storyDate = dateParam || new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      let written = 0, failed = 0, remaining = 0;
      for (let batch = 0; batch < 16; batch++) {
        const r = await call(`${base}/api/ingest/game-stories?date=${storyDate}&limit=1`, h, { timeoutMs: RECAP_TIMEOUT_MS, retries: 0 });
        if (!r.data) { log.push(`game-stories: err: ${r.error}`); break; }
        written += r.data.written ?? 0; failed += r.data.failed ?? 0; remaining = r.data.remaining ?? 0;
        if (!r.data.written || !remaining) break;
      }
      log.push(`game-stories: ${written} written, ${failed} failed, ${remaining} left`);
    } catch (e) { log.push(`game-stories: exception ${e}`); }
  }

  // 9b. Soft signals — NHL RSS + Newsdata.io news ingestion
  if (phases.includes('signals')) {
    try {
      const r = await call(`${base}/api/ingest/soft-signals?type=all`, h);
      log.push(`signals: ${r.data?.inserted ?? 0} inserted, ${r.data?.skipped ?? 0} skipped${r.error ? ` err: ${r.error}` : ''}`);
    } catch (e) { log.push(`signals: exception ${e}`); }
  }

  // 10. Snapshot retention — keeps player_metric_snapshots bounded (it reached ~755k
  //     rows and its scans took the database down in Oct 2026).
  if (phases.includes('prune')) {
    const r = await call(`${base}/api/ingest/prune`, h, { timeoutMs: 150_000, retries: 0 });
    log.push(`prune: ${r.data ? `${r.data.deleted} old snapshots deleted` : `err: ${r.error}`}`);
  }

  // Pages show the new data from here on (lib/cache-policy.ts).
  try {
    const res = await fetch(`${base}/api/revalidate`, {
      method: 'POST',
      headers: { 'x-api-key': ingestKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ scope }),
    });
    log.push(`revalidate ${scope}: ${res.ok ? 'ok' : `err: HTTP ${res.status}`}`);
  } catch (e) { log.push(`revalidate: exception ${e}`); }

  console.log('[daily-worker] complete:', log.join(' | '));

  // Every phase reports failures as "err:"/"exception" in its log line.
  problems.push(...log.filter(l => /\berr\b|err:|exception/.test(l)));
  if (problems.length) {
    console.error('[daily-worker] problems:', problems.join(' | '));
    await alert(`daily-worker (${phases.join(',')})`, problems);
  }
};

export { handler };
