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

  // 0. Write final game scores to games table.
  //    Critical: outcomes-backfill reads from games WHERE game_state IN ('FINAL','OFF').
  //    The poller only fires when a game is FINAL in NHL API but NOT yet in our DB,
  //    so without this step outcomes-backfill would find nothing to score.
  if (gameRecords.length > 0) {
    try {
      const r = await post(`${base}/api/ingest/record-games`, h, { games: gameRecords });
      log.push(`record-games: ${r.data?.upserted ?? 0} upserted${r.error ? ` err: ${r.error}` : ''}`);
    } catch (e) { log.push(`record-games: exception ${e}`); }
  }

  // 1. Gamelogs — targeted to just the finished teams (40–50 players vs 200+)
  if (teamIds.length > 0) {
    try {
      const r = await call(`${base}/api/ingest/gamelogs?teamIds=${teamIds.join(',')}`, h, GAMELOGS_TIMEOUT_MS);
      const rows = (r.data?.skaterRows ?? 0) + (r.data?.goalieRows ?? 0);
      const warn = (r.data?.rateLimited ?? 0) > 0 ? ` (${r.data.rateLimited} rate-limited)` : '';
      log.push(`gamelogs: ${rows} rows for teams [${teamIds.join(',')}]${warn}${r.error ? ` err: ${r.error}` : ''}`);
    } catch (e) { log.push(`gamelogs: exception ${e}`); }
  }

  // 2. Outcomes backfill — DB-based, immune to NHL API cache. Now that games table
  //    has the final scores (step 0), this will find and score the predictions.
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

  // 4. Energy — full sweep (fast — reads existing snapshots, no NHL API calls)
  try {
    const r = await call(`${base}/api/ingest/daily?phase=energy`, h);
    log.push(`energy: ${r.data?.energy_updated ?? `err: ${r.error}`} updated`);
  } catch (e) { log.push(`energy: exception ${e}`); }

  // 5. Extras — three stars + highlights for the just-finished games
  try {
    const r = await call(`${base}/api/ingest/game-extras?days=2&limit=20`, h);
    log.push(`extras: ${r.data?.updated ?? 0} games updated, ${r.data?.youtubeFound ?? 0} YouTube highlights${r.error ? ` err: ${r.error}` : ''}`);
  } catch (e) { log.push(`extras: exception ${e}`); }

  console.log('[game-finish-worker] complete:', log.join(' | '));
};

export { handler };
