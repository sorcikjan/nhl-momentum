import type { Metadata } from 'next';
import PlayerRadarChart from '@/components/players/RadarChart';
import PPMTimeline from '@/components/players/PPMTimeline';
import EnergyBar from '@/components/players/EnergyBar';
import { fetchPlayer, fetchRankings, fetchLeagueAverages, daysAgo, deriveOutStatus } from '@/lib/data';
import { getPlayerInsights } from '@/lib/ai';
import type { PlayerAIInput } from '@/lib/ai';
import { teamUrl } from '@/lib/urls';
import Link from 'next/link';

export const revalidate = 120;

export async function generateMetadata({ params }: { params: Promise<{ id: string; slug: string }> }): Promise<Metadata> {
  const { id } = await params;
  const data = await fetchPlayer(id).catch(() => null);
  if (!data?.player) return { title: 'Player' };
  const { player } = data;
  const name = `${player.first_name} ${player.last_name}`;
  const team = player.teams?.abbrev ?? '';
  const pos  = player.position_code ?? '';
  return {
    title: name,
    description: `${name} (${team} · ${pos}) — momentum PPM, energy bar, radar chart, and recent game log on NHL Momentum.`,
    openGraph: {
      title: `${name} — NHL Momentum`,
      description: `${name} (${team} · ${pos}) — momentum analytics, PPM trend, and recent NHL game log.`,
      images: player.headshot_url ? [{ url: player.headshot_url, width: 160, height: 160, alt: name }] : [],
    },
  };
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
  const [data, rankings, leagueAvg] = await Promise.all([
    fetchPlayer(id).catch(() => null),
    fetchRankings().catch(() => null),
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

  const ranked = rankings?.top100?.find((p: { player_id: number }) => p.player_id === Number(id));

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
  const energyLabel = energyBar >= 70 ? 'HIGH PERFORMANCE' : energyBar >= 40 ? 'MODERATE' : 'DRAINED';

  const lastPlayedDaysAgo = lastPlayedDate ? daysAgo(lastPlayedDate) : null;
  const outStatus = deriveOutStatus(consecutiveGamesMissed ?? null, lastPlayedDaysAgo, player.in_minors ?? false);

  const lgPpm    = leagueAvg?.seasonPpm      ?? 0;
  const lgG      = leagueAvg?.goalsPerGame   ?? 0;
  const lgA      = leagueAvg?.assistsPerGame ?? 0;
  const lgShoot  = leagueAvg?.shootingPct    ?? 0;
  const lgEnergy = Math.round(leagueAvg?.energyBar ?? 85);
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
    rank:            ranked?.momentum_rank ?? null,
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

  const { bio: aiBio, perfEval: aiPerfEval } = await getPlayerInsights(Number(id), aiInput).catch(() => ({ bio: null, perfEval: null }));

  return (
    <div className="max-w-5xl mx-auto pb-20 md:pb-0 space-y-4">

      {/* ── OUT / Injury banner ───────────────────────────────────────────────── */}
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

      {/* ── Hero card ─────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="flex items-stretch gap-0">

          {/* Headshot */}
          {player.headshot_url && (
            <div className="relative flex-shrink-0 w-28 md:w-36"
              style={{ background: 'linear-gradient(135deg, var(--bg) 0%, var(--bg-hover) 100%)' }}>
              <img src={player.headshot_url} alt={name}
                className="w-full h-full object-cover object-top" />
              <div className="absolute inset-0"
                style={{ background: 'linear-gradient(to right, transparent 60%, var(--bg-card))' }} />
            </div>
          )}

          {/* Identity */}
          <div className="flex-1 p-5 flex flex-col justify-center gap-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight leading-none"
                  style={{ color: 'var(--text-bright)' }}>
                  {player.first_name}<br />{player.last_name}
                </h1>
                <div className="flex items-center gap-2 mt-2 flex-wrap text-sm">
                  {player.teams?.id ? (
                    <Link href={teamUrl(player.teams.id, player.teams.name ?? player.teams.abbrev)}
                      className="font-semibold hover:opacity-80" style={{ color: 'var(--neon)' }}>
                      {player.teams.abbrev}
                    </Link>
                  ) : (
                    <span style={{ color: 'var(--neon)' }}>{player.teams?.abbrev}</span>
                  )}
                  <span style={{ color: 'var(--border)' }}>|</span>
                  <span style={{ color: 'var(--text)' }}>{player.position_code}</span>
                  {player.sweater_number && (
                    <>
                      <span style={{ color: 'var(--border)' }}>|</span>
                      <span style={{ color: 'var(--text)' }}>#{player.sweater_number}</span>
                    </>
                  )}
                  {(outStatus || player.injury_status) && (() => {
                    const label = player.injury_status ?? (outStatus === 'minors' ? 'MINORS' : outStatus === 'injured' ? 'INJURED' : outStatus === 'scratch' ? 'SCRATCH' : 'OUT');
                    const color = outStatus === 'minors' ? 'var(--neon)' : outStatus === 'scratch' ? 'var(--amber)' : 'var(--red)';
                    const bg    = outStatus === 'minors' ? 'rgba(99,179,237,0.15)' : outStatus === 'scratch' ? 'rgba(251,191,36,0.18)' : 'rgba(239,68,68,0.2)';
                    return (
                      <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: bg, color }}>
                        {label}
                      </span>
                    );
                  })()}
                </div>
              </div>
              {rankBadge(ranked?.momentum_rank)}
            </div>

            {/* Energy — compact status badge in hero, full bar below */}
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-1 rounded font-semibold"
                style={{ background: `${energyColor}22`, color: energyColor, border: `1px solid ${energyColor}44` }}>
                ⚡ {energyLabel} · {energyBar}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bio strip ───────────────────────────────────────────────────────────── */}
      {(player.birth_date || player.height_inches || player.draft_year || player.career_games) && (
        <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 divide-x divide-y md:divide-y-0"
            style={{ borderColor: 'var(--border)' }}>

            {player.birth_date && (() => {
              const age = Math.floor((Date.now() - new Date(player.birth_date).getTime()) / (365.25 * 86400000));
              return (
                <BioCell label="Age / Born" value={String(age)}
                  sub={new Date(player.birth_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} />
              );
            })()}

            {player.birth_country && (
              <BioCell label="Birthplace"
                value={player.birth_city ?? player.birth_country}
                sub={[player.birth_state_province, player.birth_country].filter(Boolean).join(', ')} />
            )}

            {player.height_inches && (
              <BioCell label="Height / Weight"
                value={`${Math.floor(player.height_inches / 12)}′${player.height_inches % 12}″`}
                sub={player.weight_pounds ? `${player.weight_pounds} lbs` : undefined} />
            )}

            {player.shoots_catches && (
              <BioCell label={player.position_code === 'G' ? 'Catches' : 'Shoots'}
                value={player.shoots_catches === 'L' ? 'Left' : 'Right'} />
            )}

            {player.draft_year && (
              <BioCell label="Draft"
                value={`${player.draft_year} · R${player.draft_round} · #${player.draft_pick}`}
                sub={player.draft_team_abbrev ?? undefined} />
            )}

            {player.career_games && (
              <BioCell label="Career"
                value={`${player.career_points ?? 0} PTS`}
                sub={`${player.career_games} GP · ${player.career_goals ?? 0}G ${player.career_assists ?? 0}A`} />
            )}
          </div>
        </div>
      )}

      {/* ── AI: Bio / Character + Performance Eval ──────────────────────────────── */}
      {(aiBio || aiPerfEval) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {aiBio && (
            <div className="rounded-xl border p-4 flex flex-col gap-2"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--silver)' }}>
                  Character
                </span>
                <span className="text-xs" style={{ color: 'var(--text)', opacity: 0.4 }}>
                  AI
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-bright)' }}>
                {aiBio}
              </p>
            </div>
          )}
          {aiPerfEval && (
            <div className="rounded-xl border p-4 flex flex-col gap-2"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--neon)' }}>
                  Performance
                </span>
                <span className="text-xs" style={{ color: 'var(--text)', opacity: 0.4 }}>
                  AI · Last 5 games
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-bright)' }}>
                {aiPerfEval}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Season Statistics Table ─────────────────────────────────────────────── */}
      {isGoalie && goalieStats ? (
        /* Goalie stats: GP, Record, SV%, GAA, SA, TOI/GP */
        <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text)' }}>
              Season Statistics
            </span>
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
        /* Skater stats: G, A, PTS, +/-, PPG, shots, etc. */
        <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text)' }}>
              Season Statistics
            </span>
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

      {/* ── Energy Bar ──────────────────────────────────────────────────────────── */}
      <EnergyBar value={energyBar} leagueAvg={lgEnergy} />

      {/* ── Radar + PPM timeline ────────────────────────────────────────────────── */}
      {!isGoalie ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className="px-4 pt-3 pb-1 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text)' }}>
                Technical Attribute Radar
              </span>
              <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text)' }}>
                <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full" style={{ background: 'var(--neon)' }} />Momentum</span>
                <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full" style={{ background: 'var(--text)' }} />Season</span>
                {leagueAvgRadar && <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full" style={{ background: 'var(--amber)' }} />Lg Avg</span>}
              </div>
            </div>
            <PlayerRadarChart momentum={momentumRadar} season={seasonRadar} leagueMax={leagueMax} leagueAvg={leagueAvgRadar} />
          </div>
          <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className="px-4 pt-3 pb-1 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text)' }}>
                PPM Seasonal Evolution
              </span>
              {momPpm > seaPpm && (
                <span className="text-xs px-2 py-0.5 rounded font-semibold"
                  style={{ background: 'rgba(34,197,94,0.15)', color: 'var(--green)' }}>
                  Current Peak
                </span>
              )}
            </div>
            <PPMTimeline snapshots={metricTimeline ?? []} leagueAvgPpm={leagueAvg?.seasonPpm} />
          </div>
        </div>
      ) : (metricTimeline?.length ?? 0) > 0 && (
        <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="px-4 pt-3 pb-1">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text)' }}>
              PPM Seasonal Evolution
            </span>
          </div>
          <PPMTimeline snapshots={metricTimeline ?? []} leagueAvgPpm={leagueAvg?.seasonPpm} />
        </div>
      )}

      {/* ── Advanced Performance Matrix (skaters only) ───────────────────────── */}
      {!isGoalie && <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="px-4 py-3 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--border)' }}>
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text)' }}>
            Advanced Performance Matrix
          </span>
          <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text)' }}>
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-1.5 rounded-sm" style={{ background: 'var(--silver)' }}/>Season</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-1.5 rounded-sm" style={{ background: 'var(--neon)' }}/>Momentum</span>
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
                    <span className="text-sm font-mono font-bold" style={{ color: 'var(--neon)' }}>{m.momVal}</span>
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
                    <div className="h-full rounded-full transition-all" style={{ width: `${m.momFill}%`, background: 'var(--neon)' }} />
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
              <span className="text-sm font-mono font-bold" style={{ color: 'var(--neon)' }}>{m.momVal}</span>
              <div className="px-2 space-y-1">
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                  <div className="h-full rounded-full" style={{ width: `${m.seaFill}%`, background: 'var(--silver)' }} />
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${m.momFill}%`, background: 'var(--neon)' }} />
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
        </div>{/* desktop grid */}
      </div>}{/* end !isGoalie Advanced Performance Matrix */}

      {/* ── Recent Games Log ───────────────────────────────────────────────────── */}
      {(recentGames?.length ?? 0) > 0 && (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <div className="px-4 py-3 border-b flex items-center justify-between"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text)' }}>
              Recent Games Log
            </span>
            <span className="text-xs" style={{ color: 'var(--text)' }}>Last {recentGames?.length} games</span>
          </div>

          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(recentGames ?? []).slice(0, 10).map((g: any, i: number) => {
              const game = g.games;
              const isHome = player.team_id === game?.home_team_id;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const opponentAbbrev = isHome ? (game?.away_team as any)?.abbrev : (game?.home_team as any)?.abbrev;
              const teamScore    = isHome ? game?.home_score : game?.away_score;
              const oppScore     = isHome ? game?.away_score : game?.home_score;
              const hasResult    = teamScore !== null && oppScore !== null;
              const won          = hasResult && teamScore > oppScore;
              const lost         = hasResult && teamScore < oppScore;
              const toiMin       = Math.floor(Number(g.toi_seconds ?? 0) / 60);
              const toiSec       = String(Number(g.toi_seconds ?? 0) % 60).padStart(2, '0');
              const gameDate     = String(game?.game_date ?? '').slice(5);

              // Goalie decision parsing
              const dec = g.decision ?? null;
              const decIsWin = dec === 'W' || dec === 'SOW';
              const decIsLoss = dec === 'L';
              const decIsOT = dec === 'O' || dec === 'OT' || dec === 'SOL';

              return (
                <div key={i} className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3"
                  style={{ background: i % 2 === 0 ? 'var(--bg)' : 'var(--bg-card)' }}>

                  {/* Date + opponent */}
                  <div className="flex-shrink-0 w-16 sm:w-28">
                    {opponentAbbrev && (
                      <div className="text-xs mb-0.5" style={{ color: 'var(--text)' }}>
                        {isHome ? 'VS' : '@'} {opponentAbbrev}
                      </div>
                    )}
                    <div className="text-xs font-mono" style={{ color: 'var(--text)' }}>{gameDate || '—'}</div>
                  </div>

                  {/* Result badge */}
                  {hasResult ? (
                    <div className="flex items-center gap-1.5 flex-shrink-0 w-20 sm:w-24">
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
                    </div>
                  ) : (
                    <div className="w-20 sm:w-24" />
                  )}

                  {isGoalie ? (
                    /* Goalie stats: Decision, SA, GA, SV%, TOI */
                    <div className="flex items-center gap-2 sm:gap-4 flex-1">
                      {dec && (
                        <div className="flex flex-col items-center min-w-[2rem]">
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded"
                            style={{
                              background: decIsWin ? 'rgba(34,197,94,0.15)' : decIsLoss ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                              color: decIsWin ? 'var(--green)' : decIsLoss ? 'var(--red)' : 'var(--amber)',
                            }}>
                            {decIsWin ? 'W' : decIsLoss ? 'L' : 'OT'}
                          </span>
                          <span className="text-xs" style={{ color: 'var(--text)' }}>DEC</span>
                        </div>
                      )}
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
                    /* Skater stats: G, A, PTS, +/-, PIM, TOI */
                    <div className="flex items-center gap-2 sm:gap-4 flex-1">
                      <StatPill label="G" value={String(g.goals ?? 0)} highlight={Number(g.goals) > 0} />
                      <StatPill label="A" value={String(g.assists ?? 0)} highlight={Number(g.assists) > 1} />
                      <StatPill label="PTS" value={String(Number(g.goals ?? 0) + Number(g.assists ?? 0))} highlight={Number(g.goals ?? 0) + Number(g.assists ?? 0) > 1} bold />
                      {g.plus_minus !== undefined && g.plus_minus !== null && (
                        <StatPill label="+/-" value={`${Number(g.plus_minus) > 0 ? '+' : ''}${g.plus_minus}`}
                          highlight={Number(g.plus_minus) > 0} />
                      )}
                      {Number(g.pim ?? 0) > 0 && (
                        <StatPill label="PIM" value={String(g.pim)} />
                      )}
                      <span className="text-xs font-mono hidden sm:block" style={{ color: 'var(--text)' }}>
                        {toiMin}:{toiSec} TOI
                      </span>
                    </div>
                  )}

                  {/* PPM badge — skaters only */}
                  {!isGoalie && g.points_per_minute !== null && g.points_per_minute !== undefined && (
                    <div className="hidden sm:block flex-shrink-0 text-xs font-mono px-2 py-1 rounded"
                      style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--neon)', border: '1px solid rgba(59,130,246,0.2)' }}>
                      PPM: {Number(g.points_per_minute).toFixed(2)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function BioCell({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="px-4 py-3 flex flex-col gap-0.5" style={{ borderColor: 'var(--border)' }}>
      <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--text)' }}>{label}</span>
      <span className="text-sm font-semibold font-mono" style={{ color: 'var(--text-bright)' }}>{value}</span>
      {sub && <span className="text-xs" style={{ color: 'var(--text)' }}>{sub}</span>}
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
