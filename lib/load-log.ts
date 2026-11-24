// Where the database load comes from, hour by hour, so code changes rest on
// data (2026-11-24: the free instance kept running out of Disk IO and memory).
//
// Two sources, both kept in Netlify Blobs (never in the database they measure):
// - every Supabase request the app makes, counted per route and table by each
//   server instance and flushed every 5 min (recordDbRequest, recordEvent);
// - once an hour, the database's own numbers: memory, swap and disk from the
//   Supabase metrics endpoint plus pg_stat_statements (takeLoadSnapshot).
// /api/debug/load reads both back (loadReport).

import { getStore, type Store } from '@netlify/blobs';
import { after } from 'next/server';
import { workAsyncStorage } from 'next/dist/server/app-render/work-async-storage.external';

const STORE = 'load-log';
const FLUSH_MS = 5 * 60_000;
const BLOBS_MS = 5_000;

type Counter = { n: number; ms: number; bytes: number; errors: number; slow: number };
type Bucket = Record<string, Counter>;

const instance = Math.random().toString(36).slice(2, 8);
let seq = 0;
let bucket: Bucket = {};
let since = Date.now();

function store(): Store | null {
  try { return getStore({ name: STORE, consistency: 'eventual' }); } catch { return null; }
}

function within<T>(op: Promise<T>, ms = BLOBS_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    op,
    new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Blobs timed out')), ms); }),
  ]).finally(() => clearTimeout(timer));
}

const hourKey = (t: number) => new Date(t).toISOString().slice(0, 13); // 2026-11-24T14

function currentRoute(): string {
  try { return workAsyncStorage.getStore()?.route ?? 'other'; } catch { return 'other'; }
}

function bump(key: string, ms: number, bytes: number, error: boolean) {
  const c = (bucket[key] ??= { n: 0, ms: 0, bytes: 0, errors: 0, slow: 0 });
  c.n++; c.ms += ms; c.bytes += bytes;
  if (error) c.errors++;
  if (ms > 2_000) c.slow++;
  maybeFlush();
}

// One request that reached the database (not one answered from the Blobs copy).
export function recordDbRequest(url: string, ms: number, status: number, bytes: number) {
  const m = url.match(/\/rest\/v1\/([^?]+)/);
  const table = m ? m[1] : 'other';
  bump(`db ${currentRoute()} ${table}`, ms, bytes, status >= 500 || status === 0);
}

// Anything else worth counting: "rankings build", "db answered from cache"...
export function recordEvent(name: string, ms = 0) {
  bump(`event ${name} ${currentRoute()}`, ms, 0, false);
}

function maybeFlush() {
  if (Date.now() - since < FLUSH_MS) return;
  const out = bucket, from = since;
  bucket = {}; since = Date.now();
  const s = store();
  if (!s) return;
  const job = within(s.setJSON(`req/${hourKey(from)}/${instance}-${seq++}`, { from, to: since, counts: out })).catch(() => {});
  try { after(job); } catch { /* outside a request: let it run */ }
}

// ─── Hourly snapshot of the database itself ──────────────────────────────────

const METRICS = [
  'node_memory_MemAvailable_bytes', 'node_memory_MemTotal_bytes',
  'node_memory_SwapFree_bytes', 'node_memory_SwapTotal_bytes',
  'node_vmstat_pswpin', 'node_vmstat_pswpout',
  'node_disk_read_bytes_total', 'node_disk_written_bytes_total', 'node_disk_io_time_seconds_total',
  'pg_stat_database_blks_read_total', 'pg_stat_database_blks_hit_total', 'pg_stat_database_xact_commit_total',
  'node_load1',
];

export function parseMetrics(text: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const line of text.split('\n')) {
    if (!line || line.startsWith('#')) continue;
    const m = line.match(/^([a-zA-Z_:][\w:]*)(?:\{[^}]*\})?\s+(\S+)/);
    if (!m || !METRICS.includes(m[1])) continue;
    const v = Number(m[2]);
    if (Number.isFinite(v)) out[m[1]] = (out[m[1]] ?? 0) + v; // summed over devices
  }
  return out;
}

type Query = { query: string; calls: number; total_ms: number; disk_blocks_read: number; cache_blocks_hit: number };
export type Snapshot = { at: number; metrics: Record<string, number> | null; queries: Query[] | null; errors: string[] };

export async function takeLoadSnapshot(): Promise<Snapshot> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  const errors: string[] = [];
  const [metrics, queries] = await Promise.all([
    fetch(`${url}/customer/v1/privileged/metrics`, {
      headers: { Authorization: `Basic ${Buffer.from(`service_role:${key}`).toString('base64')}` },
      signal: AbortSignal.timeout(20_000), cache: 'no-store',
    }).then(async r => r.ok ? parseMetrics(await r.text()) : (errors.push(`metrics HTTP ${r.status}`), null))
      .catch(e => (errors.push(`metrics ${e}`), null)),
    fetch(`${url}/rest/v1/rpc/db_diagnostics`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: '{}', signal: AbortSignal.timeout(20_000), cache: 'no-store',
    }).then(async r => r.ok ? ((await r.json()).top_disk_queries as Query[]) : (errors.push(`diagnostics HTTP ${r.status}`), null))
      .catch(e => (errors.push(`diagnostics ${e}`), null)),
  ]);
  const snap: Snapshot = {
    at: Date.now(),
    metrics,
    queries: queries?.map(q => ({ query: q.query.slice(0, 400), calls: q.calls, total_ms: q.total_ms, disk_blocks_read: q.disk_blocks_read, cache_blocks_hit: q.cache_blocks_hit })) ?? null,
    errors,
  };
  const s = store();
  if (s) await within(s.setJSON(`snap/${hourKey(snap.at)}`, snap), 10_000).catch(e => errors.push(`save ${e}`));
  return snap;
}

