import type { BackgroundHandler } from '@netlify/functions';

// Background function — up to 15-minute runtime.
// Triggered via POST /.netlify/functions/daily-worker-background
// POST body JSON: { phases?: string[], date?: string }
// If no phases, runs the full daily pipeline.

const CALL_TIMEOUT_MS = 25_000;

async function call(url: string, headers: Record<string, string>) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), CALL_TIMEOUT_MS);
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
  const phases: string[] = body.phases ?? ['backfill', 'outcomes', 'gamelogs', 'metrics', 'snapshots', 'odds', 'energy', 'recap'];
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

  // 1. Outcomes — record yesterday's results
  if (phases.includes('outcomes')) {
    try {
      const r = await call(`${base}/api/ingest/daily?phase=outcomes${dateSuffix}`, h);
      log.push(`outcomes: ${r.data?.outcomes_recorded ?? `err: ${r.error}`}`);
    } catch (e) { log.push(`outcomes: exception ${e}`); }
  }

  // 2. Gamelogs — paginated, all players
  if (phases.includes('gamelogs')) {
    try {
      let offset = 0, rows = 0;
      for (;;) {
        const r = await call(`${base}/api/ingest/gamelogs?offset=${offset}&limit=50`, h);
        if (r.error) { log.push(`gamelogs err: ${r.error}`); break; }
        rows += (r.data?.skaterRows ?? 0) + (r.data?.goalieRows ?? 0);
        if ((r.data?.playersProcessed ?? r.data?.skaterRows ?? 0) < 50) break;
        offset += 50;
        if (offset > 2000) break;
      }
      log.push(`gamelogs: ${rows} rows`);
    } catch (e) { log.push(`gamelogs: exception ${e}`); }
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

  // 8. Daily recap article — generated after outcomes/gamelogs are fresh
  if (phases.includes('recap')) {
    try {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const r = await call(`${base}/api/ingest/recap?date=${yesterday}`, h);
      log.push(`recap: ${r.data?.skipped ? `skipped (${r.data.reason})` : r.data?.title ?? `err: ${r.error}`}`);
    } catch (e) { log.push(`recap: exception ${e}`); }
  }

  console.log('[daily-worker] complete:', log.join(' | '));
};

export { handler };
