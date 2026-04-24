import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireIngestAuth } from '@/lib/ingest-auth';
import { currentSeason } from '@/lib/nhl-api';

// NHL teams — used to distinguish NHL from AHL/minor league entries in seasonTotals
const NHL_LEAGUES = new Set(['NHL', 'AHL', 'ECHL', 'OHL', 'WHL', 'QMJHL', 'SHL', 'KHL', 'Liiga', 'DEL', 'NLA', 'Extraliga']);
const MINOR_LEAGUES = new Set(['AHL', 'ECHL', 'OHL', 'WHL', 'QMJHL', 'AHL ', 'SPHL']);

const CURRENT_SEASON = currentSeason(); // e.g. 20252026
const NHL_SEASON_ID = parseInt(CURRENT_SEASON);

// How many days without an NHL game before a player is considered "inactive" (candidate for in_minors check)
const INACTIVE_DAYS = 14;

interface SeasonTotal {
  season: number;
  leagueAbbrev: string;
  gameTypeId: number;
  gamesPlayed: number;
}

async function fetchPlayerAssignment(playerId: number): Promise<{ inMinors: boolean }> {
  try {
    const res = await fetch(
      `https://api-web.nhle.com/v1/player/${playerId}/landing`,
      { cache: 'no-store', signal: AbortSignal.timeout(10_000) }
    );
    if (!res.ok) return { inMinors: false };
    const data = await res.json();
    const seasonTotals: SeasonTotal[] = data.seasonTotals ?? [];

    // Check if player has minor league entries in the current season
    const hasMinorLeagueGames = seasonTotals.some(
      s => s.season === NHL_SEASON_ID && s.gameTypeId === 2 && MINOR_LEAGUES.has(s.leagueAbbrev)
    );

    // Also confirm they have no more recent NHL games than AHL games (i.e., not recalled)
    // We use the sequence field — higher sequence = recorded later in the season
    if (hasMinorLeagueGames) {
      const nhlEntries = seasonTotals.filter(s => s.season === NHL_SEASON_ID && s.leagueAbbrev === 'NHL' && s.gameTypeId === 2);
      const minorEntries = seasonTotals.filter(s => s.season === NHL_SEASON_ID && MINOR_LEAGUES.has(s.leagueAbbrev) && s.gameTypeId === 2);
      // If their highest NHL sequence > their highest minor sequence, they were recalled — not currently in minors
      const maxNhlSeq = Math.max(...nhlEntries.map((s: SeasonTotal & { sequence?: number }) => (s as SeasonTotal & { sequence?: number }).sequence ?? 0), 0);
      const maxMinorSeq = Math.max(...minorEntries.map((s: SeasonTotal & { sequence?: number }) => (s as SeasonTotal & { sequence?: number }).sequence ?? 0), 0);
      if (maxNhlSeq > maxMinorSeq) {
        // NHL sequence is higher — player was recalled after AHL stint, currently in NHL
        return { inMinors: false };
      }
      return { inMinors: true };
    }

    return { inMinors: false };
  } catch {
    return { inMinors: false };
  }
}

export async function GET(req: NextRequest) {
  const authError = requireIngestAuth(req);
  if (authError) return authError;

  const sinceDate = new Date(Date.now() - INACTIVE_DAYS * 86_400_000).toISOString().slice(0, 10);

  // Get all active players
  const { data: players, error: pErr } = await supabaseAdmin
    .from('players')
    .select('id')
    .eq('is_active', true)
    .not('team_id', 'is', null);

  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });

  const allPlayerIds = (players ?? []).map(p => p.id);

  // Find players who have had a game in the last INACTIVE_DAYS days
  const { data: recentGames } = await supabaseAdmin
    .from('games')
    .select('id, home_team_id, away_team_id')
    .in('game_state', ['FINAL', 'OFF'])
    .gte('game_date', sinceDate)
    .limit(5000);

  const recentGameIds = (recentGames ?? []).map(g => g.id);

  const { data: recentStats } = await supabaseAdmin
    .from('game_player_stats')
    .select('player_id')
    .in('game_id', recentGameIds)
    .in('player_id', allPlayerIds)
    .limit(50000);

  const recentlyActivePids = new Set((recentStats ?? []).map(s => s.player_id));

  // Players with no recent game = candidates for in_minors check
  const inactivePids = allPlayerIds.filter(id => !recentlyActivePids.has(id));

  // Also get players currently flagged in_minors who have recent games (to un-flag them)
  const { data: currentMinors } = await supabaseAdmin
    .from('players')
    .select('id')
    .eq('in_minors', true);
  const currentMinorIds = new Set((currentMinors ?? []).map(p => p.id));

  // Un-flag players who are currently in_minors but played recently
  const toUnflag = [...currentMinorIds].filter(id => recentlyActivePids.has(id));

  let unflagged = 0;
  if (toUnflag.length > 0) {
    await supabaseAdmin.from('players').update({ in_minors: false }).in('id', toUnflag);
    unflagged = toUnflag.length;
  }

  // Check inactive players via NHL API — batch with delay to avoid rate limits
  const BATCH = 5;
  const DELAY_MS = 200;
  let flagged = 0;
  let checked = 0;
  const nowMinors: number[] = [];

  for (let i = 0; i < inactivePids.length; i += BATCH) {
    const batch = inactivePids.slice(i, i + BATCH);
    const results = await Promise.all(batch.map(id => fetchPlayerAssignment(id)));
    for (let j = 0; j < batch.length; j++) {
      checked++;
      if (results[j].inMinors) {
        nowMinors.push(batch[j]);
      }
    }
    if (i + BATCH < inactivePids.length) {
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }

  // Update in_minors flag for newly detected minor league players
  if (nowMinors.length > 0) {
    await supabaseAdmin.from('players').update({ in_minors: true }).in('id', nowMinors);
    flagged = nowMinors.length;
  }

  // Un-flag inactive players not detected as in minors (reset false negatives from prior runs)
  const toResetFalse = inactivePids.filter(id => !nowMinors.includes(id) && currentMinorIds.has(id));
  if (toResetFalse.length > 0) {
    await supabaseAdmin.from('players').update({ in_minors: false }).in('id', toResetFalse);
  }

  return NextResponse.json({
    data: {
      active_players: allPlayerIds.length,
      inactive_candidates: inactivePids.length,
      checked,
      flagged_in_minors: flagged,
      unflagged: unflagged,
      minor_league_player_ids: nowMinors,
    },
  });
}
