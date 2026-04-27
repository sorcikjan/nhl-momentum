import type { BackgroundHandler } from '@netlify/functions';

// Background function — up to 15-minute runtime.
// Triggered via POST /.netlify/functions/daily-worker-background
// POST body JSON: { phases?: string[], date?: string }
// If no phases, runs the full daily pipeline.

const CALL_TIMEOUT_MS = 25_000;
// Gamelogs fetches from NHL API per player — allow more time when processing large rosters
const GAMELOGS_TIMEOUT_MS = 120_000;
// Gemini generation can take 20-30s on slow days — use a longer timeout for AI routes
const AI_CALL_TIMEOUT_MS = 55_000;

async function call(url: string, headers: Record<string, string>, timeoutMs = CALL_TIMEOUT_MS) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers, signal: ac.signal });
    return await res.json();
  } catch (err) {
    return { error: String(err), data: null };
  } finally {
    clearTimeout(timer);
  }
}

const handler: BackgroundHandler = async (event) => {
  const base = process.env.URL ?? 'https://nhl-momentum.netlify.app';
  const ingestKey = process.env.INGEST_API_KEY ?? '';
  const h = { 'x-api-key': ingestKey };

  // Auth
  const key = event.headers['x-api-key'] ?? event.headers['X-Api-Key'] ?? '';
  if (key !== ingestKey) {
    console.error('[daily-worker] unauthorized');
    return;
  }

  const body = event.body ? JSON.parse(event.body) : {};
  const phases: string[] = body.phases ?? ['backfill', 'outcomes', 'outcomes-backfill', 'gamelogs', 'metrics', 'snapshots', 'odds', 'energy', 'extras', 'assignments', 'recap'];
  const dateParam: string = body.date ?? '';
  const dateSuffix = dateParam ? `&date=${dateParam}` : '';

  const log: string[] = [];
  console.log('[daily-worker] start — phases:', phases.join(', '));

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

  // 2. Gamelogs — targeted by teams that played in last 3 days (avoids NHL API rate limits)
  // Uses ?since= to fetch only players on recently-active teams (~100–200 players during playoffs)
  // instead of paginating through all 500+ active players which silently fails past player 100.
  if (phases.includes('gamelogs')) {
    try {
      const since = new Date(Date.now() - 3 * 86_400_000).toISOString().slice(0, 10);
      let offset = 0, rows = 0, rateLimitTotal = 0;
      for (;;) {
        const r = await call(`${base}/api/ingest/gamelogs?since=${since}&offset=${offset}&limit=20`, h, GAMELOGS_TIMEOUT_MS);
        if (r.error && !r.data) { log.push(`gamelogs err: ${r.error}`); break; }
        rows += (r.data?.skaterRows ?? 0) + (r.data?.goalieRows ?? 0);
        rateLimitTotal += r.data?.rateLimited ?? 0;
        if ((r.data?.playersProcessed ?? 0) < 20) break;
        offset += 20;
        if (offset > 1000) break;
      }
      const warn = rateLimitTotal > 0 ? ` (${rateLimitTotal} rate-limited)` : '';
      log.push(`gamelogs: ${rows} rows${warn}`);
    } catch (e) { log.push(`gamelogs: exception ${e}`); }
  }

  // 2b. Gamelogs full sweep — only run when explicitly requested (e.g. weekly historical refresh)
  if (phases.includes('gamelogs-full')) {
    try {
      let offset = 0, rows = 0;
      for (;;) {
        const r = await call(`${base}/api/ingest/gamelogs?offset=${offset}&limit=50`, h, GAMELOGS_TIMEOUT_MS);
        if (r.error && !r.data) { log.push(`gamelogs-full err: ${r.error}`); break; }
        rows += (r.data?.skaterRows ?? 0) + (r.data?.goalieRows ?? 0);
        if ((r.data?.playersProcessed ?? 0) < 50) break;
        offset += 50;
        if (offset > 2000) break;
      }
      log.push(`gamelogs-full: ${rows} rows`);
    } catch (e) { log.push(`gamelogs-full: exception ${e}`); }
  }

  // 3. Metrics — paginated, all players
  if (phases.includes('metrics')) {
    try {
      let offset = 0, snaps = 0;
      for (;;) {
        const r = await call(`${base}/api/ingest/metrics?offset=${offset}&limit=100`, h);
        if (r.error) { log.push(`metrics err: ${r.error}`); break; }
        const inserted = r.data?.snapshotsInserted ?? 0;
        snaps += inserted;
        if (inserted === 0) break;
        offset += 100;
        if (offset > 2000) break;
      }
      log.push(`metrics: ${snaps} snapshots`);
    } catch (e) { log.push(`metrics: exception ${e}`); }
  }

  // 4. Snapshots + predictions — today (and tomorrow look-ahead)
  if (phases.includes('snapshots')) {
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
  if (phases.includes('energy')) {
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
      const r = await call(`${base}/api/ingest/player-assignments`, h, GAMELOGS_TIMEOUT_MS);
      log.push(`assignments: ${r.data?.flagged_in_minors ?? 0} in minors, ${r.data?.unflagged ?? 0} recalled, checked ${r.data?.checked ?? 0}${r.error ? ` err: ${r.error}` : ''}`);
    } catch (e) { log.push(`assignments: exception ${e}`); }
  }

  // 9. Soft signals — NHL RSS + Newsdata.io news ingestion
  if (phases.includes('signals')) {
    try {
      const r = await call(`${base}/api/ingest/soft-signals?type=all`, h);
      log.push(`signals: ${r.data?.inserted ?? 0} inserted, ${r.data?.skipped ?? 0} skipped${r.error ? ` err: ${r.error}` : ''}`);
    } catch (e) { log.push(`signals: exception ${e}`); }
  }

  // 9. Daily recap article — generated after outcomes/gamelogs are fresh
  if (phases.includes('recap')) {
    try {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const r = await call(`${base}/api/ingest/recap?date=${yesterday}`, h, AI_CALL_TIMEOUT_MS);
      log.push(`recap: ${r.data?.skipped ? `skipped (${r.data.reason})` : r.data?.title ?? `err: ${r.error}`}`);
    } catch (e) { log.push(`recap: exception ${e}`); }
  }

  // Bust ISR cache so homepage/rankings/accuracy reflect new data immediately.
  try {
    await fetch(`${base}/api/revalidate`, {
      method: 'POST',
      headers: { 'x-api-key': ingestKey },
    });
    log.push('revalidate: ok');
  } catch (e) { log.push(`revalidate: exception ${e}`); }

  console.log('[daily-worker] complete:', log.join(' | '));
};

export { handler };
