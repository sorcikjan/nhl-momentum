import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireIngestAuth } from '@/lib/ingest-auth';
import { currentSeason } from '@/lib/nhl-api';
import { pageAll } from '@/lib/data';
import { inMinors, type SeasonTotal } from '@/lib/player-assignment';

const SEASON = currentSeason(); // e.g. 20262027
const NHL = 'https://api-web.nhle.com/v1';

async function nhl<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${NHL}${path}`, { cache: 'no-store', signal: AbortSignal.timeout(10_000) });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

async function pool<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += size) out.push(...(await Promise.all(items.slice(i, i + size).map(fn))));
  return out;
}

type Roster = { forwards?: { id: number }[]; defensemen?: { id: number }[]; goalies?: { id: number }[] };

// Minors = off his team's current NHL roster with games this season in a
// minor or European league (lib/player-assignment.ts). 32 roster calls find
// the few players off a roster; only those get a landing call. Flags are
// written per batch so a timeout keeps the work already done.
export async function GET(req: NextRequest) {
  const authError = requireIngestAuth(req);
  if (authError) return authError;

  const { data: teams, error: tErr } = await supabaseAdmin.from('teams').select('id, abbrev');
  if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 });

  const rosters = await pool(teams ?? [], 4, async t => ({ id: t.id as number, roster: await nhl<Roster>(`/roster/${t.abbrev}/${SEASON}`) }));
  // A team whose roster didn't load can't tell us anything: leave its players alone.
  const loadedTeams = new Set(rosters.filter(r => r.roster).map(r => r.id));
  const onRoster = new Set(rosters.flatMap(r => [...(r.roster?.forwards ?? []), ...(r.roster?.defensemen ?? []), ...(r.roster?.goalies ?? [])].map(p => p.id)));

  let players: { id: number; team_id: number; in_minors: boolean | null }[];
  try {
    players = await pageAll((from, to) => supabaseAdmin.from('players').select('id, team_id, in_minors').eq('is_active', true).not('team_id', 'is', null).order('id').range(from, to));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
  const known = players.filter(p => loadedTeams.has(p.team_id));

  // Back on a roster → not in the minors.
  const recalled = known.filter(p => p.in_minors && onRoster.has(p.id)).map(p => p.id);
  if (recalled.length) await supabaseAdmin.from('players').update({ in_minors: false }).in('id', recalled);

  const candidates = known.filter(p => !onRoster.has(p.id));
  let flagged = 0, cleared = 0;
  const minorIds: number[] = [];
  for (let i = 0; i < candidates.length; i += 10) {
    const batch = candidates.slice(i, i + 10);
    const results = await pool(batch, 5, async p => {
      const landing = await nhl<{ seasonTotals?: SeasonTotal[] }>(`/player/${p.id}/landing`);
      return landing ? inMinors(false, landing.seasonTotals ?? [], Number(SEASON)) : null;
    });
    const toFlag = batch.filter((p, j) => results[j] === true && !p.in_minors).map(p => p.id);
    const toClear = batch.filter((p, j) => results[j] === false && p.in_minors).map(p => p.id);
    batch.forEach((p, j) => { if (results[j]) minorIds.push(p.id); });
    if (toFlag.length) { await supabaseAdmin.from('players').update({ in_minors: true }).in('id', toFlag); flagged += toFlag.length; }
    if (toClear.length) { await supabaseAdmin.from('players').update({ in_minors: false }).in('id', toClear); cleared += toClear.length; }
  }

  return NextResponse.json({
    data: {
      active_players: players.length,
      teams_loaded: loadedTeams.size,
      checked: candidates.length,
      flagged_in_minors: flagged,
      unflagged: recalled.length + cleared,
      minor_league_player_ids: minorIds,
    },
  });
}
