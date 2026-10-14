import type { BackgroundHandler } from '@netlify/functions';

// Event-driven background worker — triggered by game-finished-poller when games
// transition to FINAL in the NHL API but haven't been processed in our DB yet.
//
// POST body JSON: { gameIds, teamIds, gameRecords }
//   gameIds     — just-finished NHL game IDs
//   teamIds     — home + away team IDs (for targeted gamelogs)
//   gameRecords — full game data from the NHL API (scores, teams, state)
//                 written to games table as step 0 so outcomes-backfill can find them
//
// Pipeline order:
//   0. stats            — box-score reconciliation: add unknown players, fetch game logs
//                         only for players missing a stat row for these games
//   1. record-games     — write final scores to games table (enables outcomes-backfill)
//   2. outcomes-backfill — score predictions from DB scores (immune to NHL API cache)
//   3. metrics          — full recalculation so global rankings stay correct
//   4. energy           — update energy bars
//   5. extras           — three stars + highlights for the just-finished games

import { call, paginate, alert, syncMissingStats } from '../lib/pipeline';

const handler: BackgroundHandler = async (event) => {
  const base = process.env.URL ?? 'https://nhl-momentum.netlify.app';
  const ingestKey = process.env.INGEST_API_KEY ?? '';
  const h = { 'x-api-key': ingestKey };

  // Auth
  const key = event.headers['x-api-key'] ?? event.headers['X-Api-Key'] ?? '';
  if (key !== ingestKey) {
    console.error('[game-finish-worker] unauthorized');
    return;
  }

  const body = event.body ? JSON.parse(event.body) : {};
  const teamIds: number[] = body.teamIds ?? [];
  const gameIds: number[] = body.gameIds ?? [];
  const gameRecords: unknown[] = body.gameRecords ?? [];

  if (teamIds.length === 0 && gameIds.length === 0) {
    console.error('[game-finish-worker] called with no teamIds or gameIds — nothing to do');
    return;
  }

  const log: string[] = [];
  const problems: string[] = [];
  console.log('[game-finish-worker] start — games:', gameIds.join(','), 'teams:', teamIds.join(','));

  // 0. Stats FIRST, and only mark the game FINAL in our DB once its stats are in.
  //    The poller's "already processed" check reads game_state from the games table,
  //    so leaving the game un-FINAL makes the poller retry on its next 15-min tick.
  //    Completeness is checked against the box score itself (every skater/goalie who
  //    played has a row) — the old row-count heuristic was fooled by earlier games in
  //    each player's season log, and the old two-team gamelogs call always hit the
  //    26s route limit, so post-game stats never actually landed.
  const stats = gameIds.length > 0
    ? await syncMissingStats(base, h, `ids=${gameIds.join(',')}`)
    : { rows: 0, needed: 0, stillMissing: null, added: [] as string[], errors: ['no gameIds'] };
  log.push(`stats: ${stats.needed} players needed, ${stats.rows} rows, ${stats.stillMissing ?? 'unknown'} still missing${stats.added.length ? `, added: ${stats.added.join('; ')}` : ''}`);
  problems.push(...stats.errors);

  // NHL API delay guard: game logs usually publish 15–30 min after the final horn.
  // While stats are incomplete and the game is young, exit and let the poller retry.
  const oldestGameStartMs = (gameRecords as Array<{ start_time_utc?: string | null; game_date?: string }>)
    .map(g => g.start_time_utc ? new Date(g.start_time_utc).getTime() : new Date(`${g.game_date}T20:00:00Z`).getTime())
    .reduce((min, t) => Math.min(min, t), Infinity);
  const gameAgeMs = Date.now() - oldestGameStartMs;
  const TYPICAL_GAME_DURATION_MS = 2.5 * 3_600_000; // 2h30m
  const NHL_API_PUBLISH_DELAY_MS = 60 * 60_000;     // allow up to 60 min post-game
  const statsIncomplete = stats.stillMissing === null || stats.stillMissing > 0;

  if (statsIncomplete && gameAgeMs < TYPICAL_GAME_DURATION_MS + NHL_API_PUBLISH_DELAY_MS) {
    console.log('[game-finish-worker] stats incomplete — NHL API likely not ready yet, skipping record-games so poller retries');
    console.log('[game-finish-worker] complete (early exit):', log.join(' | '));
    return;
  }
  if (statsIncomplete) {
    // Too old to keep waiting — record the game; the nightly reconciliation retries stats.
    problems.push(`stats still incomplete for games ${gameIds.join(',')} ${Math.round(gameAgeMs / 3_600_000)}h after start`);
  }

  // 1. Write final game scores to games table.
  //    Critical: outcomes-backfill reads from games WHERE game_state IN ('FINAL','OFF').
  if (gameRecords.length > 0) {
    const r = await call(`${base}/api/ingest/record-games`, h, { method: 'POST', body: { games: gameRecords } });
    log.push(`record-games: ${r.data?.upserted ?? 0} upserted${r.error ? ` err: ${r.error}` : ''}`);
  }

  // 2. Outcomes backfill — DB-based, immune to NHL API cache.
  {
    const r = await call(`${base}/api/ingest/outcomes-backfill?limit=100`, h);
    log.push(`outcomes-backfill: ${r.data?.outcomes_upserted ?? 0} upserted across ${r.data?.games_processed ?? 0} games${r.error ? ` err: ${r.error}` : ''}`);
  }

  // 3. Metrics — only the teams that just played (rankings re-rank at query time).
  {
    const teamFilter = teamIds.length ? `&teamIds=${teamIds.join(',')}` : '';
    const res = await paginate(
      offset => call(`${base}/api/ingest/metrics?offset=${offset}&limit=100${teamFilter}`, h),
      { pageSize: 100, maxOffset: 2000, done: p => (p.data?.playersProcessed ?? 0) < 100 },
    );
    const snaps = res.pages.reduce((n, p) => n + (p.data?.snapshotsInserted ?? 0), 0);
    log.push(`metrics: ${snaps} snapshots${res.failedOffsets.length ? ` err: failed offsets ${res.failedOffsets.join(',')}` : ''}`);
  }

  // 4. Snapshots + predictions — regenerate for any upcoming games with fresh player data
  {
    let snaps = 0, preds = 0;
    for (let offset = 0; offset <= 50; offset += 2) {
      const r = await call(`${base}/api/ingest/daily?phase=snapshots&game_offset=${offset}&game_limit=2`, h);
      if (!r.data) { log.push(`snapshots err: ${r.error}`); break; }
      snaps += r.data.snapshots_saved ?? 0;
      preds += r.data.predictions_stored ?? 0;
      if (!r.data.has_more) break;
    }
    log.push(`snapshots: ${snaps} saved, ${preds} predictions`);
  }

  // 5. Energy — full sweep (fast — reads existing snapshots, no NHL API calls)
  {
    const r = await call(`${base}/api/ingest/daily?phase=energy`, h);
    log.push(`energy: ${r.data?.energy_updated ?? `err: ${r.error}`} updated`);
  }

  // 6. Extras — three stars + highlights for the just-finished games
  {
    const r = await call(`${base}/api/ingest/game-extras?days=2&limit=20`, h);
    log.push(`extras: ${r.data?.updated ?? 0} games updated, ${r.data?.youtubeFound ?? 0} YouTube highlights${r.error ? ` err: ${r.error}` : ''}`);
  }

  // Bust the ISR cache so the homepage shows fresh data immediately.
  {
    const r = await call(`${base}/api/revalidate`, h, { method: 'POST', body: {} });
    log.push(r.revalidated ? 'revalidate: ok' : `revalidate err: ${r.error}`);
  }

  console.log('[game-finish-worker] complete:', log.join(' | '));
  problems.push(...log.filter(l => /\berr\b|err:|exception/.test(l)));
  if (problems.length) {
    console.error('[game-finish-worker] problems:', problems.join(' | '));
    await alert(`post-game worker (games ${gameIds.join(',')})`, problems);
  }
};

export { handler };
