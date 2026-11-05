import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { bumpGeneration } from '@/lib/db-fallback';
import { supabaseAdmin } from '@/lib/supabase';
import { gameUrl, playerUrl, teamUrl } from '@/lib/urls';

// Called by pipeline workers (game-finish-worker, daily-worker) after writing
// to Supabase so the ISR cache is invalidated right away — no stale data
// waiting for the next visitor to accidentally trigger a refresh.
//
// No body: everything (the daily pipeline). With { gameIds, teamIds } (the
// post-game worker): the pages the league-wide numbers are on, plus only those
// games, their teams and their players. A full sweep after every finished game
// had crawlers re-render ~2,500 pages from the database up to 10 times a night.

const SUMMARY_PATHS = ['/', '/games', '/rankings', '/standings', '/stats', '/hot', '/playoffs', '/accuracy', '/cesi-v-nhl'];

type Targets = { gameIds: number[]; teamIds: number[] };

function parseTargets(body: unknown): Targets | null {
  const b = body as Partial<Targets> | null;
  const ids = (v: unknown) => Array.isArray(v) ? v.map(Number).filter(Number.isFinite) : [];
  const t = { gameIds: ids(b?.gameIds), teamIds: ids(b?.teamIds) };
  return t.gameIds.length || t.teamIds.length ? t : null;
}

// Each lookup is a few dozen rows; one failing only narrows what's revalidated.
async function targetPaths({ gameIds, teamIds }: Targets): Promise<string[]> {
  const [teams, players, games] = await Promise.all([
    teamIds.length ? supabaseAdmin.from('teams').select('id, name').in('id', teamIds) : null,
    teamIds.length ? supabaseAdmin.from('players').select('id, first_name, last_name').in('team_id', teamIds).limit(500) : null,
    gameIds.length ? supabaseAdmin.from('games').select('id, game_date, home_team_id, away_team_id').in('id', gameIds) : null,
  ]);
  const paths: string[] = [];
  for (const t of teams?.data ?? []) paths.push(teamUrl(t.id, t.name));
  for (const p of players?.data ?? []) paths.push(playerUrl(p.id, p.first_name, p.last_name));
  const gameTeamIds = [...new Set((games?.data ?? []).flatMap(g => [g.home_team_id, g.away_team_id]))];
  if (gameTeamIds.length) {
    const { data: abbrevs } = await supabaseAdmin.from('teams').select('id, abbrev').in('id', gameTeamIds);
    const abbrev = new Map((abbrevs ?? []).map(t => [t.id, t.abbrev as string]));
    for (const g of games?.data ?? []) {
      const away = abbrev.get(g.away_team_id), home = abbrev.get(g.home_team_id);
      if (away && home) paths.push(gameUrl(g.id, away, home, g.game_date));
    }
  }
  return paths;
}

export async function POST(request: Request) {
  const key = request.headers.get('x-api-key') ?? '';
  if (key !== process.env.INGEST_API_KEY) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // The answers pages saved from the database are stale from here on.
  const generation = await bumpGeneration().then(() => 'bumped', e => `failed: ${e}`);

  const targets = parseTargets(await request.json().catch(() => null));
  for (const p of SUMMARY_PATHS) revalidatePath(p);
  revalidatePath('/recaps', 'layout');

  if (targets) {
    const paths = await targetPaths(targets).catch(() => []);
    for (const p of paths) revalidatePath(p);
    // A finished game's own data cache (game pages); other games keep theirs.
    for (const id of targets.gameIds) revalidateTag(`game:${id}`, { expire: 0 });
    return NextResponse.json({ revalidated: true, targeted: paths.length, generation, ts: new Date().toISOString() });
  }

  revalidatePath('/players/[id]/[slug]', 'page');
  revalidatePath('/teams/[id]/[slug]', 'page');
  revalidatePath('/games/[id]/[slug]', 'page');
  // Data cached across renders (finished game pages) — expire it now, not stale-while-revalidate.
  revalidateTag('pipeline', { expire: 0 });

  return NextResponse.json({ revalidated: true, generation, ts: new Date().toISOString() });
}
