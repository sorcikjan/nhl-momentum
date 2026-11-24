import type { Config } from '@netlify/functions';

// Hourly snapshot of the database's memory, swap, disk and heaviest queries,
// kept in Netlify Blobs for /api/debug/load (lib/load-log.ts). One cheap read
// of the metrics endpoint and pg_stat_statements an hour.
export default async function handler() {
  const base = process.env.INTERNAL_URL ?? 'https://nhl-momentum.netlify.app';
  try {
    const res = await fetch(`${base}/api/debug/load`, {
      method: 'POST',
      headers: { 'x-api-key': process.env.INGEST_API_KEY ?? '' },
      signal: AbortSignal.timeout(28_000),
    });
    console.log('[load-snapshot]', res.status, await res.text());
  } catch (e) {
    console.error('[load-snapshot] failed:', e);
  }
}

export const config: Config = { schedule: '5 * * * *' };
