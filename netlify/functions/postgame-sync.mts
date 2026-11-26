import type { Config } from '@netlify/functions';

// Post-game sync — fires at 06:30 UTC (2:30 AM ET), after all games end.
// Gamelogs runs FIRST so game_player_stats is populated before outcomes writes
// the game into the games table — prevents false scratch badges from the race
// condition where a game exists but player stats haven't been ingested yet.
//
// Light on purpose (2026-11-26): it only records stats and results. Players'
// metrics are recalculated per team as each game ends (game-finish worker) and
// for everyone once a day at 08:00 (daily-pipeline.mts). Running the full
// recalculation at 05:00, 06:30, 08:00 and 10:00 is what took the free
// database down on the morning of 2026-11-26.

export default async function handler() {
  const base = process.env.INTERNAL_URL ?? 'https://nhl-momentum.netlify.app';
  const ingestKey = process.env.INGEST_API_KEY ?? '';

  const res = await fetch(`${base}/.netlify/functions/daily-worker-background`, {
    method: 'POST',
    headers: { 'x-api-key': ingestKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ phases: ['gamelogs', 'outcomes', 'outcomes-backfill'] }),
  });

  console.log('[postgame-sync] triggered background worker, status:', res.status);
}

export const config: Config = {
  schedule: '30 6 * * *',
};
