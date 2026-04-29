import type { Config } from '@netlify/functions';

// Mid-morning sync — fires at 10:00 UTC (6:00 AM ET).
// Third gamelogs pass to catch late NHL API publishing — playoff game stats
// can take 3–5 hours after game end to appear in the NHL API. This ensures
// any games that finished after midnight ET are captured before users wake up.
// Also includes recap as a third safety net (after 08:00 daily-pipeline and
// 09:30 recap-cron). The recap route skips if a fresh recap already exists.

export default async function handler() {
  const base = process.env.URL ?? 'https://nhl-momentum.netlify.app';
  const ingestKey = process.env.INGEST_API_KEY ?? '';

  const res = await fetch(`${base}/.netlify/functions/daily-worker-background`, {
    method: 'POST',
    headers: { 'x-api-key': ingestKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ phases: ['gamelogs', 'metrics', 'snapshots', 'recap'] }),
  });

  console.log('[midmorning-sync] triggered background worker, status:', res.status);
}

export const config: Config = {
  schedule: '0 10 * * *',
};
