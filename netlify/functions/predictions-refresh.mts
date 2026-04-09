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

    log.push(`snapshots: ${totalSnaps} saved, ${totalPreds} predictions stored`);
    console.log('[predictions-refresh] complete:', log.join(' | '));
  } catch (err) {
    console.error('[predictions-refresh] failed:', err);
  }
}

export const config: Config = {
  // 18:00 UTC = 2pm ET — after morning cron, before puck drop
  schedule: '0 18 * * *',
};
