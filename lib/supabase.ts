import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _anonClient: SupabaseClient | null = null;
let _adminClient: SupabaseClient | null = null;

// Every Supabase request gets a hard timeout. Without one, a saturated database
// made each page render hang until Netlify's 30s limit and return 502 for the
// whole site. With it, the render fails fast, and Next.js ISR keeps serving the
// last good cached page (stale data beats an error page).
const DB_TIMEOUT_MS = 12_000;

const fetchWithTimeout: typeof fetch = (input, init = {}) => {
  const timeout = AbortSignal.timeout(DB_TIMEOUT_MS);
  const signal = init.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
  return fetch(input, { ...init, signal });
};

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
// 4s, the render throws — and Next.js keeps serving the last good cached page
// instead of caching one full of empty sections (supabase-js returns errors as
// values, so without this, pages render "successfully" with no data).
let _dbOkUntil = 0;
export async function assertDatabaseUp(): Promise<void> {
  if (Date.now() < _dbOkUntil) return;
  const { error } = await getAdminClient()
    .from('games')
    .select('id')
    .limit(1)
    .abortSignal(AbortSignal.timeout(4_000));
  if (error) throw new Error(`Database unavailable: ${error.message || error.code || 'timeout'}`);
  _dbOkUntil = Date.now() + 30_000;
}
