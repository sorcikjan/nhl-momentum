import type { Config } from '@netlify/functions';

// Early morning sync — fires at 05:00 UTC (7:00 AM CEST).
// Refreshes gamelogs + outcomes for East/Central games that ended 3–5h ago.
// West Coast late games (ending ~04:30 UTC) are caught by postgame-sync at 06:30 UTC.
// This run is for homepage/rankings freshness — game pages get live stats from the
// NHL boxscore API directly, so they don't depend on this pipeline for game-time data.

export default async function handler() {
  const base = process.env.URL ?? 'https://nhl-momentum.netlify.app';
  const ingestKey = process.env.INGEST_API_KEY ?? '';

  const res = await fetch(`${base}/.netlify/functions/daily-worker-background`, {
    method: 'POST',
    headers: { 'x-api-key': ingestKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ phases: ['gamelogs', 'outcomes', 'outcomes-backfill', 'metrics', 'energy'] }),
  });

  console.log('[early-morning-sync] triggered background worker, status:', res.status);
}

export const config: Config = {
  schedule: '0 5 * * *',
};
