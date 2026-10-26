import type { Metadata } from 'next';
import { cache, Suspense } from 'react';
import { notFound, permanentRedirect } from 'next/navigation';
import { ProfileBody } from '@/components/player/ProfileBody';
import { daysAgo, deriveOutStatus, fetchPeers, fetchPlayer, fetchRankings, fetchSeasonPhase } from '@/lib/data';
import { getPlayerInsights, type PlayerAIInput } from '@/lib/ai';
import { deriveArchetype } from '@/lib/archetype';
import { ppmToHeat } from '@/lib/heat';
import { currentSeason, getPlayerLanding } from '@/lib/nhl-api';
import { gameLogRows, heatSeries, trendGames, type Tile } from '@/lib/player-profile';
import { energyAverage, gameLines, groupOf, groupWords, heatContext, last5, last5Line, ordinal, paceLine, peerFromSnapshot, peersOf, radarAxes, seasonRows, standings, strengthsLine, trendLine } from '@/lib/profile-context';
import { assertDatabaseUp, databaseDown } from '@/lib/supabase';
import { JsonLd } from '@/components/seo/JsonLd';
import { personLd, playerTitle } from '@/lib/seo';
import { playerShareText } from '@/lib/share';
import ShareButton from '@/components/ui/ShareButton';
import { SITE_URL } from '@/lib/site';
import { playerUrl } from '@/lib/urls';

// Deduplicate fetchPlayer between generateMetadata and the page component
const cachedFetchPlayer = cache((id: string) => fetchPlayer(id).catch(() => null));
// The two AI texts render in separate Suspense boundaries; one lookup serves both.
const cachedInsights = cache((playerId: number, aiInput: PlayerAIInput) => getPlayerInsights(playerId, aiInput).catch(() => ({ bio: null, perfEval: null })));

// Player data changes only when the pipeline runs, and every run (nightly and
// after each finished game) calls /api/revalidate. 6 h keeps crawlers — 800+
// player pages in the sitemap — off the database without costing freshness.
export const revalidate = 21600;

// Render on first visit, then serve from the ISR cache for `revalidate` seconds.
// Without this, a dynamic-segment page is rendered on every request.
export function generateStaticParams() {
  return [];
}

// "2026–27" from the current NHL season id.
function seasonLabel() {
  const s = currentSeason();
  return `${s.slice(0, 4)}–${s.slice(6, 8)}`;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string; slug: string }> }): Promise<Metadata> {
  const { id } = await params;
  const data = await cachedFetchPlayer(id);
  if (!data?.player) return { title: 'Player' };
  const { player } = data;
  const canonicalPath = playerUrl(player.id, player.first_name, player.last_name);
  const name = `${player.first_name} ${player.last_name}`;
  const team = player.teams?.abbrev ?? '';
  const teamName = player.teams?.name ?? team;
  const pos  = player.position_code ?? '';
  const season = seasonLabel();
  const title = playerTitle(name, season);
  const desc = `${name} ${season} NHL stats — Heat score, recent form, game log and season numbers for the ${teamName} ${pos}.`;
  return {
    title,
    description: desc,
    alternates: { canonical: `${SITE_URL}${canonicalPath}` },
    openGraph: {
      title: `${name} — momentum.`,
      description: desc,
    },
    // The image comes from ./opengraph-image (Heat card).
    twitter: { card: 'summary_large_image', title: `${name} — ${season} NHL Stats`, description: desc },
  };
}

const COUNTRY_FLAG: Record<string, string> = {
  CAN: '🇨🇦', USA: '🇺🇸', SWE: '🇸🇪', FIN: '🇫🇮',
  RUS: '🇷🇺', CZE: '🇨🇿', SVK: '🇸🇰', GER: '🇩🇪', DEU: '🇩🇪',
  AUT: '🇦🇹', CHE: '🇨🇭', NOR: '🇳🇴', DNK: '🇩🇰',
  LVA: '🇱🇻', BLR: '🇧🇾', UKR: '🇺🇦', FRA: '🇫🇷',
  AUS: '🇦🇺', NLD: '🇳🇱', GBR: '🇬🇧', HUN: '🇭🇺',
};


function ageOf(birthDate: string | null | undefined): number | null {
  return birthDate ? Math.floor((Date.now() - Date.parse(birthDate)) / (365.25 * 86_400_000)) : null;
}

const POSITION: Record<string, string> = { C: 'Center', L: 'Left wing', R: 'Right wing', D: 'Defenseman', G: 'Goalie' };

