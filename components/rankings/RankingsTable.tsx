'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { playerUrl } from '@/lib/urls';
import { deriveOutStatus, daysAgo } from '@/lib/player-status';
import { ppmToHeat, heatColor, heatBorderColor } from '@/lib/heat';

interface Player {
  player_id: number;
  momentum_rank: number;
  momentum_ppm: number;
  momentum_games: number;
  season_ppm: number;
  breakout_delta: number;
  sos_coefficient: number;
  energy_bar: number;
  momentum_goals: number;
  momentum_assists: number;
  momentum_points: number;
  season_goals: number;
  season_assists: number;
  season_points: number;
  last_played_date?: string | null;
  consecutive_games_missed?: number;
  players: {
    first_name: string;
    last_name: string;
    headshot_url: string | null;
    position_code: string;
    injury_status: string | null;
    in_minors?: boolean | null;
    teams: { id: number; abbrev: string; name: string };
  };
}

interface SparklineSnapshot {
  player_id: number;
  calculated_at: string;
  momentum_ppm: number;
}

type SortKey =
  | 'momentum_rank'
  | 'momentum_ppm'
  | 'breakout_delta'
  | 'season_ppm'
  | 'energy_bar'
  | 'sos_coefficient'
  | 'season_goals'
  | 'season_assists'
  | 'season_points';

const PAGE_SIZE = 25;

// Matches design reference: 90×28, strokeWidth 1.8, endpoint dot r=2.5
function Sparkline({ values, color }: { values: number[]; color: string }) {
  const W = 90, H = 28;
  if (values.length < 2) {
    return <span style={{ display: 'inline-block', width: W, height: H, flexShrink: 0 }} />;
  }
  const maxV = 100;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * (W - 2) + 1;
      const y = H - 2 - ((v / maxV) * (H - 4));
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const lastV = values[values.length - 1];
  const lastX = W - 1;
  const lastY = H - 2 - ((lastV / maxV) * (H - 4));
  return (
    <svg width={W} height={H} aria-hidden style={{ flexShrink: 0, display: 'block' }}>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r="2.5" fill={color} />
    </svg>
  );
}

// Desktop grid column template — matches reference: RANK PLAYER TEAM·POS G A PTS HEAT TREND Δ →
const GRID = '56px 1fr 80px 52px 52px 60px 72px 100px 72px 32px';

