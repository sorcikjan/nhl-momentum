import type { Config } from '@netlify/functions';

// Daily pipeline — runs every morning at 08:00 UTC (after all NHL games have ended).
//
// Sequence:
//   1. outcomes  — record yesterday's final scores + auto-energy for players who played
//   2. gamelogs  — fetch individual player TOI/stats from NHL API (paginated)
//   3. metrics   — recalculate PPM snapshots for all active players (paginated)
//   4. snapshots — energy refresh + build today's predictions
//   5. energy    — full sweep: all active players corrected (skip-unchanged optimised)
//
// Each step is isolated in its own try/catch so a failure in one step
// never prevents subsequent steps from running.

const FETCH_TIMEOUT_MS = 25_000; // 25s per ingest call

async function fetchWithTimeout(url: string, headers: Record<string, string>): Promise<Response> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { headers, signal: ac.signal });
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler() {
  const base = process.env.URL ?? 'https://nhl-momentum.netlify.app';
  const ingestKey = process.env.INGEST_API_KEY ?? '';
  const headers = { 'x-api-key': ingestKey };
  const log: string[] = [];

  // 0. Backfill — retroactively generate predictions for the past 2 days
  try {
    const r = await fetchWithTimeout(`${base}/api/ingest/predictions-backfill?days=2`, headers);
    const backfill = await r.json();
    log.push(`backfill: ${backfill.data?.total_predictions ?? `error: ${backfill.error}`} predictions from past 2 days`);
  } catch (err) {
    log.push(`backfill: exception — ${err}`);
  }

  // 1. Outcomes
  try {
    const r = await fetchWithTimeout(`${base}/api/ingest/daily?phase=outcomes`, headers);
    const outcomes = await r.json();
    log.push(`outcomes: ${outcomes.data?.outcomes_recorded ?? `error: ${outcomes.error}`} recorded`);
  } catch (err) {
    log.push(`outcomes: exception — ${err}`);
  }

  // 2. Gamelogs (paginated — loop until no players returned)
  try {
    let glOffset = 0, glSkaterRows = 0, glGoalieRows = 0;
    for (;;) {
      const r = await fetchWithTimeout(`${base}/api/ingest/gamelogs?offset=${glOffset}&limit=50`, headers);
      const gl = await r.json();
      if (gl.error) { log.push(`gamelogs error at offset ${glOffset}: ${gl.error}`); break; }
      glSkaterRows += gl.data?.skaterRows ?? 0;
      glGoalieRows += gl.data?.goalieRows ?? 0;
      if ((gl.data?.playersProcessed ?? 0) < 50) break; // last page
      glOffset += 50;
      if (glOffset > 2000) break; // safety cap
    }
    log.push(`gamelogs: ${glSkaterRows} skater rows, ${glGoalieRows} goalie rows`);
  } catch (err) {
    log.push(`gamelogs: exception — ${err}`);
  }

  // 3. Metrics (paginated — loop until no snapshots inserted)
  try {
    let mOffset = 0, mTotal = 0;
    for (;;) {
      const r = await fetchWithTimeout(`${base}/api/ingest/metrics?offset=${mOffset}&limit=100`, headers);
      const m = await r.json();
      if (m.error) { log.push(`metrics error at offset ${mOffset}: ${m.error}`); break; }
      const inserted = m.data?.snapshotsInserted ?? 0;
      mTotal += inserted;
      if (inserted === 0) break;
      mOffset += 100;
      if (mOffset > 2000) break; // safety cap
    }
    log.push(`metrics: ${mTotal} snapshots inserted`);
  } catch (err) {
    log.push(`metrics: exception — ${err}`);
  }

  // 4. Snapshots + predictions (paginated — 2 games per call to stay within 10s limit)
  try {
    let snapOffset = 0, totalSnaps = 0, totalPreds = 0;
    for (;;) {
      const r = await fetchWithTimeout(`${base}/api/ingest/daily?phase=snapshots&game_offset=${snapOffset}&game_limit=2`, headers);
      const snaps = await r.json();
      if (snaps.error) { log.push(`snapshots error at offset ${snapOffset}: ${snaps.error}`); break; }
      totalSnaps += snaps.data?.snapshots_saved ?? 0;
      totalPreds += snaps.data?.predictions_stored ?? 0;
      if (!snaps.data?.has_more) break;
      snapOffset += 2;
      if (snapOffset > 50) break; // safety cap
    }
    log.push(`snapshots: ${totalSnaps} saved, ${totalPreds} predictions stored`);
  } catch (err) {
    log.push(`snapshots: exception — ${err}`);
  }

  // 5. Full energy sweep for all active players
  try {
    const r = await fetchWithTimeout(`${base}/api/ingest/daily?phase=energy`, headers);
    const energy = await r.json();
    log.push(`energy: ${energy.data?.energy_updated ?? `error: ${energy.error}`} updated`);
  } catch (err) {
    log.push(`energy: exception — ${err}`);
  }

  console.log('[daily-pipeline] complete:', log.join(' | '));
}

export const config: Config = {
  // 08:00 UTC daily — west coast late games (01:00 ET) are done well before this
  schedule: '0 8 * * *',
};
