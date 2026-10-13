import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { currentSeason } from '@/lib/nhl-api';
import { requireIngestAuth } from '@/lib/ingest-auth';

// All 32 current NHL team abbreviations
const NHL_TEAMS = [
  'ANA','BOS','BUF','CAR','CBJ','CGY','CHI','COL','DAL','DET',
  'EDM','FLA','LAK','MIN','MTL','NJD','NSH','NYI','NYR','OTT',
  'PHI','PIT','SEA','SJS','STL','TBL','TOR','UTA','VAN','VGK',
  'WPG','WSH',
];

interface RosterPlayer {
  id: number;
  firstName: { default: string };
  lastName:  { default: string };
  sweaterNumber: number;
  positionCode: string;
  headshot: string;
}

export async function GET(req: NextRequest) {
  const authError = requireIngestAuth(req);
  if (authError) return authError;

  const season = currentSeason();
  let totalUpserted = 0;
  const errors: string[] = [];

  // Fetch teams from DB to get id→abbrev mapping
  const { data: dbTeams } = await supabaseAdmin
    .from('teams')
    .select('id, abbrev');

  const abbrevToId = Object.fromEntries(
    (dbTeams ?? []).map(t => [t.abbrev, t.id])
  );

  const seenIds = new Set<number>();
  const now = new Date().toISOString();

  // Teams in parallel — 32 sequential fetches can exceed the 26s function limit.
  await Promise.all(NHL_TEAMS.map(async abbrev => {
    try {
      const res = await fetch(
        `https://api-web.nhle.com/v1/roster/${abbrev}/${season}`,
        { cache: 'no-store' }
      );
      if (!res.ok) {
        errors.push(`${abbrev}: HTTP ${res.status}`);
        return;
      }
      const data = await res.json();
      const allPlayers: RosterPlayer[] = [
        ...(data.forwards   ?? []),
        ...(data.defensemen ?? []),
        ...(data.goalies    ?? []),
      ];

      const rows = allPlayers.map(p => ({
        id:             p.id,
        first_name:     p.firstName?.default ?? '',
        last_name:      p.lastName?.default  ?? '',
        position_code:  p.positionCode,
        sweater_number: p.sweaterNumber ?? null,
        team_id:        abbrevToId[abbrev] ?? null,
        headshot_url:   p.headshot ?? null,
        is_active:      true,
        updated_at:     now,
      }));
      for (const p of allPlayers) seenIds.add(p.id);

      const { error } = await supabaseAdmin
        .from('players')
        .upsert(rows, { onConflict: 'id' });

      if (error) errors.push(`${abbrev}: ${error.message}`);
      else totalUpserted += rows.length;
    } catch (err) {
      errors.push(`${abbrev}: ${(err as Error).message}`);
    }
  }));

  // Deactivate players no longer on any NHL roster (traded out of the league,
  // unsigned, retired). Only when every team loaded — a partial fetch would
  // wrongly deactivate whole teams.
  let deactivated = 0;
  if (errors.length === 0 && seenIds.size > 0) {
    const { data: active } = await supabaseAdmin
      .from('players')
      .select('id')
      .eq('is_active', true);
    const gone = (active ?? []).map(p => p.id).filter(id => !seenIds.has(id));
    for (let i = 0; i < gone.length; i += 200) {
      const { error } = await supabaseAdmin
        .from('players')
        .update({ is_active: false, updated_at: now })
        .in('id', gone.slice(i, i + 200));
      if (error) errors.push(`deactivate: ${error.message}`);
      else deactivated += Math.min(200, gone.length - i);
    }
  }

  return NextResponse.json({
    data: { upserted: totalUpserted, deactivated, errors },
    error: errors.length > 0 ? `${errors.length} teams had errors` : null,
  });
}
