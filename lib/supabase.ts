import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { BYPASS_HEADER, databaseDown, fallbackReady, fetchWithFallback, markDatabaseDown } from './db-fallback';

export { databaseDown } from './db-fallback';

let _anonClient: SupabaseClient | null = null;
let _adminClient: SupabaseClient | null = null;

// Every Supabase request gets a hard timeout. Without one, a saturated database
// made each page render hang until Netlify's 30s limit and return 502 for the
// whole site. With it, the render fails fast; page reads then fall back to the
// last good answer saved in Netlify Blobs (lib/db-fallback.ts).
const DB_TIMEOUT_MS = 12_000;

// An explicit timer, not AbortSignal.timeout(): during `next build` prerenders
// that signal never fired, and a request to a dead database hung past the 60s
// page limit and failed the deploy.
const timedFetch: typeof fetch = (input, init = {}) => {
  const ctrl = new AbortController();
  const signal = init.signal ? AbortSignal.any([init.signal, ctrl.signal]) : ctrl.signal;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      const err = new DOMException(`Database request timed out after ${DB_TIMEOUT_MS / 1000}s`, 'TimeoutError');
      ctrl.abort(err);
      reject(err);
    }, DB_TIMEOUT_MS);
  });
  return Promise.race([fetch(input, { ...init, signal }), timeout]).finally(() => clearTimeout(timer));
};
const fetchWithTimeout: typeof fetch = (input, init = {}) => fetchWithFallback(input, init, timedFetch);

function getClient(): SupabaseClient {
  if (_anonClient) return _anonClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  _anonClient = createClient(url, anonKey, { global: { fetch: fetchWithTimeout } });
  return _anonClient;
}

function getAdminClient(): SupabaseClient {
  if (_adminClient) return _adminClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Missing Supabase admin env vars: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  }
  _adminClient = createClient(url, serviceKey, { auth: { persistSession: false }, global: { fetch: fetchWithTimeout } });
  return _adminClient;
}

export const supabase = {
  get client() { return getClient(); },
  from: (...args: Parameters<SupabaseClient['from']>) => getClient().from(...args),
};

// Uses service role key — bypasses RLS, only call from server-side ingest routes
export const supabaseAdmin = {
  from: (...args: Parameters<SupabaseClient['from']>) => getAdminClient().from(...args),
  rpc: (...args: Parameters<SupabaseClient['rpc']>) => getAdminClient().rpc(...args),
};

// ISR pages call this first. If the database doesn't answer a 1-row read within
// 4s (3 tries), page reads switch to the saved answers for 30s and the page
// renders from them. Only when nothing was ever saved does this throw, so
// Next.js keeps serving the last good cached page instead of caching one full
// of empty sections (supabase-js returns errors as values, so without this,
// pages render "successfully" with no data).
let _dbOkUntil = 0;
function timeoutSignal(ms: number): AbortSignal {
  const ctrl = new AbortController();
  setTimeout(() => ctrl.abort(new DOMException('Probe timed out', 'TimeoutError')), ms);
  return ctrl.signal;
}
export async function assertDatabaseUp(): Promise<void> {
  if (Date.now() < _dbOkUntil) return;
  if (!databaseDown()) {
    // Up to 3 probes: a single slow response (common on the free tier, and during
    // builds that prerender many pages at once) must not fail a page or a deploy.
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt) await new Promise(r => setTimeout(r, attempt * 500));
      const { error } = await getAdminClient()
        .from('games')
        .select('id')
        .limit(1)
        .setHeader(BYPASS_HEADER, '1')
        .abortSignal(timeoutSignal(4_000));
      if (!error) {
        _dbOkUntil = Date.now() + 30_000;
        return;
      }
    }
    markDatabaseDown();
  }
  if (await fallbackReady()) return;
  // A deploy must never depend on the database: prerender with empty sections
  // (reads fail fast while it's marked down); ISR refills them on the first visit.
  if (process.env.NEXT_PHASE === 'phase-production-build') return;
  throw new Error('Database unavailable');
}
