import type { Config } from '@netlify/functions';

// Scheduled trigger — fires at 18:00 UTC daily.
// Triggers the background worker for snapshots + backfill only (no gamelogs/metrics/energy).
// This function completes in <1 second, well within Netlify's 26s sync limit.

export default async function handler() {
  const base = process.env.URL ?? 'https://nhl-momentum.netlify.app';
  const ingestKey = process.env.INGEST_API_KEY ?? '';

  const res = await fetch(`${base}/.netlify/functions/daily-worker-background`, {
    method: 'POST',
    headers: { 'x-api-key': ingestKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ phases: ['backfill', 'snapshots', 'odds'] }),
  });

  console.log('[predictions-refresh] triggered background worker, status:', res.status);
}

export const config: Config = {
  schedule: '0 18 * * *',
};
