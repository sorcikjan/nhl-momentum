import type { Config } from '@netlify/functions';

// Post-game sync — fires at 06:30 UTC (2:30 AM ET), after all games end.
// Gamelogs runs FIRST so game_player_stats is populated before outcomes writes
// the game into the games table — prevents false scratch badges from the race
// condition where a game exists but player stats haven't been ingested yet.
// The full pipeline (daily-pipeline.mts) runs at 08:00 UTC as a second pass.

export default async function handler() {
  const base = process.env.URL ?? 'https://nhl-momentum.netlify.app';
  const ingestKey = process.env.INGEST_API_KEY ?? '';

  const res = await fetch(`${base}/.netlify/functions/daily-worker-background`, {
    method: 'POST',
    headers: { 'x-api-key': ingestKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ phases: ['gamelogs', 'outcomes', 'metrics', 'snapshots', 'energy', 'extras'] }),
  });

  console.log('[postgame-sync] triggered background worker, status:', res.status);
}

export const config: Config = {
  schedule: '30 6 * * *',
};
