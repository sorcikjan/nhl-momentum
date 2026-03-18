import { NextResponse } from 'next/server';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

  return NextResponse.json({
    url_set: !!url,
    url_starts_with: url.slice(0, 20),
    anon_set: !!anon,
    anon_starts_with: anon.slice(0, 15),
    service_set: !!service,
    service_length: service.length,
    service_starts_with: service.slice(0, 20),
    service_ends_with: service.slice(-10),
  });
}
