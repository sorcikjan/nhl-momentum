import type { Metadata } from 'next';
import PlayerRadarChart from '@/components/players/RadarChart';
import PPMTimeline from '@/components/players/PPMTimeline';
import { fetchPlayer, fetchRankings } from '@/lib/data';
import { teamUrl } from '@/lib/urls';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

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
  const [data, rankings] = await Promise.all([
    fetchPlayer(id).catch(() => null),
    fetchRankings().catch(() => null),
  ]);

  if (!data?.player) {
    return (
      <div className="flex items-center justify-center h-64">
        <p style={{ color: 'var(--text)' }}>Player not found</p>
      </div>
    );
  }

  const { player, metricTimeline, recentGames } = data;
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

  const perfMetrics = [
    {
      label: 'Points Per Match (PPM)',
      momVal: momPpm.toFixed(3),
      seaVal: seaPpm.toFixed(3),
      carVal: carPpm.toFixed(3),
      momFill: pct(momPpm, 0.15),
      seaFill: pct(seaPpm, 0.15),
      delta: delta(momPpm, seaPpm),
    },
    {
      label: 'Goals / Game',
      momVal: (momGoals / Math.max(1, momGames)).toFixed(2),
      seaVal: (seaGoals / Math.max(1, seaGames)).toFixed(2),
      carVal: '—',
      momFill: pct(momGoals / Math.max(1, momGames), 0.7),
      seaFill: pct(seaGoals / Math.max(1, seaGames), 0.7),
      delta: delta(momGoals / Math.max(1, momGames), seaGoals / Math.max(1, seaGames)),
    },
    {
      label: 'Assists / Game',
      momVal: (momAssists / Math.max(1, momGames)).toFixed(2),
      seaVal: (seaAssists / Math.max(1, seaGames)).toFixed(2),
      carVal: '—',
      momFill: pct(momAssists / Math.max(1, momGames), 1.0),
      seaFill: pct(seaAssists / Math.max(1, seaGames), 1.0),
      delta: delta(momAssists / Math.max(1, momGames), seaAssists / Math.max(1, seaGames)),
    },
    {
      label: 'Shooting Efficiency',
      momVal: `${(momShootPct * 100).toFixed(1)}%`,
      seaVal: `${(seaShootPct * 100).toFixed(1)}%`,
      carVal: '—',
      momFill: pct(momShootPct, 0.25),
      seaFill: pct(seaShootPct, 0.25),
      delta: delta(momShootPct, seaShootPct),
    },
  ];

  // Radar data (keep existing interface)
  const leagueMax = { ppm: 0.15, shootingPct: 0.25, hits: 15, blockedShots: 12, plusMinus: 10, powerPlayPoints: 5 };
  const momentumRadar = { ppm: momPpm, shootingPct: momShootPct, hits: 0, blockedShots: 0, plusMinus: 0, powerPlayPoints: 0 };
  const seasonRadar   = { ppm: seaPpm, shootingPct: seaShootPct, hits: 0, blockedShots: 0, plusMinus: 0, powerPlayPoints: 0 };

  return (
    <div className="max-w-5xl mx-auto pb-20 md:pb-0 space-y-4">

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
                  {player.injury_status && (
                    <span className="px-2 py-0.5 rounded text-xs font-semibold"
                      style={{ background: 'rgba(239,68,68,0.2)', color: 'var(--red)' }}>
                      {player.injury_status}
                    </span>
                  )}
                </div>
              </div>
              {rankBadge(ranked?.momentum_rank)}
            </div>

            {/* Energy capacity */}
            <div className="rounded-lg p-3" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text)' }}>
                  Energy Capacity
                </span>
                <span className="text-lg font-bold font-mono" style={{ color: energyColor }}>
                  {energyBar}%
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden mb-1" style={{ background: 'var(--border)' }}>
                <div className="h-2 rounded-full transition-all duration-700"
                  style={{ width: `${energyBar}%`, background: `linear-gradient(90deg, ${energyColor}, ${energyColor}88)` }} />
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-xs font-mono" style={{ color: energyColor }}>⚡ STATUS: {energyLabel}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Radar + PPM timeline ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="px-4 pt-3 pb-1 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text)' }}>
              Technical Attribute Radar
            </span>
            <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text)' }}>
              <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full" style={{ background: 'var(--neon)' }} />Momentum</span>
              <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full" style={{ background: 'var(--text)' }} />Season</span>
            </div>
          </div>
          <PlayerRadarChart momentum={momentumRadar} season={seasonRadar} leagueMax={leagueMax} />
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
          <PPMTimeline snapshots={metricTimeline ?? []} />
        </div>
      </div>

      {/* ── Advanced Performance Matrix ────────────────────────────────────────── */}
      <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="px-4 py-3 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--border)' }}>
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text)' }}>
            Advanced Performance Matrix
          </span>
          <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text)' }}>
            <span>Season Baseline</span>
            <span className="font-semibold" style={{ color: 'var(--neon)' }}>Momentum Delta</span>
          </div>
        </div>

        {/* Header */}
        <div className="grid text-xs font-semibold uppercase tracking-wide px-4 py-2 border-b"
          style={{ gridTemplateColumns: '2fr 1fr 3fr 1fr', color: 'var(--text)', borderColor: 'var(--border)' }}>
          <span>Metric Identifier</span>
          <span>Value</span>
          <span>Relative Performance (Momentum vs Season)</span>
          <span className="text-right">Trend</span>
        </div>

        {perfMetrics.map((m, i) => {
          const d = m.delta;
          const trendColor = d > 2 ? 'var(--green)' : d < -2 ? 'var(--red)' : 'var(--text)';
          const trendSign = d > 0 ? '+' : '';
          return (
            <div key={m.label}
              className="grid items-center px-4 py-3 border-b"
              style={{
                gridTemplateColumns: '2fr 1fr 3fr 1fr',
                borderColor: 'var(--border)',
                background: i % 2 === 0 ? 'var(--bg)' : 'var(--bg-card)',
              }}>
              <span className="text-sm" style={{ color: 'var(--text-bright)' }}>{m.label}</span>
              <span className="text-sm font-mono font-bold" style={{ color: 'var(--neon)' }}>{m.momVal}</span>
              <div className="px-2 space-y-1">
                {/* Season baseline bar (grey) */}
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                  <div className="h-full rounded-full" style={{ width: `${m.seaFill}%`, background: 'var(--silver)' }} />
                </div>
                {/* Momentum bar (neon) */}
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${m.momFill}%`, background: 'var(--neon)' }} />
                </div>
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
              const pts          = Number(g.goals ?? 0) + Number(g.assists ?? 0);
              const toiMin       = Math.floor(Number(g.toi_seconds ?? 0) / 60);
              const toiSec       = String(Number(g.toi_seconds ?? 0) % 60).padStart(2, '0');
              const gameDate     = String(game?.game_date ?? '').slice(5);

              return (
                <div key={i} className="flex items-center gap-3 px-4 py-3"
                  style={{ background: i % 2 === 0 ? 'var(--bg)' : 'var(--bg-card)' }}>

                  {/* Date + opponent */}
                  <div className="flex-shrink-0 w-28">
                    {opponentAbbrev && (
                      <div className="text-xs mb-0.5" style={{ color: 'var(--text)' }}>
                        {isHome ? 'VS' : '@'} {opponentAbbrev}
                      </div>
                    )}
                    <div className="text-xs font-mono" style={{ color: 'var(--text)' }}>{gameDate || '—'}</div>
                  </div>

                  {/* Result badge */}
                  {hasResult ? (
                    <div className="flex items-center gap-2 flex-shrink-0 w-24">
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
                    <div className="w-24" />
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 flex-1">
                    <StatPill label="G" value={String(g.goals ?? 0)} highlight={Number(g.goals) > 0} />
                    <StatPill label="A" value={String(g.assists ?? 0)} highlight={Number(g.assists) > 1} />
                    <StatPill label="PTS" value={String(pts)} highlight={pts > 1} bold />
                    <span className="text-xs font-mono hidden sm:block" style={{ color: 'var(--text)' }}>
                      {toiMin}:{toiSec} TOI
                    </span>
                  </div>

                  {/* PPM badge */}
                  {g.points_per_minute !== null && g.points_per_minute !== undefined && (
                    <div className="flex-shrink-0 text-xs font-mono px-2 py-1 rounded"
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
