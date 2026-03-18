import { createClient, SupabaseClient } from '@supabase/supabase-js';

function getClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return createClient(url, anonKey);
}

// Single client — tables have no RLS so anon key has full access
export const supabase = {
  get client() { return getClient(); },
  from: (...args: Parameters<SupabaseClient['from']>) => getClient().from(...args),
};

export const supabaseAdmin = {
  from: (...args: Parameters<SupabaseClient['from']>) => getClient().from(...args),
};
