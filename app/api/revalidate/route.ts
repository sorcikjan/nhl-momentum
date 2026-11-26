import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { bumpGeneration } from '@/lib/db-fallback';
import { refreshRankings } from '@/lib/data';
import { supabaseAdmin } from '@/lib/supabase';
import { gameUrl, playerUrl, teamUrl } from '@/lib/urls';
import { NATIONS } from '@/lib/nations';
import { topicPaths } from '@/lib/nation-topics';
import { currentSeason } from '@/lib/nhl-api';
import { NHL_TAG } from '@/lib/cache-policy';

// Called by pipeline workers (game-finish-worker, daily-worker) after writing
// to Supabase so the ISR cache is invalidated right away — no stale data
// waiting for the next visitor to accidentally trigger a refresh.
//
// Pages are rendered again only when this is called (lib/cache-policy.ts), so
// each caller names what it changed:
// - { gameIds, teamIds } (the post-game worker): the pages the league-wide
//   numbers are on, plus only those games, their teams and their players;
// - { scope: 'summary' } (the other daily-worker runs): the league-wide pages
//   and the games from yesterday to tomorrow (scores, picks);
// - no body or { scope: 'full' } (the 08:00 daily pipeline, once a day):
//   everything, so ranks on every player page move once a day.
// A full sweep on every run had crawlers re-render ~2,500 pages from the
// database up to 6 times a day.

const SUMMARY_PATHS = ['/sitemap.xml', '/', '/games', '/rankings', '/standings', '/stats', '/hot', '/hot/teams', '/hot/goalies', '/playoffs', '/accuracy', ...Object.values(NATIONS).flatMap(n => [n.path, ...topicPaths(n, currentSeason())])];

const RANKINGS_BUDGET_MS = 15_000;

type Targets = { gameIds: number[]; teamIds: number[] };

// Games from yesterday to tomorrow: their pages show the scores and picks the
// daily runs write.
async function recentGames(): Promise<Targets> {
  const day = (k: number) => new Date(Date.now() + k * 86_400_000).toISOString().slice(0, 10);
  const { data } = await supabaseAdmin.from('games').select('id').gte('game_date', day(-1)).lte('game_date', day(1));
  return { gameIds: (data ?? []).map(g => g.id as number), teamIds: [] };
}

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

  // Pages only read rankings; this is where they're rebuilt (lib/data.ts).
  // Before the paths below, so their next render reads the new ones. Capped so
  // a slow database can't stop the revalidation itself: a page rebuilds stale
  // rankings on its own after 3 h.
  let timer: ReturnType<typeof setTimeout> | undefined;
  const rankings = await Promise.race([
    refreshRankings().then(r => `rebuilt: ${r.skaters} skaters`, e => `failed: ${e}`),
    new Promise<string>(resolve => { timer = setTimeout(() => resolve('timed out'), RANKINGS_BUDGET_MS); }),
  ]).finally(() => clearTimeout(timer));

  const body = await request.json().catch(() => null) as { scope?: string } | null;
  const summary = body?.scope === 'summary';
  const targets = summary ? await recentGames().catch(() => null) : parseTargets(body);
  for (const p of SUMMARY_PATHS) revalidatePath(p);
  revalidatePath('/recaps', 'layout');

  if (targets) {
    const paths = await targetPaths(targets).catch(() => []);
    for (const p of paths) revalidatePath(p);
    // A finished game's own data cache (game pages); other games keep theirs.
    for (const id of targets.gameIds) revalidateTag(`game:${id}`, { expire: 0 });
    return NextResponse.json({ revalidated: true, scope: summary ? 'summary' : 'targeted', targeted: paths.length, generation, rankings, ts: new Date().toISOString() });
  }
  if (summary) return NextResponse.json({ revalidated: true, scope: 'summary', targeted: 0, generation, rankings, ts: new Date().toISOString() });

  revalidatePath('/players/[id]/[slug]', 'page');
  revalidatePath('/teams/[id]/[slug]', 'page');
  revalidatePath('/games/[id]/[slug]', 'page');
  // Data cached across renders (finished game pages) — expire it now, not stale-while-revalidate.
  revalidateTag('pipeline', { expire: 0 });
  // External answers pages were rendered from (lib/cache-policy.ts): once a day.
  revalidateTag(NHL_TAG, { expire: 0 });

  return NextResponse.json({ revalidated: true, scope: 'full', generation, rankings, ts: new Date().toISOString() });
}
