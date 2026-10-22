import type { Metadata } from 'next';
import { cache, Suspense } from 'react';
import { notFound, permanentRedirect } from 'next/navigation';
import { AIBioBox } from '@/components/player/PlayerHero';
import { ProfileBody } from '@/components/player/ProfileBody';
import { daysAgo, deriveOutStatus, fetchLeagueAverages, fetchPlayer, fetchRankings, fetchSeasonPhase } from '@/lib/data';
import { getPlayerInsights, type PlayerAIInput } from '@/lib/ai';
import { deriveArchetype } from '@/lib/archetype';
import { ppmToHeat } from '@/lib/heat';
import { currentSeason } from '@/lib/nhl-api';
import { formChips, gameLogRows, heatSeries, last5Tiles, radarStats, seasonTiles, vsLeagueRows, type Tile } from '@/lib/player-profile';
import { assertDatabaseUp } from '@/lib/supabase';
import { JsonLd } from '@/components/seo/JsonLd';
import { personLd, playerTitle } from '@/lib/seo';
import { playerShareText } from '@/lib/share';
import ShareButton from '@/components/ui/ShareButton';
import { SITE_URL } from '@/lib/site';
import { playerUrl } from '@/lib/urls';

// Deduplicate fetchPlayer between generateMetadata and the page component
const cachedFetchPlayer = cache((id: string) => fetchPlayer(id).catch(() => null));

// Player data changes at most a few times a night; the pipeline also calls
// /api/revalidate after each run. 10 min keeps crawler traffic off the database.
export const revalidate = 600;

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
  // Throw (→ keep serving the last good cached page) if the database is down.
  await assertDatabaseUp();
  const { id, slug } = await params;
  const [data, leagueAvg, seasonPhase, rankings] = await Promise.all([
    cachedFetchPlayer(id),
    fetchLeagueAverages().catch(() => null),
    fetchSeasonPhase().catch(() => ({ isPreseason: false, regularSeasonStartDate: null, daysUntilStart: null })),
    fetchRankings().catch(() => null),
  ]);
  if (!data?.player) notFound();
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
  const daily = heatSeries(metricTimeline ?? [], new Date(), 42);
  const heatDelta = heat != null && daily.length >= 2 ? heat - daily[daily.length - 2].heat : null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rankIdx = (rankings?.top100 ?? []).findIndex((r: any) => r.player_id === Number(id));
  const rankLine = heat != null && rankIdx >= 0 ? `#${rankIdx + 1} of ${rankings!.totalSkaters}` : null;
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

  const heightIn = player.height_inches;
  const series = daily;
  const view = {
    hero: {
      first: player.first_name, last: player.last_name, team,
      number: player.sweater_number ?? null, position: player.position_code ?? '', age,
      shoots: player.shoots_catches ?? null,
      height: heightIn ? `${Math.floor(heightIn / 12)}'${heightIn % 12}"` : null,
      weight: player.weight_pounds ? `${player.weight_pounds} lb` : null,
      birthPlace: [player.birth_city, player.birth_state_province ?? player.birth_country].filter(Boolean).join(', ') || null,
      flag: player.birth_country ? COUNTRY_FLAG[player.birth_country] ?? null : null,
      drafted: player.draft_year ? `${player.draft_year} · Rd ${player.draft_round} #${player.draft_pick}` : 'Undrafted',
      seasonLine: isGoalie && goalieStats
        ? `${goalieStats.season.wins}-${goalieStats.season.losses}-${goalieStats.season.otl} · ${goalieStats.season.savePct.toFixed(3).replace(/^0/, '')}`
        : hasSeason ? `${snap.season_goals ?? 0}G · ${snap.season_assists ?? 0}A · ${Number(snap.season_goals ?? 0) + Number(snap.season_assists ?? 0)} pts` : 'No games yet',
      photo: player.headshot_url ?? null,
      heat, heatDelta, rankLine,
      heatNote: isGoalie ? 'Heat tracks skater scoring' : undefined,
      energy,
      energyNote: lastPlayedDaysAgo != null ? `Last game ${lastPlayedDaysAgo === 0 ? 'today' : lastPlayedDaysAgo === 1 ? '1 day ago' : `${lastPlayedDaysAgo} days ago`}.` : null,
      archetype: archetype ? { name: archetype.label, blurb: archetype.basis, tags: archetype.tags.map(t => t.text) } : null,
      outBanner: outStatus ? {
        label: OUT_LABEL[outStatus],
        note: consecutiveGamesMissed ? `Missed ${consecutiveGamesMissed} straight team game${consecutiveGamesMissed === 1 ? '' : 's'}` : 'Not in recent lineups',
      } : null,
      bio: (
        <Suspense fallback={<div className="h-24 animate-pulse rounded-[10px]" style={{ background: 'var(--bg-card)' }} />}>
          <AIBio playerId={Number(id)} aiInput={aiInput} />
        </Suspense>
      ),
    },
    series: isGoalie ? [] : series,
    seasonAvgHeat: !isGoalie && hasSeason ? ppmToHeat(snap.season_ppm) : null,
    chips: formChips({ heats: series.map(p => p.heat), pointsByGame: games.slice(0, 10).map(g => (g.goals ?? 0) + (g.assists ?? 0)), energy, heat }),
    perfEval: (
      <Suspense fallback={<div className="h-28 animate-pulse rounded-lg" style={{ background: 'var(--bg)' }} />}>
        <AIPerfEval playerId={Number(id)} aiInput={aiInput} />
      </Suspense>
    ),
    last5: isGoalie ? goalieTiles(goalieStats?.recent) : last5Tiles(games),
    gameLog: isGoalie ? [] : gameLogRows(games.slice(0, 5), player.team_id),
    seasonLabel: seasonLabel(),
    seasonGames: isGoalie ? goalieStats?.season.gp ?? 0 : seaGames,
    seasonTiles: isGoalie ? goalieTiles(goalieStats?.season) : seasonTiles(snap),
    radar: isGoalie || !hasSeason ? [] : radarStats(snap, leagueAvg),
    vsRows: isGoalie || !hasSeason ? [] : vsLeagueRows(snap, leagueAvg),
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

async function AIBio({ playerId, aiInput }: { playerId: number; aiInput: PlayerAIInput }) {
  const { bio } = await getPlayerInsights(playerId, aiInput).catch(() => ({ bio: null, perfEval: null }));
  return bio ? <AIBioBox text={bio} /> : null;
}

async function AIPerfEval({ playerId, aiInput }: { playerId: number; aiInput: PlayerAIInput }) {
  const { perfEval } = await getPlayerInsights(playerId, aiInput).catch(() => ({ bio: null, perfEval: null }));
  if (!perfEval) {
    return <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Form analysis appears once there are enough recent games.</p>;
  }
  return <p className="text-[13px] leading-relaxed lg:text-sm" style={{ color: 'var(--text)', textWrap: 'pretty' }}>{perfEval}</p>;
}
