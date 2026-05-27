import type { Metadata } from 'next';
import { cache, Suspense } from 'react';
import PlayerRadarChart from '@/components/players/RadarChart';
import HeatTimeline from '@/components/players/HeatTimeline';
import HeatCircle from '@/components/ui/HeatCircle';
import { fetchPlayer, fetchLeagueAverages, daysAgo, deriveOutStatus } from '@/lib/data';
import { ppmToHeat, heatColor as getHeatColor } from '@/lib/heat';
import { getPlayerInsights } from '@/lib/ai';
import type { PlayerAIInput } from '@/lib/ai';
import { teamUrl } from '@/lib/urls';
import Link from 'next/link';

// Deduplicate fetchPlayer between generateMetadata and the page component
const cachedFetchPlayer = cache((id: string) => fetchPlayer(id).catch(() => null));

export const revalidate = 120;

export async function generateMetadata({ params }: { params: Promise<{ id: string; slug: string }> }): Promise<Metadata> {
  const { id } = await params;
  const data = await cachedFetchPlayer(id);
  if (!data?.player) return { title: 'Player' };
  const { player } = data;
  const name = `${player.first_name} ${player.last_name}`;
  const team = player.teams?.abbrev ?? '';
  const teamName = player.teams?.name ?? team;
  const pos  = player.position_code ?? '';
  const season = '2025–26';
  const title = `${name} Stats ${season}`;
  const desc = `${name} ${season} NHL stats — momentum score, recent form, game log and advanced analytics for the ${teamName} ${pos}.`;
  return {
    title,
    description: desc,
    openGraph: {
      title: `${name} — Hockey Momentum`,
      description: desc,
      images: player.headshot_url ? [{ url: player.headshot_url, width: 160, height: 160, alt: name }] : [],
    },
    twitter: {
      card: 'summary',
      title: `${name} — ${season} NHL Stats`,
      description: desc,
      ...(player.headshot_url && { images: [player.headshot_url] }),
    },
  };
}

const COUNTRY_FLAG: Record<string, string> = {
  CAN: '🇨🇦', USA: '🇺🇸', SWE: '🇸🇪', FIN: '🇫🇮',
  RUS: '🇷🇺', CZE: '🇨🇿', SVK: '🇸🇰', GER: '🇩🇪', DEU: '🇩🇪',
  AUT: '🇦🇹', CHE: '🇨🇭', NOR: '🇳🇴', DNK: '🇩🇰',
  LVA: '🇱🇻', BLR: '🇧🇾', UKR: '🇺🇦', FRA: '🇫🇷',
  AUS: '🇦🇺', NLD: '🇳🇱', GBR: '🇬🇧', HUN: '🇭🇺',
};

const TEAM_BG_COLORS: Record<string, string> = {
  ANA: '#945a2a', ARI: '#8c2633', UTA: '#1a5276',
  BOS: '#8b6914', BUF: '#003087', CGY: '#8c1c1c',
  CAR: '#7a0000', CHI: '#7a0618', COL: '#4a1726',
  CBJ: '#002654', DAL: '#004a30', DET: '#7a0a14',
  EDM: '#1a3060', FLA: '#041e42', LAK: '#333333',
  MIN: '#0f3022', MTL: '#6e1220', NSH: '#1a2a5c',
  NJD: '#7a0a14', NYI: '#003a6b', NYR: '#00277a',
  OTT: '#7a5c1a', PHI: '#8b2e00', PIT: '#1a1a1a',
  SEA: '#001628', SJS: '#004a50', STL: '#001e6b',
  TBL: '#001a5c', TOR: '#001845', VAN: '#00421e',
  VGK: '#252f34', WSH: '#041e42', WPG: '#041e42',
};

function SectionTitle({ main, accent }: { main: string; accent: string }) {
  return (
    <h2 style={{
      fontFamily: 'var(--font-fraunces), Georgia, serif',
      fontWeight: 900,
      fontSize: '1.3rem',
      letterSpacing: '-0.025em',
      lineHeight: 1.1,
    }}>
      <span style={{ color: 'var(--text-bright)' }}>{main} </span>
      <span style={{ color: 'var(--heat)' }}>{accent}</span>
    </h2>
  );
}

function rankBadge(rank: number | undefined) {
  if (!rank) return null;
  const label = rank === 1 ? 'ELITE' : rank <= 3 ? 'ELITE' : rank <= 10 ? 'TOP 10' : rank <= 25 ? 'TOP 25' : rank <= 50 ? 'TOP 50' : `#${rank}`;
  const color = rank <= 3 ? 'var(--neon)' : rank <= 10 ? 'var(--green)' : rank <= 25 ? 'var(--amber)' : 'var(--text)';
  return (
    <div className="flex flex-col items-center px-3 py-2 rounded-lg border"
      style={{ borderColor: color, background: `${color}12` }}>
      <span className="text-xs font-bold tracking-widest" style={{ color }}>{label}</span>
      <span className="text-xs mt-0.5" style={{ color: 'var(--text)' }}>RANK</span>
    </div>
  );
}

