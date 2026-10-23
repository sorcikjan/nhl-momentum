import { createHash } from 'node:crypto';
import { getStore, type Store } from '@netlify/blobs';
import { after } from 'next/server';
import { workAsyncStorage } from 'next/dist/server/app-render/work-async-storage.external';
import { SITE_URL } from './site';

// The last good answer to every database read a page makes, kept in Netlify
// Blobs. The ISR cache can't carry an outage on its own: every deploy empties
// it, so a deploy followed by a database outage (2026-10-23) left nothing to
// serve and the whole site returned 500. Blobs survive deploys.
//
// Page renders only. Pipeline routes (/api/*) and writes always talk to the
// database directly: stale input to a write would corrupt data.

const STORE = 'db-last-good';
// Re-save a query's answer at most this often per server instance.
const SAVE_EVERY_MS = 10 * 60_000;
// After a failed read, skip the database for this long: pages render from
// saved answers in milliseconds instead of waiting out a timeout per query.
const DOWN_FOR_MS = 30_000;
// Requests carrying this header (the health probe) bypass the fallback.
export const BYPASS_HEADER = 'x-db-direct';

let downUntil = 0;
const savedAt = new Map<string, number>();
let store: Store | null | undefined;
let blobsOffUntil = 0;
// No store call may hold up a render: a slow or hanging Blobs call counts as
// "no saved copy", and this instance stops using the store for 5 minutes.
const BLOBS_TIMEOUT_MS = 1_500;
const BLOBS_OFF_MS = 5 * 60_000;
let markedReady = false;
const READY_KEY = 'meta/ready';

export function databaseDown(): boolean {
  return Date.now() < downUntil;
}

export function markDatabaseDown(): void {
  downUntil = Date.now() + DOWN_FOR_MS;
}

function timed<T>(op: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    op,
    new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        blobsOffUntil = Date.now() + BLOBS_OFF_MS;
        reject(new Error('Blobs timed out'));
      }, BLOBS_TIMEOUT_MS);
    }),
  ]).finally(() => clearTimeout(timer));
}

function blobs(): Store | null {
  if (Date.now() < blobsOffUntil) return null;
  if (store !== undefined) return store;
  try {
    store = getStore({ name: STORE, consistency: 'eventual' });
  } catch {
    store = null; // not on Netlify (local dev, tests)
  }
  return store;
}

function inPageRender(): boolean {
  try {
    const route = workAsyncStorage.getStore()?.route;
    return !!route && !route.startsWith('/api');
  } catch {
    return false;
  }
}

// Exact timestamps (e.g. "since now − 3 days") change on every call; one key
// per query shape keeps the last good answer findable. Dates stay as they are.
const ISO_TIME = /\d{4}-\d{2}-\d{2}T\d{2}(%3A|:)\d{2}(%3A|:)\d{2}(\.\d+)?(Z|%2B00(%3A|:)?00|\+00:?00)?/g;

export function fallbackKey(url: string, headers?: HeadersInit, method = 'GET'): string {
  const u = new URL(url);
  const h = new Headers(headers);
  const shape = [method, u.pathname, u.search.replace(ISO_TIME, 'T'), h.get('accept') ?? '', h.get('prefer') ?? ''].join('|');
  const table = u.pathname.split('/').pop() || 'root';
  return `${table}/${createHash('sha256').update(shape).digest('hex').slice(0, 32)}`;
}

type Saved = { body: string; headers: Record<string, string> };

async function load(key: string): Promise<Response | null> {
  try {
    const s = blobs();
    const saved = s ? (await timed(s.get(key, { type: 'json' }))) as Saved | null : null;
    return saved ? new Response(saved.body, { status: 200, headers: { ...saved.headers, 'x-db-fallback': '1' } }) : null;
  } catch {
    return null;
  }
}

function save(key: string, res: Response): void {
  const s = blobs();
  if (!s || Date.now() - (savedAt.get(key) ?? 0) < SAVE_EVERY_MS) return;
  savedAt.set(key, Date.now());
  const headers: Record<string, string> = {};
  for (const name of ['content-type', 'content-range']) {
    const v = res.headers.get(name);
    if (v) headers[name] = v;
  }
  const job = res.text()
    .then(body => timed(s.setJSON(key, { body, headers } satisfies Saved)))
    .then(() => { if (!markedReady) return timed(s.set(READY_KEY, new Date().toISOString())).then(() => { markedReady = true; }); })
    .catch(() => {});
  try { after(job); } catch { /* outside a request: let it run */ }
}

// Pages rendered while the database failed are cached with gaps and the
// "data delayed" notice — for up to 6 h (player pages). A render that had to
// fall back leaves a mark; once the database answers again, healDegradedPages()
// revalidates everything through /api/revalidate, as a pipeline run does.
const DEGRADED_KEY = 'meta/degraded';
let degradedNotedAt = 0;
let healCheckedAt = 0;

function noteDegraded(): void {
  const s = blobs();
  if (!s || Date.now() - degradedNotedAt < 30_000) return;
  degradedNotedAt = Date.now();
  const job = timed(s.set(DEGRADED_KEY, new Date().toISOString())).catch(() => {});
  try { after(job); } catch { /* outside a request: let it run */ }
}

