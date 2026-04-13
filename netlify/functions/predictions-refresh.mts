import type { Config } from '@netlify/functions';

// Predictions refresh — runs at 18:00 UTC (2pm ET) to catch any games that
// were not yet in FUT/PRE state when the 08:00 UTC daily cron ran.
// Only builds snapshots + predictions; skips gamelogs/metrics/energy.

export default async function handler() {
  const base = process.env.URL ?? 'https://nhl-momentum.netlify.app';
  const ingestKey = process.env.INGEST_API_KEY ?? '';
  const headers = { 'x-api-key': ingestKey };
  const log: string[] = [];

  try {
    // Today's games
    let snapOffset = 0, totalSnaps = 0, totalPreds = 0;
    for (;;) {
      const snaps = await fetch(
        `${base}/api/ingest/daily?phase=snapshots&game_offset=${snapOffset}&game_limit=2`,
        { headers }
      ).then(r => r.json());

      if (snaps.error) {
        log.push(`error at offset ${snapOffset}: ${snaps.error}`);
        break;
      }
      totalSnaps += snaps.data?.snapshots_saved ?? 0;
      totalPreds += snaps.data?.predictions_stored ?? 0;
      if (!snaps.data?.has_more) break;
      snapOffset += 2;
      if (snapOffset > 50) break; // safety cap
    }

    log.push(`today: ${totalSnaps} snapshots, ${totalPreds} predictions`);

    // Tomorrow's games — look-ahead so predictions are ready before users view them
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    let tSnapOffset = 0, tTotalSnaps = 0, tTotalPreds = 0;
    for (;;) {
      const snaps = await fetch(
        `${base}/api/ingest/daily?phase=snapshots&date=${tomorrow}&game_offset=${tSnapOffset}&game_limit=2`,
        { headers }
      ).then(r => r.json());

      if (snaps.error) {
        log.push(`tomorrow error at offset ${tSnapOffset}: ${snaps.error}`);
        break;
      }
      tTotalSnaps += snaps.data?.snapshots_saved ?? 0;
      tTotalPreds += snaps.data?.predictions_stored ?? 0;
      if (!snaps.data?.has_more) break;
      tSnapOffset += 2;
      if (tSnapOffset > 50) break; // safety cap
    }

    log.push(`tomorrow (${tomorrow}): ${tTotalSnaps} snapshots, ${tTotalPreds} predictions`);
    console.log('[predictions-refresh] complete:', log.join(' | '));
  } catch (err) {
    console.error('[predictions-refresh] failed:', err);
  }
}

export const config: Config = {
  // 18:00 UTC = 2pm ET — after morning cron, before puck drop
  schedule: '0 18 * * *',
};