export default async function PlayerPage({ params }: { params: Promise<{ id: string; slug: string }> }) {
  const { id } = await params;
  const [data, leagueAvg] = await Promise.all([
    cachedFetchPlayer(id),
    fetchLeagueAverages().catch(() => null),
  ]);

  if (!data?.player) {
    return (
      <div className="flex items-center justify-center h-64">
        <p style={{ color: 'var(--text)' }}>Player not found</p>
      </div>
    );
  }

  const { player, metricTimeline, recentGames, consecutiveGamesMissed, lastPlayedDate, goalieStats } = data;
  const isGoalie = player.position_code === 'G';
  const latestSnapshot = metricTimeline?.[metricTimeline.length - 1] ?? {};
  const name = `${player.first_name} ${player.last_name}`;

  // Metric layer values
  const momPpm          = Number(latestSnapshot.momentum_ppm     ?? 0);
  const seaPpm          = Number(latestSnapshot.season_ppm       ?? 0);
  const carPpm          = Number(latestSnapshot.career_ppm       ?? 0);
  const momGoals        = Number(latestSnapshot.momentum_goals   ?? 0);
  const seaGoals        = Number(latestSnapshot.season_goals     ?? 0);
  const momAssists      = Number(latestSnapshot.momentum_assists ?? 0);
  const seaAssists      = Number(latestSnapshot.season_assists   ?? 0);
  const momShootPct     = Number(latestSnapshot.momentum_shooting_pct ?? 0);
  const seaShootPct     = Number(latestSnapshot.season_shooting_pct  ?? 0);
  const momGames        = Number(latestSnapshot.momentum_games   ?? 1);
  const seaGames        = Number(latestSnapshot.season_games     ?? 1);
  const energyBar       = Number(latestSnapshot.energy_bar       ?? 100);

  const pct = (v: number, max: number) => Math.min(100, Math.max(0, (v / max) * 100));
  const delta = (mom: number, sea: number) => sea > 0 ? ((mom - sea) / sea) * 100 : 0;

  const energyColor = energyBar >= 70 ? 'var(--green)' : energyBar >= 40 ? 'var(--amber)' : 'var(--red)';
  const energyLabel = energyBar >= 70 ? 'HIGH' : energyBar >= 40 ? 'MODERATE' : 'DRAINED';

  const currentHeat = ppmToHeat(momPpm);
  const prevSnapshot = metricTimeline && metricTimeline.length >= 2 ? metricTimeline[metricTimeline.length - 2] : null;
  const prevHeat = prevSnapshot ? ppmToHeat(Number(prevSnapshot.momentum_ppm ?? 0)) : null;
  const heatDelta = prevHeat !== null && currentHeat !== prevHeat ? currentHeat - prevHeat : undefined;

  const lastPlayedDaysAgo = lastPlayedDate ? daysAgo(lastPlayedDate) : null;
  const outStatus = deriveOutStatus(consecutiveGamesMissed ?? null, lastPlayedDaysAgo, player.in_minors ?? false);

  const lgPpm    = leagueAvg?.seasonPpm      ?? 0;
  const lgG      = leagueAvg?.goalsPerGame   ?? 0;
  const lgA      = leagueAvg?.assistsPerGame ?? 0;
  const lgShoot  = leagueAvg?.shootingPct    ?? 0;
  const lgEnergy = Math.round(leagueAvg?.energyBar ?? 85);
  const lgP95G   = leagueAvg?.p95GoalsPerGame     ?? 0;
  const lgP5G    = leagueAvg?.p5GoalsPerGame      ?? 0;
  const lgP95A   = leagueAvg?.p95AssistsPerGame   ?? 0;
  const lgP5A    = leagueAvg?.p5AssistsPerGame    ?? 0;
  const lgP95PM  = leagueAvg?.p95PlusMinusPerGame ?? 0;
  const lgP5PM   = leagueAvg?.p5PlusMinusPerGame  ?? 0;
  const vsLeague = (playerVal: number, lgVal: number) =>
    lgVal > 0 ? ((playerVal - lgVal) / lgVal) * 100 : 0;

  const perfMetrics = [
    {
      label: 'Points Per Match (PPM)',
      momVal: momPpm.toFixed(3),
      seaVal: seaPpm.toFixed(3),
      lgVal:  lgPpm.toFixed(3),
      momFill: pct(momPpm, 0.15),
      seaFill: pct(seaPpm, 0.15),
      lgFill:  pct(lgPpm, 0.15),
      delta: delta(momPpm, seaPpm),
      vsLeague: vsLeague(seaPpm, lgPpm),
    },
    {
      label: 'Goals / Game',
      momVal: (momGoals / Math.max(1, momGames)).toFixed(2),
      seaVal: (seaGoals / Math.max(1, seaGames)).toFixed(2),
      lgVal:  lgG.toFixed(2),
      momFill: pct(momGoals / Math.max(1, momGames), 0.7),
      seaFill: pct(seaGoals / Math.max(1, seaGames), 0.7),
      lgFill:  pct(lgG, 0.7),
      delta: delta(momGoals / Math.max(1, momGames), seaGoals / Math.max(1, seaGames)),
      vsLeague: vsLeague(seaGoals / Math.max(1, seaGames), lgG),
    },
    {
      label: 'Assists / Game',
      momVal: (momAssists / Math.max(1, momGames)).toFixed(2),
      seaVal: (seaAssists / Math.max(1, seaGames)).toFixed(2),
      lgVal:  lgA.toFixed(2),
      momFill: pct(momAssists / Math.max(1, momGames), 1.0),
      seaFill: pct(seaAssists / Math.max(1, seaGames), 1.0),
      lgFill:  pct(lgA, 1.0),
      delta: delta(momAssists / Math.max(1, momGames), seaAssists / Math.max(1, seaGames)),
      vsLeague: vsLeague(seaAssists / Math.max(1, seaGames), lgA),
    },
    {
      label: 'Shooting Efficiency',
      momVal: `${(momShootPct * 100).toFixed(1)}%`,
      seaVal: `${(seaShootPct * 100).toFixed(1)}%`,
      lgVal:  `${(lgShoot * 100).toFixed(1)}%`,
      momFill: pct(momShootPct, 0.25),
      seaFill: pct(seaShootPct, 0.25),
      lgFill:  pct(lgShoot, 0.25),
      delta: delta(momShootPct, seaShootPct),
      vsLeague: vsLeague(seaShootPct, lgShoot),
    },
  ];

  // Radar data — all 6 dimensions from snapshot data
  const breakoutDelta = Number(latestSnapshot.breakout_delta ?? 0);
  const leagueMax = {
    ppm: 0.15, shootingPct: 0.25,
    goalsPerGame: 0.7, assistsPerGame: 1.0,
    trend: 0.06,  // breakout_delta scale: +0.06 = strong positive trend
    energy: 100,
  };
  const momentumRadar = {
    ppm: momPpm,
    shootingPct: momShootPct,
    goalsPerGame: momGoals / Math.max(1, momGames),
    assistsPerGame: momAssists / Math.max(1, momGames),
    trend: Math.max(0, breakoutDelta),  // only positive trend shown; negative = below season baseline
    energy: energyBar,
  };
  const seasonRadar = {
    ppm: seaPpm,
    shootingPct: seaShootPct,
    goalsPerGame: seaGoals / Math.max(1, seaGames),
    assistsPerGame: seaAssists / Math.max(1, seaGames),
    trend: 0,
    energy: energyBar,
  };
  const leagueAvgRadar = leagueAvg ? {
    ppm: leagueAvg.seasonPpm,
    shootingPct: leagueAvg.shootingPct,
    goalsPerGame: leagueAvg.goalsPerGame,
    assistsPerGame: leagueAvg.assistsPerGame,
    trend: 0,
    energy: leagueAvg.energyBar,
  } : undefined;

  // ── AI inputs ────────────────────────────────────────────────────────────────
  const playerTeamAbbrev = player.teams?.abbrev ?? '';
  const age = player.birth_date
    ? Math.floor((Date.now() - new Date(player.birth_date).getTime()) / (365.25 * 86400000))
    : null;

  const aiInput: PlayerAIInput = {
    name,
    team:            playerTeamAbbrev,
    position:        player.position_code ?? '',
    rank:            latestSnapshot.momentum_rank ?? null,
    // Bio
    birthCity:       player.birth_city       ?? null,
    birthCountry:    player.birth_country    ?? null,
    age,
    heightInches:    player.height_inches    ?? null,
    weightPounds:    player.weight_pounds    ?? null,
    shootsCatches:   player.shoots_catches   ?? null,
    draftYear:       player.draft_year       ?? null,
    draftRound:      player.draft_round      ?? null,
    draftPick:       player.draft_pick       ?? null,
    draftTeam:       player.draft_team_abbrev ?? null,
    careerGames:     player.career_games     ?? 0,
    careerGoals:     player.career_goals     ?? 0,
    careerAssists:   player.career_assists   ?? 0,
    careerPlusMinus: player.career_plus_minus ?? null,
    // Season
    seaGames,
    seaGoals,
    seaAssists,
    seaPoints:       seaGoals + seaAssists,
    seaPpm,
    seaShootPct,
    seaToiMin:       Number(latestSnapshot.season_toi_sec ?? 0) / 60 / Math.max(1, seaGames),
    // Momentum
    momGames,
    momGoals,
    momAssists,
    momPpm,
    momShootPct,
    momToiMin:       Number(latestSnapshot.momentum_toi_sec ?? 0) / 60 / Math.max(1, momGames),
    energyBar,
    breakoutDelta:   Number(latestSnapshot.breakout_delta ?? 0),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recentGames:     (recentGames as any[]).slice(0, 5).map((g: any) => {
      const homeAbbrev = g.games?.home_team?.abbrev ?? '';
      const awayAbbrev = g.games?.away_team?.abbrev ?? '';
      const isHome = g.games?.home_team_id === player.team_id;
      const opponent = isHome ? awayAbbrev : homeAbbrev;
      return {
        date:      g.games?.game_date ?? '',
        opponent,
        goals:     g.goals      ?? 0,
        assists:   g.assists    ?? 0,
        plusMinus: g.plus_minus ?? 0,
        toiMin:    (g.toi_seconds ?? 0) / 60,
      };
    }),
  };

  // ── L5 stat row helpers ────────────────────────────────────────────────────
  const last5Games = (recentGames ?? []).slice(0, 5);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const l5W = last5Games.filter((g: any) => {
    const game = g.games;
    const isHome = player.team_id === game?.home_team_id;
    const ts = isHome ? game?.home_score : game?.away_score;
    const os = isHome ? game?.away_score : game?.home_score;
    return ts !== null && os !== null && ts > os;
  }).length;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const l5L = last5Games.filter((g: any) => {
    const game = g.games;
    const isHome = player.team_id === game?.home_team_id;
    const ts = isHome ? game?.home_score : game?.away_score;
    const os = isHome ? game?.away_score : game?.home_score;
    return ts !== null && os !== null && ts < os;
  }).length;
  const l5OT = last5Games.length - l5W - l5L;

  // L5 stat cells — hoisted so each sub-card can render independently
  const l5PlusMinus = Number(latestSnapshot.momentum_plus_minus ?? 0);
  const l5ToiSec    = Number(latestSnapshot.momentum_toi_sec ?? 0);
  const l5ToiPerGm  = momGames > 0 ? l5ToiSec / momGames : 0;
  const l5ToiMin    = Math.floor(l5ToiPerGm / 60);
  const l5ToiSecPad = String(Math.round(l5ToiPerGm % 60)).padStart(2, '0');
  const l5ShootDiff = (momShootPct - seaShootPct) * 100;

  // Trend: compare L5 per-game rate vs full-season per-game rate
  const seaToiPerGm   = seaGames > 0 ? Number(latestSnapshot.season_toi_sec ?? 0) / seaGames : 0;
  const seaPtsPerGm   = seaGames > 0 ? (seaGoals + seaAssists) / seaGames : 0;
  const l5PtsPerGm    = momGames > 0 ? (momGoals + momAssists) / momGames : 0;
  const seaPlMinPerGm = seaGames > 0 ? Number(latestSnapshot.season_plus_minus ?? 0) / seaGames : 0;
  const l5PlMinPerGm  = momGames > 0 ? l5PlusMinus / momGames : 0;
  const mkTrend = (up: boolean, down: boolean) => up ? 'up' as const : down ? 'down' as const : 'neutral' as const;

  const l5Cells = [
    { label: 'Pts',    value: String(momGoals + momAssists), sub: `${momGoals}G · ${momAssists}A`,
      highlight: momGoals + momAssists > 2, negative: false,
      trend: mkTrend(l5PtsPerGm > seaPtsPerGm + 0.05, l5PtsPerGm < seaPtsPerGm - 0.05) },
    { label: 'TOI/gm', value: l5ToiPerGm > 0 ? `${l5ToiMin}:${l5ToiSecPad}` : '—', sub: 'L5 avg',
      highlight: false, negative: false,
      trend: mkTrend(l5ToiPerGm > seaToiPerGm + 30, l5ToiPerGm < seaToiPerGm - 30) },
    { label: 'S%',     value: `${(momShootPct * 100).toFixed(0)}%`,
      sub: seaShootPct > 0 ? `${l5ShootDiff > 0 ? '+' : ''}${l5ShootDiff.toFixed(1)}% vs avg` : '',
      highlight: momShootPct > seaShootPct, negative: false,
      trend: mkTrend(l5ShootDiff > 1, l5ShootDiff < -1) },
    { label: '+/-',    value: `${l5PlusMinus > 0 ? '+' : ''}${l5PlusMinus}`, sub: 'L5',
      highlight: l5PlusMinus > 0, negative: l5PlusMinus < 0,
      trend: mkTrend(l5PlMinPerGm > seaPlMinPerGm + 0.1, l5PlMinPerGm < seaPlMinPerGm - 0.1) },
  ];

  // Game events for HeatTimeline cumulative overlays (skaters only)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gameEvents = isGoalie ? [] : (recentGames ?? []).map((g: any) => ({
    date: String(g.games?.game_date ?? '').slice(5, 10).replace('-', '/'),
    fullDate: String(g.games?.game_date ?? '').slice(0, 10),
    goals: Number(g.goals ?? 0),
    assists: Number(g.assists ?? 0),
    plusMinus: Number(g.plus_minus ?? 0),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  })).filter((e: any) => e.date && e.fullDate);

  return (
    <div className="max-w-5xl mx-auto pb-20 md:pb-0 space-y-4">

      {/* 1. Injury banner — unchanged ─────────────────────────────────────────── */}
      {outStatus && (() => {
        const isMinors  = outStatus === 'minors';
        const isInjured = outStatus === 'injured';
        const isScratch = outStatus === 'scratch';
        const label = isMinors ? 'MINORS' : isInjured ? 'INJURED' : isScratch ? 'SCRATCHED' : 'OUT';
        const reason = isMinors
          ? 'Assigned to AHL affiliate — not on active NHL roster'
          : isInjured
          ? 'Extended absence — likely on injured reserve'
          : isScratch
          ? 'Not in lineup — possible healthy scratch or performance decision'
          : 'Not in lineup — short-term absence';
        const bgColor    = isMinors ? 'rgba(99,179,237,0.08)' : isInjured ? 'rgba(239,68,68,0.08)' : isScratch ? 'rgba(251,191,36,0.08)' : 'rgba(239,68,68,0.08)';
        const borderColor = isMinors ? 'rgba(99,179,237,0.4)' : isInjured ? 'rgba(239,68,68,0.4)' : isScratch ? 'rgba(251,191,36,0.35)' : 'rgba(239,68,68,0.4)';
        const textColor  = isMinors ? 'var(--neon)' : isInjured ? 'var(--red)' : isScratch ? 'var(--amber)' : 'var(--red)';
        return (
          <div className="rounded-xl border px-4 py-4 flex flex-col sm:flex-row sm:items-center gap-3"
            style={{ background: bgColor, borderColor }}>
            <div className="text-xl font-black tracking-tight px-3 py-1.5 rounded-lg"
              style={{ background: isMinors ? 'rgba(99,179,237,0.15)' : isInjured ? 'rgba(239,68,68,0.15)' : isScratch ? 'rgba(251,191,36,0.15)' : 'rgba(239,68,68,0.15)', color: textColor }}>
              {label}
            </div>
            <div className="flex-1">
              <div className="font-bold text-sm" style={{ color: textColor }}>{reason}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text)' }}>
                Last played{' '}
                <span className="font-semibold" style={{ color: 'var(--text-bright)' }}>
                  {lastPlayedDate
                    ? new Date(lastPlayedDate + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : '—'}
                </span>
                {lastPlayedDaysAgo !== null && (
                  <> · <span className="font-semibold" style={{ color: 'var(--text-bright)' }}>{lastPlayedDaysAgo} days ago</span></>
                )}
                {consecutiveGamesMissed !== null && consecutiveGamesMissed > 0 && (
                  <> · <span className="font-semibold" style={{ color: 'var(--text-bright)' }}>
                    {consecutiveGamesMissed} consecutive game{consecutiveGamesMissed !== 1 ? 's' : ''} missed
                  </span></>
                )}
              </div>
            </div>
            {player.injury_status && (
              <div className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.3)' }}>
                {player.injury_status}
              </div>
            )}
          </div>
        );
      })()}

      {/* 2a. Mobile hero — stacked layout ──────────────────────────────────── */}
      <div className="md:hidden space-y-3">

        {/* Photo card */}
        <div className="relative rounded-xl overflow-hidden" style={{ height: 220, background: 'var(--bg-card)' }}>
          {player.headshot_url ? (
            <img src={player.headshot_url} alt={name} className="w-full h-full object-cover object-top" />
          ) : (
            <div className="w-full h-full" style={{ background: 'var(--bg-card)' }} />
          )}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 50%)' }} />

          {/* Team logo — top left */}
          {player.teams?.abbrev && (
            <div className="absolute top-3 left-3 z-10">
              <img
                src={`https://assets.nhle.com/logos/nhl/svg/${player.teams.abbrev}_light.svg`}
                alt={player.teams.abbrev}
                style={{ width: 44, height: 44, objectFit: 'contain', filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.7))' }}
              />
            </div>
          )}

          {/* Out status badge — top right */}
          {outStatus && (() => {
            const label = outStatus === 'minors' ? 'MINORS' : outStatus === 'injured' ? 'INJURED' : outStatus === 'scratch' ? 'SCRATCH' : 'OUT';
            const bg = outStatus === 'minors' ? 'rgba(99,179,237,0.85)' : outStatus === 'scratch' ? 'rgba(251,191,36,0.85)' : 'rgba(239,68,68,0.85)';
            return (
              <div className="absolute top-3 right-3 px-2 py-0.5 rounded font-bold text-xs"
                style={{ background: bg, color: '#fff' }}>{label}</div>
            );
          })()}

          {/* Jersey number — bottom right ghost */}
          {player.sweater_number && (
            <div className="absolute bottom-2 right-3 font-black leading-none select-none pointer-events-none"
              style={{ fontSize: 52, color: 'rgba(255,255,255,0.13)', letterSpacing: '-0.05em' }}>
              {player.sweater_number}
            </div>
          )}
        </div>

        {/* Name block */}
        <div>
          <div className="flex items-center flex-wrap gap-1.5 text-xs font-semibold tracking-widest uppercase mb-1.5" style={{ color: 'var(--text)', opacity: 0.7 }}>
            {player.teams?.id ? (
              <Link href={teamUrl(player.teams.id, player.teams.name ?? player.teams.abbrev ?? '')}
                style={{ color: 'var(--heat)' }}>{player.teams.abbrev}</Link>
            ) : (
              <span style={{ color: 'var(--heat)' }}>{player.teams?.abbrev}</span>
            )}
            {player.position_code && <><span>·</span><span>{player.position_code}</span></>}
            {age && <><span>·</span><span>Age {age}</span></>}
          </div>
          <h1 style={{ lineHeight: 0.9, letterSpacing: '-0.025em', fontFamily: 'var(--font-fraunces), Georgia, serif' }}>
            <span className="block font-black" style={{ fontSize: '2.4rem', color: 'var(--text-bright)' }}>
              {player.first_name}
            </span>
            <span className="block font-black" style={{ fontSize: '2.4rem', color: 'var(--heat)' }}>
              {player.last_name}.
            </span>
          </h1>
        </div>

        {/* 2-col: HEAT + ENERGY */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border p-4 flex flex-col items-center gap-2"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <span className="text-xs font-semibold tracking-widest uppercase self-start" style={{ color: 'var(--text)', opacity: 0.6 }}>Heat</span>
            <HeatCircle heat={currentHeat} size={72} delta={heatDelta} />
            {latestSnapshot.momentum_rank && (
              <span className="text-xs" style={{ color: 'var(--text)' }}>
                <span className="font-bold" style={{ color: 'var(--heat)' }}>#{latestSnapshot.momentum_rank}</span> ranked
              </span>
            )}
          </div>

          <div className="rounded-xl border p-4 flex flex-col gap-2 justify-center"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--text)', opacity: 0.6 }}>Energy</span>
            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-3xl font-black font-mono" style={{ color: energyColor }}>{energyBar}</span>
                <span className="text-xs font-bold" style={{ color: energyColor }}>{energyLabel}</span>
              </div>
              <div className="rounded-full overflow-hidden" style={{ background: 'var(--border)', height: 6 }}>
                <div className="h-full rounded-full" style={{ width: `${energyBar}%`, background: energyColor }} />
              </div>
            </div>
            <span className="text-xs leading-snug" style={{ color: 'var(--text)', opacity: 0.55 }}>
              {energyBar >= 70 ? 'Fresh — low workload' : energyBar >= 40 ? 'Moderate fatigue' : 'Drained — heavy load'}
            </span>
          </div>
        </div>

        {/* 2-col: BORN + DRAFTED */}
        {(player.birth_city || player.birth_country || player.draft_year) && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <span className="text-xs font-semibold tracking-widest uppercase block mb-2" style={{ color: 'var(--text)', opacity: 0.6 }}>Born</span>
              {(player.birth_city || player.birth_country) && (
                <div className="text-sm font-semibold leading-snug" style={{ color: 'var(--text-bright)' }}>
                  {[player.birth_city, player.birth_country].filter(Boolean).join(', ')}
                </div>
              )}
              {player.birth_country && COUNTRY_FLAG[player.birth_country] && (
                <div className="text-2xl mt-1">{COUNTRY_FLAG[player.birth_country]}</div>
              )}
              {player.height_inches && (
                <div className="text-xs mt-2 font-mono" style={{ color: 'var(--text)', opacity: 0.7 }}>
                  {Math.floor(player.height_inches / 12)}′{player.height_inches % 12}″{player.weight_pounds ? ` · ${player.weight_pounds} lb` : ''}
                </div>
              )}
            </div>

            <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <span className="text-xs font-semibold tracking-widest uppercase block mb-2" style={{ color: 'var(--text)', opacity: 0.6 }}>Drafted</span>
              {player.draft_year ? (
                <>
                  <div className="text-2xl font-black font-mono" style={{ color: 'var(--text-bright)' }}>{player.draft_year}</div>
                  <div className="text-xs mt-1 leading-snug" style={{ color: 'var(--text)' }}>
                    R{player.draft_round} Pick #{player.draft_pick}
                    {player.draft_team_abbrev && <div style={{ color: 'var(--heat)' }}>{player.draft_team_abbrev}</div>}
                  </div>
                </>
              ) : (
                <div className="text-sm font-semibold mt-1" style={{ color: 'var(--text)' }}>Undrafted</div>
              )}
              {player.career_games ? (
                <div className="text-xs mt-2 font-mono" style={{ color: 'var(--text)', opacity: 0.6 }}>
                  {player.career_games} GP · {player.career_goals ?? 0}G {player.career_assists ?? 0}A
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* AI CHARACTER card */}
        <Suspense fallback={<div className="h-20 rounded-xl animate-pulse" style={{ background: 'var(--bg-card)', opacity: 0.5 }} />}>
          <AIBioMobileCard playerId={Number(id)} aiInput={aiInput} />
        </Suspense>

      </div>

      {/* 2b. Cinematic hero — desktop only ─────────────────────────────────── */}
      <div className="hidden md:block">
      <div className="relative rounded-xl overflow-hidden" style={{ background: 'var(--bg-card)', minHeight: 380 }}>

        {/* Jersey ghost — full background */}
        {player.sweater_number && (
          <div className="absolute select-none pointer-events-none"
            style={{ right: -15, top: -40, fontSize: 380, fontWeight: 900, lineHeight: 1,
                     color: 'rgba(255,90,36,0.055)', letterSpacing: '-0.05em', zIndex: 0 }}>
            {player.sweater_number}
          </div>
        )}
        {/* Warm right overlay */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to right, transparent 35%, rgba(160,50,0,0.09) 100%)', zIndex: 0 }} />

        {/* 3-column grid: photo | content | stats */}
        <div className="relative z-10 grid p-5 gap-5 items-start" style={{ gridTemplateColumns: '260px 1fr 220px' }}>

          {/* LEFT: Photo — blends into hero background */}
          <div className="relative" style={{ height: 340 }}>
            {player.headshot_url && (
              <img src={player.headshot_url} alt={name}
                className="absolute inset-0 w-full h-full object-cover object-top"
                style={{ borderRadius: 12 }} />
            )}
            {/* Fade photo edges into card background */}
            <div className="absolute inset-x-0 bottom-0 pointer-events-none"
              style={{ height: '45%', background: 'linear-gradient(to top, var(--bg-card) 10%, transparent 100%)', borderRadius: '0 0 12px 12px' }} />
            <div className="absolute inset-y-0 right-0 pointer-events-none"
              style={{ width: '35%', background: 'linear-gradient(to right, transparent 0%, var(--bg-card) 100%)' }} />

            {/* Team logo — top left */}
            {player.teams?.abbrev && (
              <div className="absolute top-3 left-3 z-10">
                <img
                  src={`https://assets.nhle.com/logos/nhl/svg/${player.teams.abbrev}_light.svg`}
                  alt={player.teams.abbrev}
                  style={{ width: 52, height: 52, objectFit: 'contain', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.7))' }}
                />
              </div>
            )}

            {/* Out status */}
            {outStatus && (() => {
              const label = outStatus === 'minors' ? 'MINORS' : outStatus === 'injured' ? 'INJURED' : outStatus === 'scratch' ? 'SCRATCH' : 'OUT';
              const bg = outStatus === 'minors' ? 'rgba(99,179,237,0.85)' : outStatus === 'scratch' ? 'rgba(251,191,36,0.85)' : 'rgba(239,68,68,0.85)';
              return (
                <div className="absolute top-3 right-3 z-10 px-2 py-0.5 rounded font-bold text-xs"
                  style={{ background: bg, color: '#fff' }}>{label}</div>
              );
            })()}

            {/* Jersey # bottom right */}
            {player.sweater_number && (
              <div className="absolute bottom-3 right-4 z-10 font-bold"
                style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', letterSpacing: '0.05em' }}>
                #{player.sweater_number}
              </div>
            )}
          </div>

          {/* CENTER: Meta + name + info trio + AI */}
          <div className="flex flex-col gap-4">

            {/* Meta row */}
            <div className="flex items-center flex-wrap gap-2 text-xs font-semibold tracking-widest uppercase"
              style={{ color: 'rgba(255,255,255,0.38)' }}>
              {player.teams?.id ? (
                <Link href={teamUrl(player.teams.id, player.teams.name ?? player.teams.abbrev ?? '')}
                  className="hover:opacity-80 transition-opacity"
                  style={{ color: 'rgba(255,255,255,0.38)' }}>
                  {player.teams.name ?? player.teams.abbrev}
                </Link>
              ) : (
                <span>{player.teams?.name ?? player.teams?.abbrev}</span>
              )}
              {player.position_code && <><span style={{ color: 'rgba(255,255,255,0.18)' }}>·</span><span>{player.position_code}</span></>}
              {age && <><span style={{ color: 'rgba(255,255,255,0.18)' }}>·</span><span>Age {age}</span></>}
              {player.shoots_catches && (
                <><span style={{ color: 'rgba(255,255,255,0.18)' }}>·</span>
                <span>{player.shoots_catches === 'L' ? 'L' : 'R'}-{player.position_code === 'G' ? 'catches' : 'shoots'}</span></>
              )}
              {player.height_inches && (
                <><span style={{ color: 'rgba(255,255,255,0.18)' }}>·</span>
                <span>{Math.floor(player.height_inches / 12)}′{player.height_inches % 12}″</span></>
              )}
              {player.weight_pounds && (
                <><span style={{ color: 'rgba(255,255,255,0.18)' }}>·</span><span>{player.weight_pounds} lb</span></>
              )}
            </div>

            {/* Big name */}
            <h1 style={{ lineHeight: 0.88, letterSpacing: '-0.03em', fontFamily: 'var(--font-fraunces), Georgia, serif' }}>
              <span className="block font-black" style={{ fontSize: 'clamp(3rem, 5.5vw, 4.5rem)', color: 'var(--text-bright)' }}>
                {player.first_name}
              </span>
              <span className="block font-black" style={{ fontSize: 'clamp(3rem, 5.5vw, 4.5rem)', color: 'var(--heat)' }}>
                {player.last_name}.
              </span>
            </h1>

            {/* Info trio: BORN · DRAFTED · SEASON */}
            <div className="flex gap-8">
              {(player.birth_city || player.birth_country) && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>Born</span>
                  <div className="flex items-center gap-1.5">
                    {player.birth_country && COUNTRY_FLAG[player.birth_country] && (
                      <span style={{ fontSize: 14, lineHeight: 1 }}>{COUNTRY_FLAG[player.birth_country]}</span>
                    )}
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-bright)' }}>
                      {[player.birth_city, player.birth_country].filter(Boolean).join(', ')}
                    </span>
                  </div>
                </div>
              )}
              {player.draft_year && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>Drafted</span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-bright)' }}>
                    {player.draft_year}{player.draft_round === 1 && player.draft_pick === 1
                      ? ' · 1st overall'
                      : player.draft_round ? ` · R${player.draft_round} #${player.draft_pick}` : ''}
                  </span>
                </div>
              )}
              {seaGames > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>Season</span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-bright)' }}>
                    {seaGoals}G · {seaAssists}A · {seaGoals + seaAssists} pts
                  </span>
                </div>
              )}
            </div>

            {/* AI CHARACTER */}
            <div>
              <div className="inline-flex items-center px-2.5 py-1 rounded-full mb-3 text-xs font-bold tracking-widest uppercase"
                style={{ background: 'rgba(255,90,36,0.15)', color: 'var(--heat)', border: '1px solid rgba(255,90,36,0.3)' }}>
                AI Character
              </div>
              <Suspense fallback={<div className="h-12 rounded animate-pulse" style={{ background: 'var(--border)', opacity: 0.4 }} />}>
                <AIBioSection playerId={Number(id)} aiInput={aiInput} />
              </Suspense>
            </div>

          </div>

          {/* RIGHT: Heat + Energy cards */}
          <div className="flex flex-col gap-3">

            {/* HEAT · L5 */}
            <div className="rounded-xl border p-4" style={{ background: 'rgba(0,0,0,0.3)', borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-1.5 mb-3">
                <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--heat)' }}>Heat</span>
                <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
                <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>L5</span>
              </div>
              <div className="flex items-center gap-3">
                <HeatCircle heat={currentHeat} size={80} delta={heatDelta} />
                <div className="flex flex-col gap-1">
                  {heatDelta !== undefined && heatDelta !== 0 && (
                    <span className="text-sm font-bold" style={{ color: heatDelta > 0 ? 'var(--green)' : 'var(--red)' }}>
                      {heatDelta > 0 ? '↑' : '↓'} {heatDelta > 0 ? '+' : ''}{heatDelta}
                    </span>
                  )}
                  {latestSnapshot.momentum_rank && (
                    <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      #{latestSnapshot.momentum_rank} overall
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ENERGY */}
            <div className="rounded-xl border p-4" style={{ background: 'rgba(0,0,0,0.3)', borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold tracking-widest uppercase" style={{ color: energyColor }}>Energy</span>
                <span className="text-xs font-bold tracking-widest uppercase" style={{ color: energyColor }}>{energyLabel}</span>
              </div>
              <div className="rounded-full overflow-hidden mb-2" style={{ background: 'var(--border)', height: 6 }}>
                <div className="h-full rounded-full" style={{ width: `${energyBar}%`, background: energyColor }} />
              </div>
              <div className="text-2xl font-black font-mono mb-1" style={{ color: energyColor }}>{energyBar}</div>
              <span className="text-xs leading-snug" style={{ color: 'rgba(255,255,255,0.38)' }}>
                {lastPlayedDaysAgo !== null ? `Last game ${lastPlayedDaysAgo}d ago. ` : ''}
                {energyBar >= 70 ? 'Fresh — manageable workload' : energyBar >= 40 ? 'Moderate — watch for fatigue' : 'Drained — heavy recent load'}
              </span>
            </div>

          </div>

        </div>
      </div>
      </div>{/* end hidden md:block */}

      {/* 4. Form tracker ─────────────────────────────────────────────────────── */}
      {(metricTimeline?.length ?? 0) > 0 && (
        <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="px-5 pt-5 pb-1">
            <SectionTitle main="Form" accent="tracker." />
          </div>
          <HeatTimeline snapshots={metricTimeline ?? []} leaguePpm={lgPpm} gameEvents={gameEvents}
            leagueGoalsPerGame={lgG} leagueAssistsPerGame={lgA}
            p95GoalsPerGame={lgP95G} p5GoalsPerGame={lgP5G}
            p95AssistsPerGame={lgP95A} p5AssistsPerGame={lgP5A}
            p95PlusMinusPerGame={lgP95PM} p5PlusMinusPerGame={lgP5PM} />
        </div>
      )}

      {/* 5a. Recent form — AI perf eval ──────────────────────────────────────── */}
      {last5Games.length > 0 && (
        <div className="rounded-xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <SectionTitle main="Recent" accent="form." />
          <div className="mt-3">
            <Suspense fallback={<div className="h-8 rounded animate-pulse" style={{ background: 'var(--border)', opacity: 0.4 }} />}>
              <AIPerfSection playerId={Number(id)} aiInput={aiInput} />
            </Suspense>
          </div>
        </div>
      )}

      {/* 5b. Last 5 stats ─────────────────────────────────────────────────────── */}
      {!isGoalie && last5Games.length > 0 && momGames > 0 && (
        <div className="rounded-xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <SectionTitle main="Last 5" accent="stats." />
          <div className="grid grid-cols-4 gap-3 mt-4">
            {l5Cells.map((cell) => (
              <div key={cell.label} className="relative rounded-xl border flex flex-col items-center py-3 px-2 gap-0.5"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
                {cell.trend !== 'neutral' && (
                  <span className="absolute top-1.5 right-2 text-xs font-bold leading-none"
                    style={{ color: cell.trend === 'up' ? 'var(--green)' : 'var(--red)' }}>
                    {cell.trend === 'up' ? '▲' : '▼'}
                  </span>
                )}
                <span className="text-2xl font-black font-mono"
                  style={{ color: cell.negative ? 'var(--red)' : cell.highlight ? 'var(--heat)' : 'var(--text-bright)' }}>
                  {cell.value}
                </span>
                <span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>{cell.label}</span>
                {cell.sub && (
                  <span className="text-xs font-mono" style={{ color: 'var(--text)', opacity: 0.55 }}>{cell.sub}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5c. Game log ─────────────────────────────────────────────────────────── */}
      {last5Games.length > 0 && (
        <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <SectionTitle main="Game" accent="log." />
            {!isGoalie && (
              <span className="text-xs font-mono font-semibold" style={{ color: 'var(--heat)' }}>
                {l5W}W–{l5L}L–{l5OT}OT
              </span>
            )}
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {last5Games.map((g: any, i: number) => {
              const game = g.games;
              const isHome = player.team_id === game?.home_team_id;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const opponentAbbrev = isHome ? (game?.away_team as any)?.abbrev : (game?.home_team as any)?.abbrev;
              const teamScore  = isHome ? game?.home_score : game?.away_score;
              const oppScore   = isHome ? game?.away_score : game?.home_score;
              const hasResult  = teamScore !== null && oppScore !== null;
              const won        = hasResult && teamScore > oppScore;
              const lost       = hasResult && teamScore < oppScore;
              const toiMin     = Math.floor(Number(g.toi_seconds ?? 0) / 60);
              const toiSec     = String(Number(g.toi_seconds ?? 0) % 60).padStart(2, '0');
              const gameDate   = String(game?.game_date ?? '').slice(5);
              const heatRaw    = Math.min(99, Math.round((g.points_per_minute ?? 0) * 600));
              const gameHeatColor = getHeatColor(heatRaw);

              return (
                <div key={i} className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3"
                  style={{ background: i % 2 === 0 ? 'var(--bg)' : 'var(--bg-card)' }}>

                  {/* VS + date */}
                  <div className="flex-shrink-0 w-20">
                    {opponentAbbrev && (
                      <div className="text-xs mb-0.5" style={{ color: 'var(--text)' }}>
                        {isHome ? 'VS' : '@'} {opponentAbbrev}
                      </div>
                    )}
                    <div className="text-xs font-mono" style={{ color: 'var(--text)' }}>{gameDate || '—'}</div>
                  </div>

                  {/* Result badge + score */}
                  <div className="flex items-center gap-1.5 flex-shrink-0 w-20">
                    {hasResult ? (
                      <>
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded"
                          style={{
                            background: won ? 'rgba(34,197,94,0.15)' : lost ? 'rgba(239,68,68,0.15)' : 'rgba(160,174,192,0.1)',
                            color: won ? 'var(--green)' : lost ? 'var(--red)' : 'var(--text)',
                          }}>
                          {won ? 'WIN' : lost ? 'LOSS' : 'OT'}
                        </span>
                        <span className="text-sm font-mono font-bold" style={{ color: 'var(--text-bright)' }}>
                          {teamScore}–{oppScore}
                        </span>
                      </>
                    ) : null}
                  </div>

                  {isGoalie ? (
                    <div className="flex items-center gap-2 sm:gap-4 flex-1">
                      <StatPill label="SA" value={String(g.shots_against ?? 0)} />
                      <StatPill label="GA" value={String(g.goals_against ?? 0)} highlight={Number(g.goals_against) === 0} />
                      <StatPill
                        label="SV%"
                        value={g.save_pct != null ? Number(g.save_pct).toFixed(3).replace(/^0/, '') : '—'}
                        highlight={Number(g.save_pct ?? 0) >= 0.93}
                        bold
                      />
                      <span className="text-xs font-mono hidden sm:block" style={{ color: 'var(--text)' }}>
                        {toiMin}:{toiSec} TOI
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 sm:gap-4 flex-1">
                      <StatPill label="G" value={String(g.goals ?? 0)} highlight={Number(g.goals) > 0} />
                      <StatPill label="A" value={String(g.assists ?? 0)} highlight={Number(g.assists) > 1} />
                      <span className="text-xs font-mono hidden sm:block" style={{ color: 'var(--text)' }}>
                        {toiMin}:{toiSec} TOI
                      </span>
                    </div>
                  )}

                  {/* HEAT number — skaters only */}
                  {!isGoalie && (
                    <div className="ml-auto flex-shrink-0 text-sm font-mono font-bold"
                      style={{ color: heatRaw === 0 ? 'var(--text)' : gameHeatColor }}>
                      {heatRaw === 0 ? '—' : heatRaw}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Where he ranks (skaters only) ────────────────────────────────────── */}
      {!isGoalie && latestSnapshot.momentum_rank && (
        <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="mb-3">
            <SectionTitle main={`Where ${player.first_name}`} accent="ranks." />
          </div>
          <div className="flex flex-col gap-3">
            {[
              { label: 'Heat score', fill: Math.min(100, energyBar), rank: latestSnapshot.momentum_rank },
              { label: 'PPM · momentum', fill: pct(momPpm, 0.15), rank: null },
              { label: 'Goals · L5', fill: pct(momGoals / Math.max(1, momGames), 0.7), rank: null },
              { label: 'Points · season', fill: pct(seaPpm, 0.15), rank: null },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-3">
                <span className="text-xs w-40 flex-shrink-0" style={{ color: 'var(--text-bright)' }}>{row.label}</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                  <div className="h-full rounded-full" style={{ width: `${row.fill}%`, background: 'var(--heat)' }} />
                </div>
                {row.rank != null ? (
                  <span className="w-12 text-right text-xs font-mono font-bold" style={{ color: 'var(--heat)' }}>
                    #{row.rank}
                  </span>
                ) : (
                  <span className="w-12" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 9. Full season stats (de-emphasized) ────────────────────────────────── */}
      {isGoalie && goalieStats ? (
        <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="px-5 pt-5 pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <SectionTitle main="Season" accent="stats." />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <th className="px-2 md:px-3 py-2 text-left font-semibold uppercase tracking-wide" style={{ color: 'var(--text)' }}></th>
                  <th className="px-2 md:px-3 py-2 text-right font-semibold uppercase tracking-wide" style={{ color: 'var(--text)' }}>GP</th>
                  <th className="px-2 md:px-3 py-2 text-right font-semibold uppercase tracking-wide" style={{ color: 'var(--text)' }}>W</th>
                  <th className="px-2 md:px-3 py-2 text-right font-semibold uppercase tracking-wide" style={{ color: 'var(--text)' }}>L</th>
                  <th className="px-2 md:px-3 py-2 text-right font-semibold uppercase tracking-wide" style={{ color: 'var(--text)' }}>OTL</th>
                  <th className="px-2 md:px-3 py-2 text-right font-semibold uppercase tracking-wide" style={{ color: 'var(--text)' }}>SV%</th>
                  <th className="px-2 md:px-3 py-2 text-right font-semibold uppercase tracking-wide" style={{ color: 'var(--text)' }}>GAA</th>
                  <th className="hidden md:table-cell px-3 py-2 text-right font-semibold uppercase tracking-wide" style={{ color: 'var(--text)' }}>SA</th>
                  <th className="hidden md:table-cell px-3 py-2 text-right font-semibold uppercase tracking-wide" style={{ color: 'var(--text)' }}>GA</th>
                  <th className="px-2 md:px-3 py-2 text-right font-semibold uppercase tracking-wide" style={{ color: 'var(--text)', whiteSpace: 'nowrap' }}>TOI/GP</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Season', agg: goalieStats.season, labelColor: 'var(--silver)', bg: 'var(--bg)' },
                  { label: 'Last 5', agg: goalieStats.recent, labelColor: 'var(--neon)', bg: 'var(--bg-card)' },
                ].map(({ label, agg, labelColor, bg }) => {
                  const toiPerGp = agg.gp > 0 ? agg.toiSeconds / agg.gp : 0;
                  return (
                    <tr key={label} style={{ background: bg }}>
                      <td className="px-2 md:px-3 py-2.5 font-semibold" style={{ color: labelColor, whiteSpace: 'nowrap' }}>{label}</td>
                      <td className="px-2 md:px-3 py-2.5 text-right font-mono" style={{ color: 'var(--text-bright)' }}>{agg.gp}</td>
                      <td className="px-2 md:px-3 py-2.5 text-right font-mono" style={{ color: 'var(--green)' }}>{agg.wins}</td>
                      <td className="px-2 md:px-3 py-2.5 text-right font-mono" style={{ color: 'var(--red)' }}>{agg.losses}</td>
                      <td className="px-2 md:px-3 py-2.5 text-right font-mono" style={{ color: 'var(--amber)' }}>{agg.otl}</td>
                      <td className="px-2 md:px-3 py-2.5 text-right font-mono font-bold" style={{ color: 'var(--neon)' }}>
                        {agg.savePct.toFixed(3).replace(/^0/, '')}
                      </td>
                      <td className="px-2 md:px-3 py-2.5 text-right font-mono" style={{ color: 'var(--text-bright)' }}>
                        {agg.gaa.toFixed(2)}
                      </td>
                      <td className="hidden md:table-cell px-3 py-2.5 text-right font-mono" style={{ color: 'var(--text-bright)' }}>{agg.shotsAgainst}</td>
                      <td className="hidden md:table-cell px-3 py-2.5 text-right font-mono" style={{ color: 'var(--text-bright)' }}>{agg.goalsAgainst}</td>
                      <td className="px-2 md:px-3 py-2.5 text-right font-mono" style={{ color: 'var(--text-bright)', whiteSpace: 'nowrap' }}>
                        {toiPerGp > 0 ? `${Math.floor(toiPerGp / 60)}:${String(Math.round(toiPerGp % 60)).padStart(2, '0')}` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : seaGames > 0 ? (
        <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="px-5 pt-5 pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <SectionTitle main="Season" accent="stats." />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <th className="px-2 md:px-3 py-2 text-left font-semibold uppercase tracking-wide" style={{ color: 'var(--text)', whiteSpace: 'nowrap' }}></th>
                  <th className="px-2 md:px-3 py-2 text-right font-semibold uppercase tracking-wide" style={{ color: 'var(--text)' }}>GP</th>
                  <th className="px-2 md:px-3 py-2 text-right font-semibold uppercase tracking-wide" style={{ color: 'var(--text)' }}>G</th>
                  <th className="px-2 md:px-3 py-2 text-right font-semibold uppercase tracking-wide" style={{ color: 'var(--text)' }}>A</th>
                  <th className="px-2 md:px-3 py-2 text-right font-semibold uppercase tracking-wide" style={{ color: 'var(--text)' }}>PTS</th>
                  <th className="hidden md:table-cell px-3 py-2 text-right font-semibold uppercase tracking-wide" style={{ color: 'var(--text)', whiteSpace: 'nowrap' }}>+/-</th>
                  <th className="hidden md:table-cell px-3 py-2 text-right font-semibold uppercase tracking-wide" style={{ color: 'var(--text)' }}>PIM</th>
                  <th className="hidden md:table-cell px-3 py-2 text-right font-semibold uppercase tracking-wide" style={{ color: 'var(--text)' }}>PPG</th>
                  <th className="hidden md:table-cell px-3 py-2 text-right font-semibold uppercase tracking-wide" style={{ color: 'var(--text)' }}>PPP</th>
                  <th className="hidden md:table-cell px-3 py-2 text-right font-semibold uppercase tracking-wide" style={{ color: 'var(--text)' }}>SHG</th>
                  <th className="hidden md:table-cell px-3 py-2 text-right font-semibold uppercase tracking-wide" style={{ color: 'var(--text)' }}>SHP</th>
                  <th className="hidden md:table-cell px-3 py-2 text-right font-semibold uppercase tracking-wide" style={{ color: 'var(--text)' }}>GWG</th>
                  <th className="hidden md:table-cell px-3 py-2 text-right font-semibold uppercase tracking-wide" style={{ color: 'var(--text)' }}>S</th>
                  <th className="hidden md:table-cell px-3 py-2 text-right font-semibold uppercase tracking-wide" style={{ color: 'var(--text)' }}>S%</th>
                  <th className="px-2 md:px-3 py-2 text-right font-semibold uppercase tracking-wide" style={{ color: 'var(--text)', whiteSpace: 'nowrap' }}>TOI/GP</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
                  <td className="px-2 md:px-3 py-2.5 font-semibold" style={{ color: 'var(--silver)', whiteSpace: 'nowrap' }}>Season</td>
                  <td className="px-2 md:px-3 py-2.5 text-right font-mono" style={{ color: 'var(--text-bright)' }}>{seaGames}</td>
                  <td className="px-2 md:px-3 py-2.5 text-right font-mono" style={{ color: 'var(--text-bright)' }}>{seaGoals}</td>
                  <td className="px-2 md:px-3 py-2.5 text-right font-mono" style={{ color: 'var(--text-bright)' }}>{seaAssists}</td>
                  <td className="px-2 md:px-3 py-2.5 text-right font-mono font-bold" style={{ color: 'var(--text-bright)' }}>{seaGoals + seaAssists}</td>
                  <td className="hidden md:table-cell px-3 py-2.5 text-right font-mono" style={{ color: Number(latestSnapshot.season_plus_minus ?? 0) >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {Number(latestSnapshot.season_plus_minus ?? 0) > 0 ? '+' : ''}{latestSnapshot.season_plus_minus ?? '—'}
                  </td>
                  <td className="hidden md:table-cell px-3 py-2.5 text-right font-mono" style={{ color: 'var(--text-bright)' }}>{latestSnapshot.season_pim ?? '—'}</td>
                  <td className="hidden md:table-cell px-3 py-2.5 text-right font-mono" style={{ color: 'var(--text-bright)' }}>{latestSnapshot.season_pp_goals ?? '—'}</td>
                  <td className="hidden md:table-cell px-3 py-2.5 text-right font-mono" style={{ color: 'var(--text-bright)' }}>{latestSnapshot.season_pp_points ?? '—'}</td>
                  <td className="hidden md:table-cell px-3 py-2.5 text-right font-mono" style={{ color: 'var(--text-bright)' }}>{latestSnapshot.season_sh_goals ?? '—'}</td>
                  <td className="hidden md:table-cell px-3 py-2.5 text-right font-mono" style={{ color: 'var(--text-bright)' }}>{latestSnapshot.season_sh_points ?? '—'}</td>
                  <td className="hidden md:table-cell px-3 py-2.5 text-right font-mono" style={{ color: 'var(--text-bright)' }}>{latestSnapshot.season_gw_goals ?? '—'}</td>
                  <td className="hidden md:table-cell px-3 py-2.5 text-right font-mono" style={{ color: 'var(--text-bright)' }}>{latestSnapshot.season_shots ?? '—'}</td>
                  <td className="hidden md:table-cell px-3 py-2.5 text-right font-mono" style={{ color: 'var(--text-bright)' }}>{(seaShootPct * 100).toFixed(1)}%</td>
                  <td className="px-2 md:px-3 py-2.5 text-right font-mono" style={{ color: 'var(--text-bright)', whiteSpace: 'nowrap' }}>
                    {seaGames > 0 ? `${Math.floor(Number(latestSnapshot.season_toi_sec ?? 0) / seaGames / 60)}:${String(Math.floor(Number(latestSnapshot.season_toi_sec ?? 0) / seaGames % 60)).padStart(2,'0')}` : '—'}
                  </td>
                </tr>
                {momGames > 0 && (
                  <tr style={{ background: 'var(--bg-card)' }}>
                    <td className="px-2 md:px-3 py-2.5 font-semibold" style={{ color: 'var(--neon)', whiteSpace: 'nowrap' }}>Last {momGames}</td>
                    <td className="px-2 md:px-3 py-2.5 text-right font-mono" style={{ color: 'var(--text-bright)' }}>{momGames}</td>
                    <td className="px-2 md:px-3 py-2.5 text-right font-mono" style={{ color: 'var(--text-bright)' }}>{momGoals}</td>
                    <td className="px-2 md:px-3 py-2.5 text-right font-mono" style={{ color: 'var(--text-bright)' }}>{momAssists}</td>
                    <td className="px-2 md:px-3 py-2.5 text-right font-mono font-bold" style={{ color: 'var(--text-bright)' }}>{momGoals + momAssists}</td>
                    <td className="hidden md:table-cell px-3 py-2.5 text-right font-mono" style={{ color: Number(latestSnapshot.momentum_plus_minus ?? 0) >= 0 ? 'var(--green)' : 'var(--red)' }}>
                      {Number(latestSnapshot.momentum_plus_minus ?? 0) > 0 ? '+' : ''}{latestSnapshot.momentum_plus_minus ?? '—'}
                    </td>
                    <td className="hidden md:table-cell px-3 py-2.5 text-right font-mono" style={{ color: 'var(--text-bright)' }}>{latestSnapshot.momentum_pim ?? '—'}</td>
                    <td className="hidden md:table-cell px-3 py-2.5 text-right font-mono" style={{ color: 'var(--text-bright)' }}>{latestSnapshot.momentum_pp_goals ?? '—'}</td>
                    <td className="hidden md:table-cell px-3 py-2.5 text-right font-mono" style={{ color: 'var(--text-bright)' }}>{latestSnapshot.momentum_pp_points ?? '—'}</td>
                    <td className="hidden md:table-cell px-3 py-2.5 text-right font-mono" style={{ color: 'var(--text-bright)' }}>—</td>
                    <td className="hidden md:table-cell px-3 py-2.5 text-right font-mono" style={{ color: 'var(--text-bright)' }}>—</td>
                    <td className="hidden md:table-cell px-3 py-2.5 text-right font-mono" style={{ color: 'var(--text-bright)' }}>—</td>
                    <td className="hidden md:table-cell px-3 py-2.5 text-right font-mono" style={{ color: 'var(--text-bright)' }}>{latestSnapshot.momentum_shots ?? '—'}</td>
                    <td className="hidden md:table-cell px-3 py-2.5 text-right font-mono" style={{ color: 'var(--text-bright)' }}>{(momShootPct * 100).toFixed(1)}%</td>
                    <td className="px-2 md:px-3 py-2.5 text-right font-mono" style={{ color: 'var(--text-bright)', whiteSpace: 'nowrap' }}>
                      {momGames > 0 ? `${Math.floor(Number(latestSnapshot.momentum_toi_sec ?? 0) / momGames / 60)}:${String(Math.floor(Number(latestSnapshot.momentum_toi_sec ?? 0) / momGames % 60)).padStart(2,'00')}` : '—'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* 10. Momentum Radar (skaters only, full-width) ────────────────────────── */}
      {!isGoalie && (
        <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="px-4 pt-3 pb-1 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text)' }}>
              Momentum Radar
            </span>
            <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text)' }}>
              <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full" style={{ background: 'var(--heat)' }} />Momentum</span>
              <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full" style={{ background: 'var(--text)' }} />Season</span>
              {leagueAvgRadar && <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full" style={{ background: 'var(--amber)' }} />Lg Avg</span>}
            </div>
          </div>
          <PlayerRadarChart momentum={momentumRadar} season={seasonRadar} leagueMax={leagueMax} leagueAvg={leagueAvgRadar} />
        </div>
      )}

      {/* 11. Performance vs League (skaters only) ─────────────────────────────── */}
      {!isGoalie && (
        <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="px-4 py-3 border-b flex items-center justify-between"
            style={{ borderColor: 'var(--border)' }}>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text)' }}>
              Performance vs League
            </span>
            <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text)' }}>
              <span className="flex items-center gap-1"><span className="inline-block w-2 h-1.5 rounded-sm" style={{ background: 'var(--silver)' }}/>Season</span>
              <span className="flex items-center gap-1"><span className="inline-block w-2 h-1.5 rounded-sm" style={{ background: 'var(--heat)' }}/>Momentum</span>
              <span className="flex items-center gap-1"><span className="inline-block w-2 h-1.5 rounded-sm" style={{ background: 'var(--amber)' }}/>League Avg</span>
            </div>
          </div>

          {/* Mobile: stacked cards */}
          <div className="md:hidden divide-y" style={{ borderColor: 'var(--border)' }}>
            {perfMetrics.map((m, i) => {
              const d = m.delta;
              const trendColor = d > 2 ? 'var(--green)' : d < -2 ? 'var(--red)' : 'var(--text)';
              const vl = m.vsLeague;
              const vlColor = vl > 5 ? 'var(--green)' : vl < -5 ? 'var(--red)' : 'var(--text)';
              const vlSign = vl > 0 ? '+' : '';
              return (
                <div key={m.label} className="px-4 py-3"
                  style={{ background: i % 2 === 0 ? 'var(--bg)' : 'var(--bg-card)', borderColor: 'var(--border)' }}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0 pr-2">
                      <span className="text-sm" style={{ color: 'var(--text-bright)' }}>{m.label}</span>
                      <div className="text-xs font-mono mt-0.5" style={{ color: 'var(--text)' }}>
                        Sea: {m.seaVal} · Avg: {m.lgVal}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-mono font-bold" style={{ color: 'var(--heat)' }}>{m.momVal}</span>
                      <span className="text-xs font-mono font-semibold" style={{ color: vlColor }}>
                        {Math.abs(vl) > 1 ? `${vlSign}${vl.toFixed(0)}%` : '≈'}
                      </span>
                      <span className="text-xs font-mono font-semibold" style={{ color: trendColor }}>
                        {d > 2 ? '↑' : d < -2 ? '↓' : '—'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                      <div className="h-full rounded-full" style={{ width: `${m.seaFill}%`, background: 'var(--silver)' }} />
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${m.momFill}%`, background: 'var(--heat)' }} />
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                      <div className="h-full rounded-full" style={{ width: `${m.lgFill}%`, background: 'var(--amber)' }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: 5-column grid */}
          <div className="hidden md:block">
            <div className="grid text-xs font-semibold uppercase tracking-wide px-4 py-2 border-b"
              style={{ gridTemplateColumns: '2fr 1fr 3fr 1fr 1fr', color: 'var(--text)', borderColor: 'var(--border)' }}>
              <span>Metric</span>
              <span>Momentum</span>
              <span>Relative Performance</span>
              <span className="text-right">vs League</span>
              <span className="text-right">Trend</span>
            </div>
            {perfMetrics.map((m, i) => {
              const d = m.delta;
              const trendColor = d > 2 ? 'var(--green)' : d < -2 ? 'var(--red)' : 'var(--text)';
              const trendSign = d > 0 ? '+' : '';
              const vl = m.vsLeague;
              const vlColor = vl > 5 ? 'var(--green)' : vl < -5 ? 'var(--red)' : 'var(--text)';
              const vlSign = vl > 0 ? '+' : '';
              return (
                <div key={m.label}
                  className="grid items-center px-4 py-3 border-b"
                  style={{
                    gridTemplateColumns: '2fr 1fr 3fr 1fr 1fr',
                    borderColor: 'var(--border)',
                    background: i % 2 === 0 ? 'var(--bg)' : 'var(--bg-card)',
                  }}>
                  <div>
                    <span className="text-sm" style={{ color: 'var(--text-bright)' }}>{m.label}</span>
                    <div className="text-xs font-mono mt-0.5" style={{ color: 'var(--text)' }}>
                      Sea: {m.seaVal} · Avg: {m.lgVal}
                    </div>
                  </div>
                  <span className="text-sm font-mono font-bold" style={{ color: 'var(--heat)' }}>{m.momVal}</span>
                  <div className="px-2 space-y-1">
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                      <div className="h-full rounded-full" style={{ width: `${m.seaFill}%`, background: 'var(--silver)' }} />
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${m.momFill}%`, background: 'var(--heat)' }} />
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                      <div className="h-full rounded-full"
                        style={{ width: `${m.lgFill}%`, background: 'var(--amber)' }} />
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-semibold" style={{ color: vlColor }}>
                      {Math.abs(vl) > 1 ? `${vlSign}${vl.toFixed(0)}%` : '≈ avg'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-semibold" style={{ color: trendColor }}>
                      {d > 2 ? '↑' : d < -2 ? '↓' : '—'} {Math.abs(d) > 1 ? `${trendSign}${d.toFixed(0)}%` : '0%'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}

function StatPill({ label, value, highlight, bold }: { label: string; value: string; highlight?: boolean; bold?: boolean }) {
  return (
    <div className="flex flex-col items-center min-w-[2rem]">
      <span className={`text-sm font-mono ${bold ? 'font-bold' : ''}`}
        style={{ color: highlight ? 'var(--neon)' : 'var(--text-bright)' }}>
        {value}
      </span>
      <span className="text-xs" style={{ color: 'var(--text)' }}>{label}</span>
    </div>
  );
}

async function AISection({ playerId, aiInput }: { playerId: number; aiInput: PlayerAIInput }) {
  const { bio: aiBio, perfEval: aiPerfEval } = await getPlayerInsights(playerId, aiInput)
    .catch(() => ({ bio: null, perfEval: null }));
  const aiPerfRemainder = aiPerfEval
    ? aiPerfEval.replace(/^[^.!?]+[.!?]\s*/, '').trim()
    : '';
  if (!aiBio && !aiPerfRemainder) return null;
  return (
    <div className="rounded-xl border p-5 flex flex-col gap-4"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      {aiBio && (
        <div className="pl-4" style={{ borderLeft: '2px solid var(--heat)' }}>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-bright)' }}>{aiBio}</p>
        </div>
      )}
      {aiPerfRemainder && (
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{aiPerfRemainder}</p>
      )}
    </div>
  );
}

function AISectionSkeleton() {
  return (
    <div className="rounded-xl border p-5 flex flex-col gap-3"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="h-4 w-3/4 rounded animate-pulse" style={{ background: 'var(--border)' }} />
      <div className="h-4 w-full rounded animate-pulse" style={{ background: 'var(--border)' }} />
      <div className="h-4 w-2/3 rounded animate-pulse" style={{ background: 'var(--border)' }} />
    </div>
  );
}

async function AIBioSection({ playerId, aiInput }: { playerId: number; aiInput: PlayerAIInput }) {
  const { bio } = await getPlayerInsights(playerId, aiInput).catch(() => ({ bio: null, perfEval: null }));
  if (!bio) return null;
  return (
    <div className="pl-3" style={{ borderLeft: '2px solid var(--heat)' }}>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-bright)', fontFamily: 'var(--font-fraunces), Georgia, serif', fontStyle: 'italic' }}>
        {bio}
      </p>
    </div>
  );
}

async function AIPerfSection({ playerId, aiInput }: { playerId: number; aiInput: PlayerAIInput }) {
  const { perfEval } = await getPlayerInsights(playerId, aiInput).catch(() => ({ bio: null, perfEval: null }));
  if (!perfEval) return null;
  return (
    <p className="text-sm leading-relaxed pb-2" style={{ color: 'var(--text)' }}>
      {perfEval}
    </p>
  );
}

async function AIBioMobileCard({ playerId, aiInput }: { playerId: number; aiInput: PlayerAIInput }) {
  const { bio } = await getPlayerInsights(playerId, aiInput).catch(() => ({ bio: null, perfEval: null }));
  if (!bio) return null;
  return (
    <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="inline-flex items-center px-2.5 py-1 rounded-full mb-3 text-xs font-bold tracking-widest uppercase"
        style={{ background: 'rgba(255,90,36,0.15)', color: 'var(--heat)', border: '1px solid rgba(255,90,36,0.3)' }}>
        AI Character
      </div>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-bright)', fontFamily: 'var(--font-fraunces), Georgia, serif', fontStyle: 'italic' }}>
        {bio}
      </p>
    </div>
  );
}
