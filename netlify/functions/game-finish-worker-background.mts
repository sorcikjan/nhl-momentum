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
//   0. record-games     — write final scores to games table (enables outcomes-backfill)
//   1. gamelogs         — ingest player stats for finished teams only (~40–50 players)
//   2. outcomes-backfill — score predictions from DB scores (immune to NHL API cache)
//   3. metrics          — full recalculation so global rankings stay correct
//   4. energy           — update energy bars
//   5. extras           — three stars + highlights for the just-finished games

const CALL_TIMEOUT_MS = 25_000;
const GAMELOGS_TIMEOUT_MS = 120_000;

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

async function post(url: string, headers: Record<string, string>, body: unknown, timeoutMs = CALL_TIMEOUT_MS) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ac.signal,
    });
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
  console.log('[game-finish-worker] start — games:', gameIds.join(','), 'teams:', teamIds.join(','));

  // 0. Gamelogs FIRST — targeted to just the finished teams (40–50 players vs 200+).
  //    Must run before record-games so the game is not yet FINAL in our DB.
  //    The poller's "already processed" check reads game_state from the games table:
  //    if we write FINAL first and gamelogs fails (NHL API delay — data often unavailable
  //    for 15–30 min post-game), the poller will never retry gamelogs for this game.
  //    By running gamelogs first, a 0-row result keeps the game out of our DB as FINAL,
  //    so the poller retries on its next 15-min tick until stats are actually available.
  let gamelogRowsFetched = 0;
  if (teamIds.length > 0) {
    try {
      const r = await call(`${base}/api/ingest/gamelogs?teamIds=${teamIds.join(',')}`, h, GAMELOGS_TIMEOUT_MS);
      gamelogRowsFetched = (r.data?.skaterRows ?? 0) + (r.data?.goalieRows ?? 0);
      const warn = (r.data?.rateLimited ?? 0) > 0 ? ` (${r.data.rateLimited} rate-limited)` : '';
      log.push(`gamelogs: ${gamelogRowsFetched} rows for teams [${teamIds.join(',')}]${warn}${r.error ? ` err: ${r.error}` : ''}`);
    } catch (e) { log.push(`gamelogs: exception ${e}`); }
  }

  // NHL API delay guard: if gamelogs returned 0 rows and all games finished within the
  // last 90 minutes, the API likely hasn't published the game log yet. Skip record-games
  // so the poller retries on its next 15-min tick instead of permanently ignoring this game.
  const oldestGameStartMs = (gameRecords as Array<{ start_time_utc?: string | null; game_date?: string }>)
    .map(g => g.start_time_utc ? new Date(g.start_time_utc).getTime() : new Date(`${g.game_date}T20:00:00Z`).getTime())
    .reduce((min, t) => Math.min(min, t), Infinity);
  const gameAgeMs = Date.now() - oldestGameStartMs;
  const TYPICAL_GAME_DURATION_MS = 2.5 * 3_600_000; // 2h30m
  const NHL_API_PUBLISH_DELAY_MS = 30 * 60_000;     // 30 min post-game
  const tooSoonForApiData = gamelogRowsFetched === 0 && teamIds.length > 0
    && gameAgeMs < TYPICAL_GAME_DURATION_MS + NHL_API_PUBLISH_DELAY_MS;

  if (tooSoonForApiData) {
    console.log('[game-finish-worker] gamelogs returned 0 rows — NHL API likely not ready yet, skipping record-games so poller retries');
    log.push('record-games: skipped — waiting for NHL API to publish game log');
    console.log('[game-finish-worker] complete (early exit):', log.join(' | '));
    return;
  }

  // 1. Write final game scores to games table.
  //    Critical: outcomes-backfill reads from games WHERE game_state IN ('FINAL','OFF').
  //    Runs after gamelogs so a successful gamelogs ingestion is confirmed before the
  //    poller considers this game "done".
  if (gameRecords.length > 0) {
    try {
      const r = await post(`${base}/api/ingest/record-games`, h, { games: gameRecords });
      log.push(`record-games: ${r.data?.upserted ?? 0} upserted${r.error ? ` err: ${r.error}` : ''}`);
    } catch (e) { log.push(`record-games: exception ${e}`); }
  }

  // 2. Outcomes backfill — DB-based, immune to NHL API cache. Now that games table
  //    has the final scores (step 1), this will find and score the predictions.
  try {
    const r = await call(`${base}/api/ingest/outcomes-backfill?limit=100`, h);
    log.push(`outcomes-backfill: ${r.data?.outcomes_upserted ?? 0} upserted across ${r.data?.games_processed ?? 0} games${r.error ? ` err: ${r.error}` : ''}`);
  } catch (e) { log.push(`outcomes-backfill: exception ${e}`); }

  // 3. Metrics — full recalculation so global rankings remain correct.
  //    Must include all players — partial ranking would skew momentum_rank for everyone.
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

  // 4. Snapshots + predictions — regenerate for any upcoming games with fresh player data
  try {
    let offset = 0, snaps = 0, preds = 0;
    for (;;) {
      const r = await call(`${base}/api/ingest/daily?phase=snapshots&game_offset=${offset}&game_limit=2`, h);
      if (r.error) break;
      snaps += r.data?.snapshots_saved ?? 0;
      preds += r.data?.predictions_stored ?? 0;
      if (!r.data?.has_more) break;
      offset += 2;
      if (offset > 50) break;
    }
    log.push(`snapshots: ${snaps} saved, ${preds} predictions`);
  } catch (e) { log.push(`snapshots: exception ${e}`); }

  // 5. Energy — full sweep (fast — reads existing snapshots, no NHL API calls)
  try {
    const r = await call(`${base}/api/ingest/daily?phase=energy`, h);
    log.push(`energy: ${r.data?.energy_updated ?? `err: ${r.error}`} updated`);
  } catch (e) { log.push(`energy: exception ${e}`); }

  // 6. Extras — three stars + highlights for the just-finished games
  try {
    const r = await call(`${base}/api/ingest/game-extras?days=2&limit=20`, h);
    log.push(`extras: ${r.data?.updated ?? 0} games updated, ${r.data?.youtubeFound ?? 0} YouTube highlights${r.error ? ` err: ${r.error}` : ''}`);
  } catch (e) { log.push(`extras: exception ${e}`); }

  // Bust the ISR cache so the homepage shows fresh data immediately,
  // without waiting for the next visitor to accidentally trigger a revalidation.
  try {
    await fetch(`${base}/api/revalidate`, {
      method: 'POST',
      headers: { 'x-api-key': ingestKey },
    });
    log.push('revalidate: ok');
  } catch (e) { log.push(`revalidate: exception ${e}`); }

  console.log('[game-finish-worker] complete:', log.join(' | '));
};

export { handler };
