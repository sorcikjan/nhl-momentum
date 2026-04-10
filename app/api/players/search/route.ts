import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) return NextResponse.json({ players: [] });

  // Search first or last name; both words if query contains a space
  const words = q.split(/\s+/).filter(Boolean);
  let query = supabaseAdmin
    .from('players')
    .select('id, first_name, last_name, position_code, headshot_url, teams(id, abbrev)')
    .eq('is_active', true);

  if (words.length >= 2) {
    // "Connor McDavid" → first word matches first_name, second matches last_name
    query = query.ilike('first_name', `%${words[0]}%`).ilike('last_name', `%${words[1]}%`);
  } else {
    query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%`);
  }

  const { data, error } = await query.order('last_name').limit(10);

  if (error) return NextResponse.json({ players: [] }, { status: 500 });
  return NextResponse.json({ players: data ?? [] });
}