// ─── Report ──────────────────────────────────────────────────────────────────

const COUNTERS = ['node_vmstat_pswpin', 'node_vmstat_pswpout', 'node_disk_read_bytes_total', 'node_disk_written_bytes_total',
  'node_disk_io_time_seconds_total', 'pg_stat_database_blks_read_total', 'pg_stat_database_blks_hit_total', 'pg_stat_database_xact_commit_total'];

export function snapshotDelta(prev: Snapshot | null, cur: Snapshot) {
  const m = cur.metrics ?? {};
  const p = prev?.metrics ?? null;
  const MB = 1024 * 1024;
  const d = (k: string) => (p && m[k] !== undefined && p[k] !== undefined && m[k] >= p[k] ? m[k] - p[k] : null);
  const mb = (v: number | null | undefined, f = 1) => (v == null ? null : Math.round((v * f) / MB));
  const db = {
    memAvailableMB: mb(m.node_memory_MemAvailable_bytes),
    swapUsedMB: mb(m.node_memory_SwapTotal_bytes != null && m.node_memory_SwapFree_bytes != null ? m.node_memory_SwapTotal_bytes - m.node_memory_SwapFree_bytes : null),
    swapInMB: mb(d('node_vmstat_pswpin'), 4096), swapOutMB: mb(d('node_vmstat_pswpout'), 4096),
    diskReadMB: mb(d('node_disk_read_bytes_total')), diskWrittenMB: mb(d('node_disk_written_bytes_total')),
    diskBusySec: d('node_disk_io_time_seconds_total'), load1: m.node_load1 ?? null,
    commits: d('pg_stat_database_xact_commit_total'),
  };
  // pg_stat_statements: per query, what this hour added (whole value after a reset).
  const before = new Map((prev?.queries ?? []).map(q => [q.query, q]));
  const queries = (cur.queries ?? []).map(q => {
    const b = before.get(q.query);
    const reset = !b || q.calls < b.calls;
    return {
      query: q.query.replace(/\s+/g, ' ').slice(0, 160),
      calls: reset ? q.calls : q.calls - b!.calls,
      totalSec: Math.round((reset ? q.total_ms : q.total_ms - b!.total_ms) / 1000),
      sinceReset: reset,
    };
  }).filter(q => q.calls > 0).sort((a, b) => b.totalSec - a.totalSec).slice(0, 8);
  return { db, queries };
}

export async function loadReport(hours: number) {
  const s = store();
  if (!s) return { error: 'Blobs store unavailable' };
  const now = Date.now();
  const keys = Array.from({ length: hours + 1 }, (_, i) => hourKey(now - (hours - i) * 3_600_000));
  const report = [];
  let prev: Snapshot | null = null;
  for (const h of keys) {
    const snap = (await within(s.get(`snap/${h}`, { type: 'json' })).catch(() => null)) as Snapshot | null;
    const { blobs } = await within(s.list({ prefix: `req/${h}/` })).catch(() => ({ blobs: [] as { key: string }[] }));
    const app: Bucket = {};
    for (const b of blobs) {
      const part = (await within(s.get(b.key, { type: 'json' })).catch(() => null)) as { counts: Bucket } | null;
      for (const [k, c] of Object.entries(part?.counts ?? {})) {
        const t = (app[k] ??= { n: 0, ms: 0, bytes: 0, errors: 0, slow: 0 });
        t.n += c.n; t.ms += c.ms; t.bytes += c.bytes; t.errors += c.errors; t.slow += c.slow;
      }
    }
    const top = Object.entries(app).sort((a, b) => b[1].ms - a[1].ms).slice(0, 15)
      .map(([k, c]) => ({ key: k, n: c.n, sec: Math.round(c.ms / 1000), kB: Math.round(c.bytes / 1024), errors: c.errors, slow: c.slow }));
    const totals = Object.entries(app).filter(([k]) => k.startsWith('db ')).reduce(
      (t, [, c]) => ({ requests: t.requests + c.n, sec: t.sec + Math.round(c.ms / 1000), errors: t.errors + c.errors }),
      { requests: 0, sec: 0, errors: 0 });
    report.push({ hour: h, app: { totals, top }, ...(snap ? snapshotDelta(prev, snap) : { db: null, queries: [] }), snapshotErrors: snap?.errors ?? [] });
    if (snap) prev = snap;
  }
  return { hours: report };
}
