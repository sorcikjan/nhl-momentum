// Shared helpers for the pipeline workers (daily-worker, game-finish-worker,
// pipeline-health-cron). Lives outside netlify/functions so Netlify doesn't
// deploy it as a function of its own.

export const CALL_TIMEOUT_MS = 30_000;

type Json = { data?: any; error?: string | null; [k: string]: any }; // eslint-disable-line @typescript-eslint/no-explicit-any

// Calls an ingest route and returns its JSON body. Retries on network errors,
// timeouts, 5xx and non-JSON bodies (Netlify returns an HTML 504 page when a route
// overruns its 26s limit) — those are the failures that used to silently end a
// whole phase. 4xx and JSON `error` responses are returned as-is, not retried.
export async function call(
  url: string,
  headers: Record<string, string>,
  opts: { timeoutMs?: number; retries?: number; method?: 'GET' | 'POST'; body?: unknown } = {},
): Promise<Json> {
  const { timeoutMs = CALL_TIMEOUT_MS, retries = 2, method = 'GET', body } = opts;
  let lastError = 'unknown';
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) await new Promise(r => setTimeout(r, 3_000 * attempt));
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method,
        headers: body !== undefined ? { ...headers, 'Content-Type': 'application/json' } : headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: ac.signal,
      });
      const text = await res.text();
      let json: Json | null = null;
      try { json = JSON.parse(text); } catch { /* non-JSON — handled below */ }
      if (json && res.status < 500) return json;
      lastError = `HTTP ${res.status}${json?.error ? ` ${json.error}` : json ? '' : ' (non-JSON response)'}`;
    } catch (err) {
      lastError = String(err);
    } finally {
      clearTimeout(timer);
    }
  }
  return { data: null, error: `${lastError} after ${retries + 1} attempts` };
}

// Offset pagination that survives a bad page. The old loops did
// `if (error) break` / `if (processed < limit) break`, so one transient failure
// silently skipped every remaining player. Here a failed page (after call()'s
// retries) is recorded and skipped; we only give up after 3 failures in a row.
export async function paginate(
  fetchPage: (offset: number) => Promise<Json>,
  opts: {
    pageSize: number; done: (r: Json) => boolean; maxOffset: number;
    // Backpressure: asked before every page; false stops the loop (see waitForDb).
    beforePage?: () => Promise<boolean>;
    // Breathing room for the database between pages.
    pauseMs?: number;
  },
): Promise<{ pages: Json[]; failedOffsets: number[]; stoppedAt: number | null }> {
  const pages: Json[] = [];
  const failedOffsets: number[] = [];
  let consecutiveFailures = 0;
  for (let offset = 0; offset <= opts.maxOffset; offset += opts.pageSize) {
    if (offset > 0 && opts.pauseMs) await sleep(opts.pauseMs);
    if (opts.beforePage && !(await opts.beforePage())) return { pages, failedOffsets, stoppedAt: offset };
    const r = await fetchPage(offset);
    if (r.data == null) {
      failedOffsets.push(offset);
      if (++consecutiveFailures >= 3) break;
      continue;
    }
    consecutiveFailures = 0;
    pages.push(r);
    if (opts.done(r)) break;
  }
  return { pages, failedOffsets, stoppedAt: null };
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ─── Backpressure ────────────────────────────────────────────────────────────
// The free Supabase instance falls over when a burst of pipeline work meets the
// steady page traffic: on 26 and 27 Nov 2026 it died about 50 minutes into the
// 05:00 full recalculation, both on nights with nothing new to compute. Heavy
// phases now ask before each batch and wait while the database is slow; if it
// stays slow they stop, and the next run or the health check picks up the rest.
// Better a late number than a dead site.
export const SLOW_DB_MS = 1500;

// One row from a tiny table: how long the database takes to answer anything.
// null = no answer (down or timed out).
export async function dbProbeMs(timeoutMs = 10_000): Promise<number | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return 0; // can't measure: don't block the pipeline
  const t = Date.now();
  try {
    const res = await fetch(`${url}/rest/v1/teams?select=id&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(timeoutMs),
    });
    await res.text();
    return res.ok ? Date.now() - t : null;
  } catch {
    return null;
  }
}

// True once the database answers faster than slowMs; false if it hasn't within
// maxWaitMs (the background function has 15 minutes in all).
export async function waitForDb(opts: { maxWaitMs?: number; slowMs?: number; pollMs?: number } = {}): Promise<boolean> {
  const { maxWaitMs = 120_000, slowMs = SLOW_DB_MS, pollMs = 20_000 } = opts;
  const until = Date.now() + maxWaitMs;
  for (;;) {
    const ms = await dbProbeMs();
    if (ms != null && ms < slowMs) return true;
    if (Date.now() + pollMs > until) return false;
    await sleep(pollMs);
  }
}

// Teams that played on a given ET date (the NHL schedule, no database).
// null when the schedule can't be read.
export async function teamsThatPlayed(etDate: string): Promise<number[] | null> {
  try {
    const res = await fetch(`https://api-web.nhle.com/v1/schedule/${etDate}`, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return null;
    const day = (await res.json())?.gameWeek?.find((d: { date?: string }) => d.date === etDate);
    if (!day) return [];
    const ids = new Set<number>();
    for (const g of day.games ?? []) {
      if (g.homeTeam?.id) ids.add(g.homeTeam.id);
      if (g.awayTeam?.id) ids.add(g.awayTeam.id);
    }
    return [...ids];
  } catch {
    return null;
  }
}

// The ET calendar date `daysAgo` days before now (NHL game dates are ET).
export function etDate(daysAgo: number, now = Date.now()): string {
  return new Date(now - daysAgo * 86_400_000).toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
}

// Optional alerting: set ALERT_WEBHOOK_URL (Slack or Discord incoming webhook) in
// Netlify env vars. Without it, failures only appear in function logs.
export async function alert(source: string, lines: string[]): Promise<void> {
  const url = process.env.ALERT_WEBHOOK_URL;
  if (!url || lines.length === 0) return;
  const text = `⚠️ Hockey Momentum — ${source}\n${lines.map(l => `• ${l}`).join('\n')}`.slice(0, 1900);
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, content: text }), // Slack reads `text`, Discord reads `content`
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    console.error(`[alert] webhook failed: ${err}`);
  }
}

