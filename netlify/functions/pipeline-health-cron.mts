import type { Config } from '@netlify/functions';

// Daily pipeline health check — fires at 10:30 UTC, after:
//   08:00 UTC — daily-pipeline (main ingest)
//   09:30 UTC — recap-cron (safety net)
//
// Hits /api/pipeline-health and logs a structured pass/fail report.
// Results are visible in Netlify function logs (Functions tab → pipeline-health-cron).
//
// If ok=false, the issues[] array names the exact broken phase so you know
// which manual re-run curl to fire:
//   gamelogs missing  → /api/ingest/gamelogs?since=YYYY-MM-DD
//   snapshots stale   → /api/ingest/metrics
//   predictions missing → /api/ingest/daily?phase=snapshots
//   outcomes missing  → /api/ingest/outcomes-backfill
//   recap missing     → /api/ingest/recap?date=YYYY-MM-DD&force=1

export default async function handler() {
  const base      = process.env.URL ?? 'https://nhl-momentum.netlify.app';
  const ingestKey = process.env.INGEST_API_KEY ?? '';

  let result: Record<string, unknown> = {};
  try {
    const res = await fetch(`${base}/api/pipeline-health?key=${ingestKey}`, {
      headers: { 'Cache-Control': 'no-store' },
    });
    result = await res.json() as Record<string, unknown>;
  } catch (err) {
    console.error('[pipeline-health-cron] FAILED to reach health endpoint:', err);
    return;
  }

  const ok     = result.ok as boolean;
  const issues = (result.issues as string[]) ?? [];
  const checks = (result.checks as Record<string, unknown>) ?? {};

  if (ok) {
    console.log('[pipeline-health-cron] ✅ ALL CHECKS PASSED');
  } else {
    console.error('[pipeline-health-cron] ❌ PIPELINE ISSUES DETECTED');
    for (const issue of issues) {
      console.error(`  • ${issue}`);
    }
  }

  // Structured summary for log parsing / dashboards
  console.log('[pipeline-health-cron] summary:', JSON.stringify({
    ok,
    issueCount: issues.length,
    freshness: checks.freshness,
    games:       (checks.games      as Record<string, unknown>)?.finalLast3Days,
    gamelogs:    (checks.gamelogs   as Record<string, unknown>)?.gamesMissingStats,
    snapshots:   `${(checks.snapshots  as Record<string, unknown>)?.withFreshSnapshot} fresh / ${(checks.snapshots as Record<string, unknown>)?.staleSnapshots} stale`,
    predictions: `${(checks.predictions as Record<string, unknown>)?.withActiveModelPrediction} predicted`,
    outcomes:    (checks.outcomes   as Record<string, unknown>)?.missingOutcomes,
    energy:      (checks.energy     as Record<string, unknown>)?.playersWithEnergy,
    recaps:      (checks.recaps     as Record<string, unknown>)?.newest,
  }));
}

export const config: Config = {
  schedule: '30 10 * * *',
};
