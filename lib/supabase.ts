import { createClient, SupabaseClient } from '@supabase/supabase-js';

function getClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return createClient(url, anonKey);
}

function getAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Missing Supabase admin env vars: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export const supabase = {
  get client() { return getClient(); },
  from: (...args: Parameters<SupabaseClient['from']>) => getClient().from(...args),
};

// Uses service role key — bypasses RLS, only call from server-side ingest routes
export const supabaseAdmin = {
  from: (...args: Parameters<SupabaseClient['from']>) => getAdminClient().from(...args),
};
