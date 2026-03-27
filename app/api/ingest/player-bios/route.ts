import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/ingest/player-bios?offset=0&limit=20
//
// Fetches biographical data from NHL API /v1/player/{id}/landing for each
// active player and stores it in the players table. Paginated — run with
// offset=0, 20, 40, ... until exhausted.

export async function GET(req: NextRequest) {
  const limit  = Number(req.nextUrl.searchParams.get('limit')  ?? '20');
  const offset = Number(req.nextUrl.searchParams.get('offset') ?? '0');

  const { data: players, error } = await supabaseAdmin
    .from('players')
    .select('id')
    .eq('is_active', true)
    .order('id')
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  if (!players?.length) return NextResponse.json({ data: { updated: 0, skipped: 0 }, error: null });

  // Fetch all player landings in parallel
  const results = await Promise.allSettled(
    players.map(async p => {
      const res = await fetch(`https://api-web.nhle.com/v1/player/${p.id}/landing`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bio: any = await res.json();

      // Career regular-season totals (last featuredStats season or regularSeasonStats)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const careerTotals = bio.careerTotals?.regularSeason as any ?? null;

      return {
        id:                   p.id,
        birth_date:           bio.birthDate            ?? null,
        birth_city:           bio.birthCity?.default   ?? null,
        birth_state_province: bio.birthStateProvince?.default ?? null,
        birth_country:        bio.birthCountry         ?? null,
        height_inches:        bio.heightInInches        ?? null,
        weight_pounds:        bio.weightInPounds        ?? null,
        shoots_catches:       bio.shootsCatches        ?? null,
        draft_year:           bio.draftDetails?.year         ?? null,
        draft_round:          bio.draftDetails?.round        ?? null,
        draft_pick:           bio.draftDetails?.pickInRound  ?? null,
        draft_team_abbrev:    bio.draftDetails?.teamAbbrev   ?? null,
        career_games:         careerTotals?.gamesPlayed      ?? null,
        career_goals:         careerTotals?.goals            ?? null,
        career_assists:       careerTotals?.assists          ?? null,
        career_points:        careerTotals?.points           ?? null,
        career_plus_minus:    careerTotals?.plusMinus        ?? null,
      };
    })
  );

  let updated = 0, skipped = 0;
  for (const result of results) {
    if (result.status === 'rejected') { skipped++; continue; }
    const { error: uErr } = await supabaseAdmin
      .from('players')
      .update(result.value)
      .eq('id', result.value.id);
    if (!uErr) updated++; else skipped++;
  }

  return NextResponse.json({ data: { updated, skipped, total: players.length }, error: null });
}
