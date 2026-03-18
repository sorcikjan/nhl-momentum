import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { currentSeason } from '@/lib/nhl-api';

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

export async function GET() {
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

  for (const abbrev of NHL_TEAMS) {
    try {
      const res = await fetch(
        `https://api-web.nhle.com/v1/roster/${abbrev}/${season}`,
        { cache: 'no-store' }
      );
      if (!res.ok) {
        errors.push(`${abbrev}: HTTP ${res.status}`);
        continue;
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
      }));

      const { error } = await supabaseAdmin
        .from('players')
        .upsert(rows, { onConflict: 'id' });

      if (error) errors.push(`${abbrev}: ${error.message}`);
      else totalUpserted += rows.length;
    } catch (err) {
      errors.push(`${abbrev}: ${(err as Error).message}`);
    }
  }

  return NextResponse.json({
    data: { upserted: totalUpserted, errors },
    error: errors.length > 0 ? `${errors.length} teams had errors` : null,
  });
}
