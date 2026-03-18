import { createClient, SupabaseClient } from '@supabase/supabase-js';

function getClient(key: 'anon' | 'service'): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey) {
    throw new Error('Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return createClient(url, key === 'service' ? (serviceKey ?? anonKey) : anonKey);
}

// Public client — safe for browser use
export const supabase = {
  get client() { return getClient('anon'); },
  from: (...args: Parameters<SupabaseClient['from']>) => getClient('anon').from(...args),
};

// Service client — server-side only, bypasses RLS
export const supabaseAdmin = {
  from: (...args: Parameters<SupabaseClient['from']>) => getClient('service').from(...args),
};
