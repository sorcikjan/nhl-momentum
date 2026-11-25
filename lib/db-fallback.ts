import { createHash } from 'node:crypto';
import { getStore, type Store } from '@netlify/blobs';
import { after } from 'next/server';
import { workAsyncStorage } from 'next/dist/server/app-render/work-async-storage.external';
import { SITE_URL } from './site';
import { recordEvent } from './load-log';

// The last good answer to every database read a page makes, kept in Netlify
// Blobs. The ISR cache can't carry an outage on its own: every deploy empties
// it, so a deploy followed by a database outage (2026-10-23) left nothing to
// serve and the whole site returned 500. Blobs survive deploys.
//
// The saved answer is also the first choice while it's fresh: saved after the
// pipeline's last write (the generation /api/revalidate stamps) and under
// FRESH_MS old. The free-tier instance runs at its memory limit with ~400 MB
// in swap (Nov 2026) and fell over daily under page renders and crawlers, so a
// query reaches the database about once per pipeline run, not once per render.
//
// Page renders only. Pipeline routes (/api/*) and writes always talk to the
// database directly: stale input to a write would corrupt data.

const STORE = 'db-last-good';
// Writers that don't call /api/revalidate show up within this long.
export const FRESH_MS = 30 * 60_000;
const GENERATION_KEY = 'meta/generation';
// After a failed read, skip the database for this long: pages render from
// saved answers in milliseconds instead of waiting out a timeout per query.
// (2 min with a single probe was tried on 2026-11-25: right after a deploy the
// busy database looked down and uncached pages without a saved answer 500'd.)
const DOWN_FOR_MS = 30_000;
// Requests carrying this header (the health probe) bypass the fallback.
export const BYPASS_HEADER = 'x-db-direct';

let downUntil = 0;
let store: null | undefined; // null = not on Netlify
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
        recordEvent('blobs timeout, store off 5 min');
        blobsOffUntil = Date.now() + BLOBS_OFF_MS;
        reject(new Error('Blobs timed out'));
      }, BLOBS_TIMEOUT_MS);
    }),
  ]).finally(() => clearTimeout(timer));
}

// A store carries the access token of the request that created it, and that
// token expires while a warm instance lives on ("Failed to decode token: Token
// expired"), so every call gets a fresh one. Only "not on Netlify" is remembered.
function blobs(): Store | null {
  if (Date.now() < blobsOffUntil) return null;
  if (store === null) return null;
  try {
    return getStore({ name: STORE, consistency: 'eventual' });
  } catch {
    store = null; // not on Netlify (local dev, tests)
    return null;
  }
}

export function inPageRender(): boolean {
  try {
    const route = workAsyncStorage.getStore()?.route;
    return !!route && !route.startsWith('/api');
  } catch {
    return false;
  }
}

// When the pipeline last wrote: read once per render, strongly consistent, so a
// page re-rendered right after /api/revalidate never caches answers from before.
const renderGeneration = new WeakMap<object, Promise<number>>();
function generation(): Promise<number> {
  const read = async () => {
    const s = blobs();
    const at = s ? await timed(s.get(GENERATION_KEY, { type: 'text', consistency: 'strong' })) : null;
    return at ? Date.parse(at) : 0;
  };
  let work: object | undefined;
  try { work = workAsyncStorage.getStore(); } catch { /* outside a request */ }
  if (!work) return read();
  let g = renderGeneration.get(work);
  if (!g) renderGeneration.set(work, g = read());
  return g;
}

// /api/revalidate: the pipeline wrote, every saved answer is now stale.
export async function bumpGeneration(): Promise<void> {
  const s = blobs();
  if (s) await timed(s.set(GENERATION_KEY, new Date().toISOString()));
}

async function isFresh(saved: Saved | null): Promise<boolean> {
  if (!saved?.at || Date.now() - saved.at >= FRESH_MS) return false;
  try {
    return saved.at > await generation();
  } catch {
    return false; // can't tell: ask the database
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

// `at`: when it was read from the database (copies saved before Nov 2026 lack it).
type Saved = { body: string; headers: Record<string, string>; at?: number };

async function load(key: string): Promise<Saved | null> {
  try {
    const s = blobs();
    return s ? (await timed(s.get(key, { type: 'json' }))) as Saved | null : null;
  } catch {
    return null;
  }
}

const answer = (saved: Saved | null, header: string): Response | null =>
  saved ? new Response(saved.body, { status: 200, headers: { ...saved.headers, [header]: '1' } }) : null;

function save(key: string, res: Response): void {
  const s = blobs();
  if (!s) return;
  const at = Date.now();
  const headers: Record<string, string> = {};
  for (const name of ['content-type', 'content-range']) {
    const v = res.headers.get(name);
    if (v) headers[name] = v;
  }
  const job = res.text()
    .then(body => timed(s.setJSON(key, { body, headers, at } satisfies Saved)))
    .then(() => { if (!markedReady) return timed(s.set(READY_KEY, new Date().toISOString())).then(() => { markedReady = true; }); })
    .catch(() => {});
  try { after(job); } catch { /* outside a request: let it run */ }
}

// Pages rendered while the database failed are cached with gaps and the
// "data delayed" notice — until the next revalidation (a week, player pages). A render that had to
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
    // Everything: degraded pages can be any page, and they show gaps. Once per outage.
    await fetch(`${process.env.URL || SITE_URL}/api/revalidate`, { method: 'POST', headers: { 'x-api-key': key, 'Content-Type': 'application/json' }, body: JSON.stringify({ scope: 'full' }), signal: ctrl.signal })
      .finally(() => clearTimeout(timer));
  })().catch(() => {});
  try { after(job); } catch { /* outside a request: let it run */ }
}

