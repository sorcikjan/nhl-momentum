import type { Config } from '@netlify/functions';

// Scheduled trigger — fires at 08:00 UTC daily.
// Just POSTs to the background worker which has a 15-minute timeout.
// This function completes in <1 second, well within Netlify's 26s sync limit.

export default async function handler() {
  const base = process.env.URL ?? 'https://nhl-momentum.netlify.app';
  const ingestKey = process.env.INGEST_API_KEY ?? '';

  const res = await fetch(`${base}/.netlify/functions/daily-worker-background`, {
    method: 'POST',
    headers: { 'x-api-key': ingestKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ phases: ['backfill', 'gamelogs', 'outcomes', 'outcomes-backfill', 'metrics', 'snapshots', 'odds', 'energy', 'extras', 'recap'] }),
  });

  console.log('[daily-pipeline] triggered background worker, status:', res.status);
}

export const config: Config = {
  schedule: '0 8 * * *',
};