export default function RankingsTable({
  players,
  seasonHasStarted = true,
  sparklineSnapshots = [],
}: {
  players: Player[];
  seasonHasStarted?: boolean;
  sparklineSnapshots?: SparklineSnapshot[];
}) {
  const [sort, setSort] = useState<SortKey>('momentum_rank');
  const [pos, setPos] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const positions = ['ALL', 'C', 'L', 'R', 'D', 'G'];

  const sparklineByPlayer = useMemo(() => {
    const grouped = new Map<number, number[]>();
    for (const snap of sparklineSnapshots) {
      if (!grouped.has(snap.player_id)) grouped.set(snap.player_id, []);
      const arr = grouped.get(snap.player_id)!;
      if (arr.length < 6) arr.push(ppmToHeat(snap.momentum_ppm));
    }
    for (const [pid, arr] of grouped) {
      grouped.set(pid, [...arr].reverse());
    }
    return grouped;
  }, [sparklineSnapshots]);

  const searchLower = search.trim().toLowerCase();

  const filtered = useMemo(
    () =>
      players
        .filter(p => {
          if (pos !== 'ALL' && p.players.position_code !== pos) return false;
          if ((p.momentum_games ?? 0) < 3) return false;
          if (searchLower) {
            const name =
              `${p.players.first_name} ${p.players.last_name}`.toLowerCase();
            if (!name.includes(searchLower)) return false;
          }
          return true;
        })
        .sort((a, b) => {
          if (sort === 'momentum_rank')
            return (a.momentum_rank ?? 999) - (b.momentum_rank ?? 999);
          if (sort === 'energy_bar')
            return (b.energy_bar ?? 0) - (a.energy_bar ?? 0);
          return ((b[sort] as number) ?? 0) - ((a[sort] as number) ?? 0);
        }),
    [players, pos, sort, searchLower]
  );

  const visible = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  const sortPills: { label: string; key: SortKey }[] = [
    { label: 'Heat',    key: 'momentum_rank' },
    { label: 'Points',  key: 'season_points' },
    { label: 'Goals',   key: 'season_goals' },
    { label: 'Assists', key: 'season_assists' },
  ];

  const activePill = (key: SortKey) => key === sort;

  return (
    <div>
      {/* ── Page header: kicker + title on left, sort pills on right ── */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <p style={{
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: '0.69rem',
            color: 'var(--heat)',
            fontWeight: 700,
            letterSpacing: '0.12em',
            marginBottom: '0.5rem',
            textTransform: 'uppercase',
          }}>
            ALL SKATERS · {filtered.length}
          </p>
          <h1 style={{
            fontFamily: 'var(--font-geist-sans), sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(2.25rem, 5vw, 2.75rem)',
            letterSpacing: '-0.04em',
            lineHeight: 1,
            color: 'var(--text-bright)',
          }}>
            Rankings
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--text)' }}>
            Sorted by Heat. The current state of every player in one place.
          </p>
        </div>

        {/* Sort pills — desktop only, right of title */}
        <div className="hidden md:flex gap-2 flex-shrink-0 mb-1">
          {sortPills.map(pill => (
            <button
              key={pill.key}
              onClick={() => { setSort(pill.key); setVisibleCount(PAGE_SIZE); }}
              style={{
                padding: '8px 14px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                color: activePill(pill.key) ? 'var(--heat)' : 'var(--text)',
                background: activePill(pill.key) ? 'rgba(255,90,36,0.12)' : 'var(--bg-card)',
                border: `1px solid ${activePill(pill.key) ? 'rgba(255,90,36,0.4)' : 'var(--border)'}`,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Filter row: position chips + search ── */}
      <div className="flex gap-2 mb-4 items-center flex-wrap">
        {positions.map(p => (
          <button
            key={p}
            onClick={() => { setPos(p); setVisibleCount(PAGE_SIZE); }}
            style={{
              padding: '6px 14px',
              borderRadius: 4,
              fontFamily: 'var(--font-geist-mono), monospace',
              fontSize: 11,
              fontWeight: 700,
              color: pos === p ? 'var(--heat)' : 'var(--text)',
              background: pos === p ? 'rgba(255,90,36,0.12)' : 'var(--bg-card)',
              border: `1px solid ${pos === p ? 'rgba(255,90,36,0.4)' : 'var(--border)'}`,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {p}
          </button>
        ))}
        <span className="hidden md:block flex-1" />
        {/* Search — desktop only */}
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE); }}
          placeholder="Search players or teams"
          className="hidden md:block"
          style={{
            padding: '6px 14px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 4,
            color: 'var(--text)',
            fontSize: 12,
            fontFamily: 'var(--font-geist-sans), sans-serif',
            width: 240,
            outline: 'none',
          }}
        />
      </div>

      {/* Mobile sort pills */}
      <div className="flex md:hidden gap-2 mb-4 flex-wrap">
        {sortPills.map(pill => (
          <button
            key={pill.key}
            onClick={() => { setSort(pill.key); setVisibleCount(PAGE_SIZE); }}
            style={{
              padding: '6px 12px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 600,
              color: activePill(pill.key) ? 'var(--heat)' : 'var(--text)',
              background: activePill(pill.key) ? 'rgba(255,90,36,0.12)' : 'var(--bg-card)',
              border: `1px solid ${activePill(pill.key) ? 'rgba(255,90,36,0.4)' : 'var(--border)'}`,
              cursor: 'pointer',
            }}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* ── Desktop table ── */}
      <div
        className="hidden md:block rounded-2xl border overflow-hidden"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        {/* Header row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: GRID,
            gap: 12,
            padding: '14px 24px',
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--text)',
            letterSpacing: '0.1em',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <span>RANK</span>
          <span>PLAYER</span>
          <span>TEAM · POS</span>
          <span style={{ textAlign: 'right' }}>G</span>
          <span style={{ textAlign: 'right' }}>A</span>
          <span style={{ textAlign: 'right' }}>PTS</span>
          <span style={{ textAlign: 'right' }}>HEAT</span>
          <span>TREND (6W)</span>
          <span style={{ textAlign: 'right' }}>Δ AVG</span>
          <span />
        </div>

        {/* Data rows */}
        {visible.map(p => {
          const heat = ppmToHeat(p.momentum_ppm);
          const seasonHeat = ppmToHeat(p.season_ppm);
          const heatDelta = heat - seasonHeat;
          const borderColor = heatBorderColor(heat);
          const textCol = heatColor(heat);
          const sparkValues = sparklineByPlayer.get(p.player_id) ?? [];
          const name = `${p.players.first_name} ${p.players.last_name}`;

          const lastPlayedDaysAgo = p.last_played_date ? daysAgo(p.last_played_date) : null;
          const outStatus = p.players.injury_status
            ? null
            : deriveOutStatus(
                p.consecutive_games_missed ?? null,
                lastPlayedDaysAgo,
                p.players.in_minors ?? false,
                seasonHasStarted
              );
          const statusBadge = p.players.injury_status
            ? { label: 'INJURED',   color: 'var(--red)',   bg: 'rgba(239,68,68,0.18)' }
            : outStatus === 'minors'
            ? { label: 'MINORS',    color: 'var(--neon)',  bg: 'rgba(99,179,237,0.15)' }
            : outStatus === 'injured'
            ? { label: 'INJURED',   color: 'var(--red)',   bg: 'rgba(239,68,68,0.18)' }
            : outStatus === 'out'
            ? { label: 'OUT',       color: 'var(--amber)', bg: 'rgba(245,158,11,0.18)' }
            : outStatus === 'scratch'
            ? { label: 'SCRATCHED', color: 'var(--amber)', bg: 'rgba(245,158,11,0.18)' }
            : null;

          return (
            <Link
              key={p.player_id}
              href={playerUrl(p.player_id, p.players.first_name, p.players.last_name)}
              className="hover:opacity-80 transition-opacity"
              style={{
                display: 'grid',
                gridTemplateColumns: GRID,
                gap: 12,
                padding: '14px 24px',
                alignItems: 'center',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                borderLeft: `3px solid ${borderColor}`,
                textDecoration: 'none',
              }}
            >
              {/* Rank */}
              <span style={{
                fontFamily: 'var(--font-geist-mono), monospace',
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--text-bright)',
              }}>
                {p.momentum_rank}
              </span>

              {/* Player */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 14,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}>
                  {p.players.headshot_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.players.headshot_url}
                      alt={name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                    />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, color: 'var(--text)',
                    }}>
                      {p.players.first_name[0]}
                    </div>
                  )}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontWeight: 700, fontSize: 14, color: 'var(--text-bright)',
                    display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
                  }}>
                    {name}
                    {statusBadge && (
                      <span style={{
                        fontSize: 9, padding: '2px 6px', borderRadius: 3, fontWeight: 700,
                        background: statusBadge.bg, color: statusBadge.color,
                        letterSpacing: '0.05em', flexShrink: 0,
                      }}>
                        {statusBadge.label}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Team · Pos */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://assets.nhle.com/logos/nhl/svg/${p.players.teams.abbrev}_light.svg`}
                  alt={p.players.teams.abbrev}
                  style={{ width: 22, height: 22, flexShrink: 0 }}
                />
                <span style={{
                  fontFamily: 'var(--font-geist-mono), monospace',
                  fontSize: 10,
                  color: 'var(--text)',
                }}>
                  {p.players.position_code}
                </span>
              </div>

              {/* G */}
              <span style={{
                fontFamily: 'var(--font-geist-mono), monospace',
                fontSize: 13, color: 'var(--text)', textAlign: 'right',
              }}>
                {p.season_goals ?? '—'}
              </span>

              {/* A */}
              <span style={{
                fontFamily: 'var(--font-geist-mono), monospace',
                fontSize: 13, color: 'var(--text)', textAlign: 'right',
              }}>
                {p.season_assists ?? '—'}
              </span>

              {/* PTS */}
              <span style={{
                fontFamily: 'var(--font-geist-mono), monospace',
                fontSize: 13, fontWeight: 700,
                color: 'var(--text-bright)', textAlign: 'right',
              }}>
                {p.season_points ?? '—'}
              </span>

              {/* Heat pill */}
              <div style={{ textAlign: 'right' }}>
                <span style={{
                  fontFamily: 'var(--font-geist-mono), monospace',
                  fontSize: 13, fontWeight: 800,
                  color: textCol,
                  padding: '3px 8px',
                  borderRadius: 4,
                  background: `${borderColor}18`,
                  border: `1px solid ${borderColor}55`,
                }}>
                  {heat}
                </span>
              </div>

              {/* Sparkline */}
              <Sparkline values={sparkValues} color={borderColor} />

              {/* Δ AVG */}
              <span style={{
                fontFamily: 'var(--font-geist-mono), monospace',
                fontSize: 12, fontWeight: 700,
                color: heatDelta > 0
                  ? 'var(--rise)'
                  : heatDelta < 0
                  ? 'var(--red)'
                  : 'var(--text)',
                textAlign: 'right',
              }}>
                {heatDelta > 0 ? '+' : ''}{heatDelta}
              </span>

              {/* Arrow */}
              <span style={{ color: 'var(--text)', fontSize: 18, textAlign: 'right' }}>›</span>
            </Link>
          );
        })}
      </div>

      {/* ── Mobile list ── */}
      <div className="md:hidden flex flex-col gap-1.5">
        {visible.map(p => {
          const heat = ppmToHeat(p.momentum_ppm);
          const seasonHeat = ppmToHeat(p.season_ppm);
          const heatDelta = heat - seasonHeat;
          const borderColor = heatBorderColor(heat);
          const textCol = heatColor(heat);
          const up = heatDelta >= 0;

          return (
            <Link
              key={p.player_id}
              href={playerUrl(p.player_id, p.players.first_name, p.players.last_name)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px',
                background: 'var(--bg-card)',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.06)',
                borderLeft: `3px solid ${borderColor}`,
                textDecoration: 'none',
              }}
            >
              {/* Rank */}
              <span style={{
                width: 22, flexShrink: 0,
                fontFamily: 'var(--font-geist-mono), monospace',
                fontSize: 13, fontWeight: 700,
                color: 'var(--text-bright)',
              }}>
                {p.momentum_rank}
              </span>

              {/* Team logo */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://assets.nhle.com/logos/nhl/svg/${p.players.teams.abbrev}_light.svg`}
                alt={p.players.teams.abbrev}
                style={{ width: 26, height: 26, flexShrink: 0 }}
              />

              {/* Name + sub */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-bright)' }}>
                  {p.players.last_name}
                </div>
                <div style={{
                  fontFamily: 'var(--font-geist-mono), monospace',
                  fontSize: 10, color: 'var(--text)',
                }}>
                  {p.season_points ?? 0} pts · {heatDelta > 0 ? '+' : ''}{heatDelta}
                  <span style={{ color: up ? 'var(--rise)' : 'var(--red)', marginLeft: 4 }}>
                    {up ? '↑' : '↓'}
                  </span>
                </div>
              </div>

              {/* Heat pill */}
              <span style={{
                fontFamily: 'var(--font-geist-mono), monospace',
                fontSize: 11, fontWeight: 800,
                color: textCol,
                padding: '3px 8px',
                borderRadius: 4,
                background: `${borderColor}18`,
                border: `1px solid ${borderColor}55`,
                flexShrink: 0,
              }}>
                {heat}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Pagination */}
      {hasMore && (
        <button
          onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
          className="mt-4 w-full text-xs py-1.5 rounded-lg transition-opacity hover:opacity-80"
          style={{
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            cursor: 'pointer',
          }}
        >
          ↓ Show {Math.min(PAGE_SIZE, filtered.length - visibleCount)} more players
        </button>
      )}
    </div>
  );
}