// Box-score driven stat sync: ask boxscore-players which (game, player) stat rows
// are missing, fetch game logs for exactly those players, then re-check.
// `query` is "ids=<gameIds>" or "since=YYYY-MM-DD".
// stillMissing === null means the reconciliation call itself failed.
export async function syncMissingStats(
  base: string,
  headers: Record<string, string>,
  query: string,
): Promise<{ rows: number; needed: number; stillMissing: number | null; added: string[]; errors: string[] }> {
  const errors: string[] = [];
  const first = await call(`${base}/api/ingest/boxscore-players?${query}`, headers, { timeoutMs: 60_000 });
  if (!first.data) {
    return { rows: 0, needed: 0, stillMissing: null, added: [], errors: [`boxscore-players: ${first.error}`] };
  }
  const need: number[] = first.data.needStats ?? [];
  const added: string[] = first.data.added ?? [];
  let rows = 0;
  for (let i = 0; i < need.length; i += 15) {
    const r = await call(`${base}/api/ingest/gamelogs?playerIds=${need.slice(i, i + 15).join(',')}`, headers, { timeoutMs: 60_000 });
    if (!r.data) { errors.push(`gamelogs batch ${i / 15 + 1}: ${r.error}`); continue; }
    rows += (r.data.skaterRows ?? 0) + (r.data.goalieRows ?? 0);
  }
  if (need.length === 0) return { rows, needed: 0, stillMissing: 0, added, errors };

  const after = await call(`${base}/api/ingest/boxscore-players?${query}`, headers, { timeoutMs: 60_000 });
  const stillMissing = after.data ? (after.data.needStats ?? []).length : null;
  if (!after.data) errors.push(`boxscore-players recheck: ${after.error}`);
  return { rows, needed: need.length, stillMissing, added, errors };
}