// Called when the database answers (assertDatabaseUp); checks at most once a
// minute per instance. A mark under a minute old is left for the next check,
// so a degraded render still in flight isn't cached after the revalidation.
export function healDegradedPages(): void {
  const s = blobs();
  const key = process.env.INGEST_API_KEY;
  if (!s || !key || process.env.NEXT_PHASE === 'phase-production-build') return;
  if (Date.now() - healCheckedAt < 60_000) return;
  healCheckedAt = Date.now();
  const job = (async () => {
    const mark = await timed(s.get(DEGRADED_KEY, { type: 'text' }));
    if (mark == null || Date.now() - Date.parse(mark) < 60_000) return;
    await timed(s.delete(DEGRADED_KEY));
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15_000);
    await fetch(`${process.env.URL || SITE_URL}/api/revalidate`, { method: 'POST', headers: { 'x-api-key': key }, signal: ctrl.signal })
      .finally(() => clearTimeout(timer));
  })().catch(() => {});
  try { after(job); } catch { /* outside a request: let it run */ }
}

const unavailable = () => new Response(JSON.stringify({ message: 'Database unavailable', code: 'DB_DOWN' }), {
  status: 503, headers: { 'content-type': 'application/json' },
});

// Wraps the Supabase client's fetch. Reads during a page render are saved when
// they succeed and answered from the saved copy when the database fails.
export async function fetchWithFallback(
  input: RequestInfo | URL,
  init: RequestInit,
  doFetch: typeof fetch,
): Promise<Response> {
  const method = (init.method ?? 'GET').toUpperCase();
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  const headers = new Headers(init.headers);
  if (headers.has(BYPASS_HEADER)) {
    headers.delete(BYPASS_HEADER);
    return doFetch(input, { ...init, headers });
  }
  // HEAD: row counts (`{ count: 'exact', head: true }`), answered by Content-Range.
  if ((method !== 'GET' && method !== 'HEAD') || !url.includes('/rest/v1/') || !inPageRender()) return doFetch(input, init);
  const key = fallbackKey(url, init.headers, method);
  if (databaseDown()) {
    noteDegraded();
    return (await load(key)) ?? unavailable();
  }
  try {
    const res = await doFetch(input, init);
    // Gateway errors mean the database is unreachable: stop asking for a while.
    // A plain 500 is one statement failing (e.g. its timeout): that query only.
    if (res.status >= 502) {
      markDatabaseDown();
      noteDegraded();
      return (await load(key)) ?? res;
    }
    if (res.status === 500) {
      noteDegraded();
      return (await load(key)) ?? res;
    }
    if (res.ok) save(key, res.clone());
    return res;
  } catch (err) {
    markDatabaseDown();
    noteDegraded();
    const saved = await load(key);
    if (saved) return saved;
    throw err;
  }
}

// One result for every server instance. Heavy page reads (rankings, league
// averages) are built at most once per `ttlMs` site-wide, instead of once per
// cold instance (each crawler hit on one rebuilt them from ~2,000 rows). If the
// build fails, the last result is returned, however old.
export async function sharedResult<T>(key: string, ttlMs: number, build: () => Promise<T>): Promise<T> {
  const s = blobs();
  if (!s) return build();
  const k = `shared/${key}`;
  type Hit = { at: number; value: T };
  let hit: Hit | null = null;
  try {
    hit = (await timed(s.get(k, { type: 'json' }))) as Hit | null;
    if (hit && Date.now() - hit.at < ttlMs) return hit.value;
  } catch { /* store unreachable: build it */ }
  let value: T;
  try {
    value = await build();
  } catch (err) {
    if (hit) return (hit as Hit).value;
    throw err;
  }
  const job = timed(s.setJSON(k, { at: Date.now(), value })).catch(() => {});
  try { after(job); } catch { /* outside a request: let it run */ }
  return value;
}

// For /api/debug/blobs: is the store reachable from this function, and how fast?
export async function blobsHealth() {
  const t0 = Date.now();
  const s = blobs();
  if (!s) return { store: false, offForMs: Math.max(0, blobsOffUntil - Date.now()) };
  const result: Record<string, unknown> = { store: true };
  for (const [name, op] of [
    ['set', () => s.set('meta/health', new Date().toISOString())],
    ['get', () => s.get('meta/health')],
    ['ready', () => s.get(READY_KEY)],
  ] as const) {
    const t = Date.now();
    try {
      const value = await timed(op() as Promise<unknown>);
      result[name] = { ok: true, ms: Date.now() - t, value };
    } catch (e) {
      result[name] = { ok: false, ms: Date.now() - t, error: String(e) };
    }
  }
  result.totalMs = Date.now() - t0;
  return result;
}

// True when saved answers can be read (on Netlify, once anything was saved).
export async function fallbackReady(): Promise<boolean> {
  try {
    const s = blobs();
    return s ? (await timed(s.get(READY_KEY))) != null : false;
  } catch {
    return false;
  }
}
