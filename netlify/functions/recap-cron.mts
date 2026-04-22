import type { Config } from '@netlify/functions';

// Dedicated recap cron — fires at 09:30 UTC daily (90 min after daily-pipeline).
// This is a safety net: if the main pipeline's recap phase failed (Gemini issue,
// background worker timeout, etc.), this retries it independently.
// The recap route skips generation if a fresh recap already exists (< 12h old),
// so running this when recap already succeeded is a no-op.
//
// IMPORTANT: calls the background worker (not the recap API directly).
// Gemini generation takes 30–50s — a sync Netlify function (26s limit) would
// always timeout before receiving the response. The background worker has 15 min.

export default async function handler() {
  const base = process.env.URL ?? 'https://nhl-momentum.netlify.app';
  const ingestKey = process.env.INGEST_API_KEY ?? '';

  const res = await fetch(`${base}/.netlify/functions/daily-worker-background`, {
    method: 'POST',
    headers: { 'x-api-key': ingestKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ phases: ['recap'] }),
  });

  console.log('[recap-cron] triggered background worker, status:', res.status);
}

export const config: Config = {
  schedule: '30 9 * * *',
};
