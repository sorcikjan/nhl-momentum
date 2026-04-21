import type { Config } from '@netlify/functions';

// Dedicated recap cron — fires at 09:30 UTC daily (90 min after daily-pipeline).
// This is a safety net: if the main pipeline's recap phase failed (Gemini issue,
// background worker timeout, etc.), this retries it independently.
// The recap route skips generation if a fresh recap already exists (< 12h old),
// so running this when recap already succeeded is a no-op.

export default async function handler() {
  const base = process.env.URL ?? 'https://nhl-momentum.netlify.app';
  const ingestKey = process.env.INGEST_API_KEY ?? '';

  // Yesterday in UTC — same date the games were played
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  const res = await fetch(`${base}/api/ingest/recap?date=${yesterday}`, {
    headers: { 'x-api-key': ingestKey },
  });

  const body = await res.json().catch(() => ({}));
  console.log('[recap-cron] date:', yesterday, 'result:', JSON.stringify(body));
}

export const config: Config = {
  schedule: '30 9 * * *',
};
