import type { Config } from '@netlify/functions';

// Daily pipeline — runs every morning at 08:00 UTC (after all NHL games have ended).
//
// Sequence:
//   1. outcomes  — record yesterday's final scores + auto-energy for players who played
//   2. gamelogs  — fetch individual player TOI/stats from NHL API (paginated)
//   3. metrics   — recalculate PPM snapshots for all active players (paginated)
//   4. snapshots — energy refresh + build today's predictions
//   5. energy    — full sweep: all active players corrected (skip-unchanged optimised)

export default async function handler() {
  const base = process.env.URL ?? 'https://nhl-momentum.netlify.app';
  const ingestKey = process.env.INGEST_API_KEY ?? '';
  const headers = { 'x-api-key': ingestKey };
  const log: string[] = [];

  try {
    // 0. Backfill — retroactively generate predictions for the past 2 days
    //    in case yesterday's pipeline failed or games were missed.
    const backfill = await fetch(`${base}/api/ingest/predictions-backfill?days=2`, { headers }).then(r => r.json());
    log.push(`backfill: ${backfill.data?.total_predictions ?? `error: ${backfill.error}`} predictions from past 2 days`);

    // 1. Outcomes
    const outcomes = await fetch(`${base}/api/ingest/daily?phase=outcomes`, { headers }).then(r => r.json());
    log.push(`outcomes: ${outcomes.data?.outcomes_recorded ?? `error: ${outcomes.error}`} recorded`);

    // 2. Gamelogs (paginated — loop until no players returned)
    let glOffset = 0, glSkaterRows = 0, glGoalieRows = 0;
    for (;;) {
      const gl = await fetch(`${base}/api/ingest/gamelogs?offset=${glOffset}&limit=50`, { headers }).then(r => r.json());
      if (gl.error || (!gl.data?.skaterRows && glOffset > 0)) break;
      glSkaterRows += gl.data?.skaterRows ?? 0;
      glGoalieRows += gl.data?.goalieRows ?? 0;
      // gamelogs returns rows written; if less than limit players were processed we're done
      if ((gl.data?.skaterRows ?? 0) === 0 && (gl.data?.goalieRows ?? 0) === 0) break;
      glOffset += 50;
      if (glOffset > 2000) break; // safety cap
    }
    log.push(`gamelogs: ${glSkaterRows} skater rows, ${glGoalieRows} goalie rows`);

    // 3. Metrics (paginated — loop until no snapshots inserted)
    let mOffset = 0, mTotal = 0;
    for (;;) {
      const m = await fetch(`${base}/api/ingest/metrics?offset=${mOffset}&limit=100`, { headers }).then(r => r.json());
      const inserted = m.data?.snapshotsInserted ?? 0;
      mTotal += inserted;
      if (inserted === 0) break;
      mOffset += 100;
      if (mOffset > 2000) break; // safety cap
    }
    log.push(`metrics: ${mTotal} snapshots inserted`);

    // 4. Snapshots + predictions (paginated — 2 games per call to stay within 10s limit)
    let snapOffset = 0, totalSnaps = 0, totalPreds = 0;
    for (;;) {
      const snaps = await fetch(`${base}/api/ingest/daily?phase=snapshots&game_offset=${snapOffset}&game_limit=2`, { headers }).then(r => r.json());
      if (snaps.error) { log.push(`snapshots error at offset ${snapOffset}: ${snaps.error}`); break; }
      totalSnaps += snaps.data?.snapshots_saved ?? 0;
      totalPreds += snaps.data?.predictions_stored ?? 0;
      if (!snaps.data?.has_more) break;
      snapOffset += 2;
      if (snapOffset > 50) break; // safety cap
    }
    log.push(`snapshots: ${totalSnaps} saved, ${totalPreds} predictions stored`);

    // 5. Full energy sweep for all active players
    const energy = await fetch(`${base}/api/ingest/daily?phase=energy`, { headers }).then(r => r.json());
    log.push(`energy: ${energy.data?.energy_updated ?? `error: ${energy.error}`} updated`);

    console.log('[daily-pipeline] complete:', log.join(' | '));
  } catch (err) {
    console.error('[daily-pipeline] failed:', err, '| completed steps:', log.join(' | '));
  }
}

export const config: Config = {
  // 08:00 UTC daily — west coast late games (01:00 ET) are done well before this
  schedule: '0 8 * * *',
};