const unavailable = () => new Response(JSON.stringify({ message: 'Database unavailable', code: 'DB_DOWN' }), {
  status: 503, headers: { 'content-type': 'application/json' },
});

// Wraps the Supabase client's fetch. Reads during a page render are answered
// from the saved copy while it's fresh, saved when the database answers, and
// answered from the saved copy, however old, when the database fails.
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
  const saved = await load(key);
  if (databaseDown()) {
    noteDegraded();
    return answer(saved, 'x-db-fallback') ?? unavailable();
  }
  if (await isFresh(saved)) return answer(saved, 'x-db-cache')!;
  try {
    const res = await doFetch(input, init);
    // Gateway errors mean the database is unreachable: stop asking for a while.
    // A plain 500 is one statement failing (e.g. its timeout): that query only.
    if (res.status >= 502) {
      markDatabaseDown();
      noteDegraded();
      return answer(saved, 'x-db-fallback') ?? res;
    }
    if (res.status === 500) {
      noteDegraded();
      return answer(saved, 'x-db-fallback') ?? res;
    }
    if (res.ok) save(key, res.clone());
    return res;
  } catch (err) {
    markDatabaseDown();
    noteDegraded();
    const fallback = answer(saved, 'x-db-fallback');
    if (fallback) return fallback;
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

// Results computed when their data changes, not when a page asks.
//
// sharedResult() rebuilt rankings every 3 min whatever happened: ~2,300 builds
// in the 4 days to 2026-11-24, while the data behind them changed ~60 times,
// and those builds were 75% of the database's query time (pg_stat_statements).
// The free instance ran out of Disk IO and fell over. Now /api/revalidate, which
// every pipeline run and finished game calls, rebuilds and saves the result
// (saveComputed), and pages only read it (computedResult).
//
// A page builds only when there's no saved result at all, or the saved one is
// older than maxAgeMs (the writer failed): it builds once and saves it, so the
// next instances read it again. If the store can't be reached, an instance keeps
// serving what it last read, however old, rather than building.
const COMPUTED_RECHECK_MS = 60_000;
type Computed<T> = { at: number; value: T };
const computedMem = new Map<string, { at: number; value: unknown; checked: number }>();
const computedInFlight = new Map<string, Promise<unknown>>();

// Not through blobs()/timed(): the store often answers slower than their 1.5 s
// and is then switched off for 5 min, but one read a minute per instance can
// wait a little longer, and the write in /api/revalidate is what matters most.
const COMPUTED_READ_MS = 4_000;
const COMPUTED_WRITE_MS = 10_000;

function computedStore(): Store | null {
  if (store === null) return null;
  try {
    return getStore({ name: STORE, consistency: 'strong' });
  } catch {
    return null;
  }
}

function within<T>(op: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    op,
    new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error(`Blobs took over ${ms} ms`)), ms); }),
  ]).finally(() => clearTimeout(timer));
}

async function readComputed<T>(k: string): Promise<Computed<T> | null | 'unreachable'> {
  const s = computedStore();
  if (!s) return 'unreachable';
  try {
    return ((await within(s.get(k, { type: 'json' }), COMPUTED_READ_MS)) as Computed<T> | null) ?? null;
  } catch {
    return 'unreachable';
  }
}

export async function saveComputed<T>(key: string, value: T): Promise<void> {
  const at = Date.now();
  computedMem.set(key, { at, value, checked: at });
  const s = computedStore();
  if (!s) throw new Error('Blobs store unavailable');
  await within(s.setJSON(`computed/${key}`, { at, value }), COMPUTED_WRITE_MS);
}

export function computedResult<T>(key: string, maxAgeMs: number, build: () => Promise<T>): Promise<T> {
  const mem = computedMem.get(key);
  if (mem && Date.now() - mem.checked < COMPUTED_RECHECK_MS) return Promise.resolve(mem.value as T);
  const pending = computedInFlight.get(key);
  if (pending) return pending as Promise<T>;
  const job = (async () => {
    const saved = await readComputed<T>(`computed/${key}`);
    const now = Date.now();
    if (saved !== 'unreachable' && saved && now - saved.at < maxAgeMs) {
      computedMem.set(key, { at: saved.at, value: saved.value, checked: now });
      return saved.value;
    }
    if (saved === 'unreachable' && mem) {
      computedMem.set(key, { ...mem, checked: now });
      return mem.value as T;
    }
    try {
      const value = await build();
      if (saved === 'unreachable') computedMem.set(key, { at: now, value, checked: now });
      else await saveComputed(key, value).catch(() => {});
      return value;
    } catch (err) {
      const old = saved !== 'unreachable' && saved ? saved.value : mem?.value;
      if (old !== undefined) return old as T;
      throw err;
    }
  })().finally(() => computedInFlight.delete(key));
  computedInFlight.set(key, job);
  return job;
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