const OUT_LABEL = { injured: 'INJURED', out: 'OUT', scratch: 'SCRATCHED', minors: 'MINORS' } as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function goalieTiles(agg: any): Tile[] {
  if (!agg) return [];
  return [
    { label: 'SV%', value: agg.savePct ? agg.savePct.toFixed(3).replace(/^0/, '') : '—', tone: 'heat' },
    { label: 'GAA', value: agg.gaa ? agg.gaa.toFixed(2) : '—' },
    { label: 'RECORD', value: `${agg.wins}-${agg.losses}-${agg.otl}` },
    { label: 'GAMES', value: String(agg.gp) },
    { label: 'SHOTS AGAINST', value: String(agg.shotsAgainst) },
    { label: 'GOALS AGAINST', value: String(agg.goalsAgainst) },
  ];
}

// Player profile per docs/design/redesign-2026/player-profile-final.js.
export default async function PlayerPage({ params }: { params: Promise<{ id: string; slug: string }> }) {
  // Throws only if the database is down and nothing was saved to render from.
  await assertDatabaseUp();
  const { id, slug } = await params;
  const [data, allPeers, seasonPhase, rankings, landing] = await Promise.all([
    cachedFetchPlayer(id),
    fetchPeers().catch(() => []),
    fetchSeasonPhase().catch(() => ({ isPreseason: false, regularSeasonStartDate: null, daysUntilStart: null })),
    fetchRankings().catch(() => null),
    // Career seasons from NHL.com; they change once a game, so the page's own 6 h.
    getPlayerLanding(Number(id), 21600).catch(() => null),
  ]);
  // A player missing because the database is down is not a 404 (crawlers would drop the page).
  if (!data?.player) { if (databaseDown()) throw new Error('Database unavailable'); notFound(); }
  // Old or mistyped slugs (e.g. pre-accent-folding "tim-st-tzle") → one canonical URL.
  // loading.tsx streams this page, so it goes out as an instant meta refresh
  // (Google treats that as a permanent redirect), backed by the canonical tag.
  const canonicalPath = playerUrl(data.player.id, data.player.first_name, data.player.last_name);
  if (slug !== canonicalPath.split('/').pop()) permanentRedirect(canonicalPath);

  const { player, metricTimeline, recentGames, consecutiveGamesMissed, lastPlayedDate, goalieStats } = data;
  const isGoalie = player.position_code === 'G';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const snap: Record<string, any> = metricTimeline?.[metricTimeline.length - 1] ?? {};
  const team = player.teams?.abbrev ?? '';
  const seaGames = Number(snap.season_games ?? 0);
  const hasSeason = seaGames > 0;

  // Heat is a skater scoring metric: goalies and players without games this season get none.
  const heat = !isGoalie && hasSeason ? ppmToHeat(snap.momentum_ppm) : null;
  // Change vs the previous day with data (daily series, empty windows skipped).
  const daily = heatSeries(metricTimeline ?? [], new Date(), 400);
  const heatDelta = heat != null && daily.length >= 2 ? heat - daily[daily.length - 2].heat : null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rankIdx = (rankings?.top100 ?? []).findIndex((r: any) => r.player_id === Number(id));
  const energy = snap.energy_bar != null ? Number(snap.energy_bar) : null;
  const lastPlayedDaysAgo = lastPlayedDate ? daysAgo(lastPlayedDate) : null;
  const outStatus = deriveOutStatus(consecutiveGamesMissed ?? null, lastPlayedDaysAgo, player.in_minors ?? false, !seasonPhase.isPreseason);

  const archetype = !isGoalie ? deriveArchetype({
    positionCode: player.position_code,
    seasonGames: seaGames,
    seasonGoals: Number(snap.season_goals ?? 0),
    seasonAssists: Number(snap.season_assists ?? 0),
    seasonShootingPct: Number(snap.season_shooting_pct ?? 0),
    seasonShots: Number(snap.season_shots ?? 0),
    seasonPpPoints: Number(snap.season_pp_points ?? 0),
    seasonPim: Number(snap.season_pim ?? 0),
  }) : null;

  const age = ageOf(player.birth_date);
  const name = `${player.first_name} ${player.last_name}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const games = (recentGames ?? []) as any[];

  const aiInput: PlayerAIInput = {
    name, team, position: player.position_code ?? '', rank: rankIdx >= 0 ? rankIdx + 1 : null,
    birthCity: player.birth_city ?? null, birthCountry: player.birth_country ?? null, age,
    heightInches: player.height_inches ?? null, weightPounds: player.weight_pounds ?? null,
    shootsCatches: player.shoots_catches ?? null,
    draftYear: player.draft_year ?? null, draftRound: player.draft_round ?? null, draftPick: player.draft_pick ?? null,
    draftTeam: player.draft_team_abbrev ?? null,
    careerGames: player.career_games ?? 0, careerGoals: player.career_goals ?? 0, careerAssists: player.career_assists ?? 0,
    careerPlusMinus: player.career_plus_minus ?? null,
    seaGames, seaGoals: Number(snap.season_goals ?? 0), seaAssists: Number(snap.season_assists ?? 0),
    seaPoints: Number(snap.season_goals ?? 0) + Number(snap.season_assists ?? 0),
    seaPpm: Number(snap.season_ppm ?? 0), seaShootPct: Number(snap.season_shooting_pct ?? 0),
    seaToiMin: Number(snap.season_toi_sec ?? 0) / 60 / Math.max(1, seaGames),
    momGames: Number(snap.momentum_games ?? 0), momGoals: Number(snap.momentum_goals ?? 0), momAssists: Number(snap.momentum_assists ?? 0),
    momPpm: Number(snap.momentum_ppm ?? 0), momShootPct: Number(snap.momentum_shooting_pct ?? 0),
    momToiMin: Number(snap.momentum_toi_sec ?? 0) / 60 / Math.max(1, Number(snap.momentum_games ?? 1)),
    energyBar: energy ?? 100, breakoutDelta: Number(snap.breakout_delta ?? 0),
    recentGames: gameLogRows(games.slice(0, 5), player.team_id).map(g => ({
      date: g.date, opponent: g.opponent, goals: g.goals, assists: g.assists, plusMinus: g.plusMinus,
      toiMin: Number(g.toi.split(':')[0]) + Number(g.toi.split(':')[1]) / 60,
    })),
  };

  // His position's field: average, rank, leader and percentiles come from it.
  const me = !isGoalie && hasSeason ? peerFromSnapshot({ ...snap, player_id: player.id, players: { last_name: player.last_name, position_code: player.position_code, teams: { abbrev: team } } }) : null;
  const peers = me ? peersOf(me, allPeers) : [];
  const group = groupOf(player.position_code);
  const words = groupWords(group);
  const ctx = me && peers.length >= 10 ? { heat: heatContext(me, peers), stands: standings(me, peers), radar: radarAxes(me, peers), energyAvg: energyAverage(peers) } : null;
  const seasonStart = `${currentSeason().slice(0, 4)}-09-01`;
  const lines = isGoalie ? [] : gameLines(games, player.team_id, seasonStart, daily);
  const l5 = me && ctx ? last5(lines, me, peers) : null;
  const pts = ctx?.stands.find(s => s.key === 'pts');
  const career = seasonRows(landing);
  const curSeason = seasonLabel();
  const gs = goalieStats?.season;

  const heightIn = player.height_inches;
  const view = {
    hero: {
      first: player.first_name, last: player.last_name, team, teamName: player.teams?.name ?? '',
      number: player.sweater_number ?? null, position: POSITION[player.position_code ?? ''] ?? player.position_code ?? '', age,
      shoots: player.shoots_catches ?? null,
      height: heightIn ? `${Math.floor(heightIn / 12)}'${heightIn % 12}"` : null,
      weight: player.weight_pounds ? `${player.weight_pounds} lb` : null,
      birthPlace: [player.birth_city, player.birth_state_province ?? player.birth_country].filter(Boolean).join(', ') || null,
      flag: player.birth_country ? COUNTRY_FLAG[player.birth_country] ?? null : null,
      drafted: player.draft_year ? `${player.draft_year} · Rd ${player.draft_round} #${player.draft_pick}` : 'Undrafted',
      photo: player.headshot_url ?? null,
      archetype: archetype ? { name: archetype.label, basis: archetype.basis } : null,
      headline: isGoalie
        ? (gs?.gp
          ? <><b>{gs.wins}-{gs.losses}-{gs.otl}</b> in {gs.gp} games · save percentage <b>{gs.savePct.toFixed(3).replace(/^0/, '')}</b> · {gs.gaa.toFixed(2)} goals against a game.</>
          : 'No games yet this season.')
        : pts
          ? <><b>{pts.me} point{pts.me === 1 ? '' : 's'} in {seaGames} game{seaGames === 1 ? '' : 's'}</b> — {ordinal(pts.rank)} of {pts.n} {words.many}. The average {words.one} has {pts.avg.toFixed(1).replace(/\.0$/, '')}.</>
          : hasSeason ? <><b>{snap.season_goals ?? 0} goals, {snap.season_assists ?? 0} assists</b> in {seaGames} games.</> : 'No games yet this season.',
      heat: isGoalie ? 'none' as const : heat != null && ctx ? { value: heat, delta: heatDelta, pct: ctx.heat.pct, avg: ctx.heat.avg, one: words.one, many: words.many } : null,
      energy: energy != null ? {
        value: energy, avg: ctx?.energyAvg ?? null, one: ctx ? words.one : null,
        note: lastPlayedDaysAgo != null ? `last game ${lastPlayedDaysAgo === 0 ? 'today' : lastPlayedDaysAgo === 1 ? 'yesterday' : `${lastPlayedDaysAgo} days ago`}` : null,
      } : null,
      outBanner: outStatus ? {
        label: OUT_LABEL[outStatus],
        note: consecutiveGamesMissed ? `Missed ${consecutiveGamesMissed} straight team game${consecutiveGamesMissed === 1 ? '' : 's'}` : 'Not in recent lineups',
      } : null,
    },
    last: player.last_name,
    peers: ctx ? words : null,
    scouting: {
      bio: (
        <Suspense fallback={<div className="h-20 animate-pulse rounded-lg" style={{ background: 'var(--bg)' }} />}>
          <AIText playerId={Number(id)} aiInput={aiInput} which="bio" />
        </Suspense>
      ),
      now: (
        <Suspense fallback={<div className="h-20 animate-pulse rounded-lg" style={{ background: 'var(--bg)' }} />}>
          <AIText playerId={Number(id)} aiInput={aiInput} which="perfEval" />
        </Suspense>
      ),
    },
    trend: {
      kind: isGoalie ? 'goalie' as const : 'skater' as const,
      games: isGoalie
        ? trendGames(games, player.team_id, 'goalie', seasonStart)
        : lines.map(l => ({ date: l.date, opp: l.opp, home: l.home, res: l.result, heat: l.heat, g: l.g, a: l.a, pts: l.g + l.a, sog: l.sog, toi: Math.round(l.toi / 6) / 10, pm: l.pm })),
      heatAvg: ctx?.heat.avg ?? null,
      heatTop: ctx?.heat.top ?? null,
      peers: ctx ? words : null,
    },
    trendLine: ctx ? trendLine(lines, ctx.heat, group) : null,
    last5: { table: l5, line: l5 ? last5Line(l5, group) : null, games: lines.slice(-5) },
    goalieLast5: isGoalie ? goalieTiles(goalieStats?.recent) : [],
    seasonLabel: curSeason,
    seasonGames: isGoalie ? gs?.gp ?? 0 : seaGames,
    goalieSeason: isGoalie ? goalieTiles(gs) : [],
    stands: ctx?.stands ?? [],
    radar: ctx ? { axes: ctx.radar, ...strengthsLine(ctx.radar) } : null,
    seasons: { rows: career, current: curSeason, pace: isGoalie ? null : paceLine(career, curSeason), goalie: isGoalie },
  };

  return (
    <>
      <JsonLd data={personLd({
        name: `${player.first_name} ${player.last_name}`,
        url: `${SITE_URL}${playerUrl(player.id, player.first_name, player.last_name)}`,
        image: player.headshot_url ?? null,
        team: player.teams?.name ?? null,
      })} />
      <div className="mb-4 flex justify-end">
        <ShareButton text={playerShareText(`${player.first_name} ${player.last_name}`, heat)} />
      </div>
      <ProfileBody view={view} />
    </>
  );
}

// One of the two scouting texts; both come from one cached lookup per render.
async function AIText({ playerId, aiInput, which }: { playerId: number; aiInput: PlayerAIInput; which: 'bio' | 'perfEval' }) {
  const text = (await cachedInsights(playerId, aiInput))[which];
  if (!text) {
    return <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{which === 'bio' ? 'The scouting report isn’t written yet — check back later.' : 'The read on his form isn’t written yet — check back after his next game.'}</p>;
  }
  return <p className="text-[15px] leading-relaxed" style={{ color: 'var(--text-bright)', textWrap: 'pretty' }}>{text}</p>;
}
