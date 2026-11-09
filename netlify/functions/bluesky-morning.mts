import type { Config } from '@netlify/functions';

// Morning card on Bluesky — 13:00 UTC, morning in the US and afternoon in Europe,
// after the morning pipeline and the 10:30 health check have settled the data.
// The route picks the card (rotation by weekday) and skips if it already posted
// today. No retries here: a timed-out call may still have posted.

import { alert } from '../lib/pipeline';

export default async function handler() {
  const base = process.env.INTERNAL_URL ?? 'https://nhl-momentum.netlify.app';
  try {
    const res = await fetch(`${base}/api/social/bluesky`, {
      method: 'POST',
      headers: { 'x-api-key': process.env.INGEST_API_KEY ?? '' },
      signal: AbortSignal.timeout(25_000),
    });
    const body = await res.json().catch(() => ({}));
    console.log('[bluesky-morning]', res.status, JSON.stringify(body));
    if (!res.ok) await alert('bluesky', [`morning post failed: HTTP ${res.status} ${body.error ?? ''}`]);
  } catch (err) {
    console.error('[bluesky-morning] call failed:', err);
  }
}

export const config: Config = {
  schedule: '0 13 * * *',
};
