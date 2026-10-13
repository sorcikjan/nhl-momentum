import type { Config } from '@netlify/functions';

// Pipeline health check — fires at 10:30 UTC (after the overnight/morning runs)
// and 20:30 UTC (before puck drop).
//
// Hits /api/pipeline-health, maps failing checks to the worker phases that repair
// them and triggers one background run, and posts the issues to ALERT_WEBHOOK_URL
// (Slack/Discord) when set. Also visible in Netlify function logs.

import { call, alert } from '../lib/pipeline';

export default async function handler() {
  const base      = process.env.URL ?? 'https://nhl-momentum.netlify.app';
  const ingestKey = process.env.INGEST_API_KEY ?? '';
  const h = { 'x-api-key': ingestKey };

  // call() retries — a single cold-start timeout shouldn't read as "pipeline down".
  const result = await call(`${base}/api/pipeline-health?key=${ingestKey}`, {}, { timeoutMs: 30_000 });
  if (result.ok === undefined) {
    console.error('[pipeline-health-cron] FAILED to reach health endpoint:', result.error);
    await alert('health check', [`health endpoint unreachable: ${result.error}`]);
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

  if (issues.some(i => i.startsWith('DATABASE'))) {
    // Nothing to self-heal against a dead database — just alert.
    await alert('health check', issues);
    return;
  }

  // Self-heal: map failing checks to the worker phases that repair them, and run
  // them in one background invocation (rosters first — everything keys off team_id).
  const heal = new Set<string>();
  if (issues.some(i => /^(ROSTERS|GAMELOGS|GOALIE DATA)/.test(i))) ['rosters', 'gamelogs', 'metrics', 'energy'].forEach(p => heal.add(p));
  if (issues.some(i => i.startsWith('SNAPSHOTS'))) heal.add('metrics');
  if (issues.some(i => i.startsWith('ENERGY'))) heal.add('energy');
  if (issues.some(i => i.startsWith('PREDICTIONS'))) heal.add('snapshots');
  if (issues.some(i => i.startsWith('OUTCOMES'))) heal.add('outcomes-backfill');
  if (issues.some(i => i.startsWith('RECAPS: no recap for yesterday'))) heal.add('recap');

  const order = ['rosters', 'outcomes-backfill', 'gamelogs', 'metrics', 'snapshots', 'energy', 'recap'];
  const phases = order.filter(p => heal.has(p));
  if (phases.length) {
    console.log('[pipeline-health-cron] auto-fix: running phases', phases.join(','));
    // Plain fetch: background functions answer 202 with an empty body, which
    // call() would treat as a failure and retry (triggering the worker twice).
    try {
      const res = await fetch(`${base}/.netlify/functions/daily-worker-background`, {
        method: 'POST',
        headers: { ...h, 'Content-Type': 'application/json' },
        body: JSON.stringify({ phases }),
      });
      console.log('[pipeline-health-cron] auto-fix: worker triggered, status', res.status);
    } catch (err) {
      console.error('[pipeline-health-cron] auto-fix: failed to trigger worker:', err);
    }
  }

  if (!ok) {
    await alert('health check', [
      ...issues,
      phases.length ? `auto-fix triggered: ${phases.join(', ')} — re-check in ~15 min` : 'no auto-fix available',
    ]);
  }
}

export const config: Config = {
  // 10:30 UTC: after the overnight/morning runs. 20:30 UTC: before puck drop, so
  // missing predictions or stale player data get fixed before fans arrive.
  schedule: '30 10,20 * * *',
};
