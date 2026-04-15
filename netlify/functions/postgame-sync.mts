import type { Config } from '@netlify/functions';

// Post-game sync — fires at 06:30 UTC (2:30 AM ET), after all games end.
// Runs gamelogs + metrics + snapshots so player data is fresh by morning.
// The full pipeline (daily-pipeline.mts) runs at 08:00 UTC and handles
// outcomes, energy, and the rest — this is a lightweight pre-run.

export default async function handler() {
  const base = process.env.URL ?? 'https://nhl-momentum.netlify.app';
  const ingestKey = process.env.INGEST_API_KEY ?? '';

  const res = await fetch(`${base}/.netlify/functions/daily-worker-background`, {
    method: 'POST',
    headers: { 'x-api-key': ingestKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ phases: ['gamelogs', 'metrics', 'snapshots', 'energy'] }),
  });

  console.log('[postgame-sync] triggered background worker, status:', res.status);
}

export const config: Config = {
  schedule: '30 6 * * *',
};
