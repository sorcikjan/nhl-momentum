import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/ingest/teams
// Fetches all 32 NHL teams and upserts into DB

export async function GET() {
  try {
    const res = await fetch('https://api.nhle.com/stats/rest/en/team', {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`NHL API error: ${res.status}`);
    const json = await res.json();

    const raw = json.data as { id: number; fullName: string; triCode: string }[];

    // Deduplicate by abbrev — keep highest id (most recent franchise name)
    const byAbbrev = new Map<string, { id: number; fullName: string; triCode: string }>();
    for (const t of raw) {
      if (!t.triCode) continue;
      const existing = byAbbrev.get(t.triCode);
      if (!existing || t.id > existing.id) byAbbrev.set(t.triCode, t);
    }

    const teams = [...byAbbrev.values()].map(t => ({
      id:     t.id,
      name:   t.fullName,
      abbrev: t.triCode,
    }));

    const { error } = await supabaseAdmin
      .from('teams')
      .upsert(teams, { onConflict: 'id' });

    if (error) throw error;

    return NextResponse.json({ data: { upserted: teams.length }, error: null });
  } catch (err) {
    return NextResponse.json(
      { data: null, error: (err as Error).message },
      { status: 500 }
    );
  }
}
