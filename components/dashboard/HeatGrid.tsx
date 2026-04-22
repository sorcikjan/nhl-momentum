'use client';

import Link from 'next/link';
import { playerUrl } from '@/lib/urls';
import { ppmToHeat, heatColor } from '@/lib/heat';

interface Player {
  player_id: number;
  momentum_ppm: number;
  season_ppm: number;
  players: {
    first_name: string;
    last_name: string;
    headshot_url: string | null;
    position_code: string;
    sweater_number?: number | null;
    teams: { abbrev: string };
  };
}

const TEAM_BADGE_COLORS: Record<string, string> = {
  ANA: '#F47A38', ARI: '#8C2633', UTA: '#71AFE5',
  BOS: '#FFB81C', BUF: '#003087', CGY: '#C8102E',
  CAR: '#CC0000', CHI: '#CF0A2C', COL: '#6F263D',
  CBJ: '#002654', DAL: '#006847', DET: '#CE1126',
  EDM: '#FF4C00', FLA: '#041E42', LAK: '#A2AAAD',
  MIN: '#154734', MTL: '#AF1E2D', NSH: '#FFB81C',
  NJD: '#CE1126', NYI: '#003087', NYR: '#0038A8',
  OTT: '#C2912C', PHI: '#F74902', PIT: '#FCB514',
  SEA: '#99D9D9', SJS: '#006D75', STL: '#002F87',
  TBL: '#002868', TOR: '#003E7E', VAN: '#00843D',
  VGK: '#B4975A', WSH: '#C8102E', WPG: '#041E42',
};

function TeamBadge({ abbrev }: { abbrev: string }) {
  return (
    <span
      style={{
        background: TEAM_BADGE_COLORS[abbrev] ?? '#333',
        color: '#fff',
        padding: '2px 5px',
        borderRadius: '4px',
        fontSize: '0.6rem',
        fontWeight: 700,
        lineHeight: 1,
        display: 'inline-block',
      }}
    >
      {abbrev}
    </span>
  );
}

function heatBg(heat: number): string {
  const t = heat / 100;
  const r = Math.round(13 + t * 120);
  const g = Math.round(15 + t * 20);
  const b = Math.round(20 - t * 10);
  return `rgb(${r},${g},${b})`;
}

function PlayerCard({ p, rank }: { p: Player; rank: number }) {
  const heat = ppmToHeat(p.momentum_ppm);
  const color = heatColor(heat);
  const abbrev = p.players.teams.abbrev;
  const pos = p.players.position_code;
  const num = p.players.sweater_number;
  const headshotUrl = p.players.headshot_url;

  return (
    <Link
      href={playerUrl(p.player_id, p.players.first_name, p.players.last_name)}
      className="relative rounded-xl overflow-hidden hover:opacity-90 transition-opacity block"
      style={{
        background: headshotUrl ? '#0d0f14' : `linear-gradient(135deg, ${heatBg(heat)} 0%, #0d0f14 80%)`,
        aspectRatio: '3 / 4',
        minWidth: 0,
      }}
    >
      {/* Headshot background image */}
      {headshotUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={headshotUrl}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'top',
          }}
        />
      )}

      {/* Top heat-glow gradient overlay */}
      {headshotUrl && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 0%, ${heatBg(heat)}88 0%, transparent 60%)`,
          }}
        />
      )}

      {/* Bottom-up dark gradient overlay */}
      {headshotUrl && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(8,8,12,0.97) 0%, rgba(8,8,12,0.7) 40%, rgba(8,8,12,0.15) 75%, transparent 100%)',
          }}
        />
      )}

      {/* Top row: team logo (left) + heat score (right) */}
      <div className="absolute top-0 left-0 right-0 flex items-start justify-between p-1.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://assets.nhle.com/logos/nhl/svg/${abbrev}_light.svg`}
          alt={abbrev}
          style={{ width: '22px', height: '22px', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.8))' }}
        />
        <span
          className="leading-none"
          style={{
            color,
            fontSize: '1.15rem',
            fontWeight: 900,
            fontFamily: 'monospace',
            lineHeight: 1,
            textShadow: `0 0 12px ${color}88`,
          }}
        >
          {heat}
        </span>
      </div>

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 p-2 flex flex-col gap-0.5">
        {/* Position · jersey */}
        <span
          style={{
            color: 'rgba(255,255,255,0.45)',
            fontSize: '0.6rem',
            lineHeight: 1.2,
          }}
        >
          {pos}{num != null ? ` · #${num}` : ''}
        </span>
        {/* Last name */}
        <span
          className="truncate"
          style={{
            color: '#ffffff',
            fontSize: '0.85rem',
            fontWeight: 800,
            lineHeight: 1.2,
            textShadow: '0 1px 6px rgba(0,0,0,0.9)',
            letterSpacing: '-0.01em',
          }}
        >
          {p.players.last_name}
        </span>
      </div>

      {/* Rank watermark */}
      <span
        className="absolute font-mono font-bold"
        style={{
          color: 'rgba(255,255,255,0.12)',
          fontSize: '0.55rem',
          bottom: '1.6rem',
          left: '0.4rem',
        }}
      >
        #{rank}
      </span>
    </Link>
  );
}

export default function HeatGrid({ players }: { players: Player[] }) {
  const top15 = players.slice(0, 15);
  const top3 = players.slice(0, 3);
  const totalCount = players.length;

  return (
    <section className="flex flex-col gap-4">
      {/* 1. Section header */}
      <div>
        <h2
          className="font-editorial"
          style={{ fontSize: '1.75rem', lineHeight: 1.1, fontWeight: 700 }}
        >
          <span style={{ color: 'var(--text-bright)' }}>Who&apos;s </span>
          <span style={{ color: 'var(--heat)' }}>burning?</span>
        </h2>
        <p style={{ color: 'var(--silver)', opacity: 0.55, fontSize: '0.78rem', marginTop: '0.25rem' }}>
          {totalCount} skaters, scored 0–100 on their last 5 games.
        </p>
      </div>

      {/* 2. Top 3 podium */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: '#0d0f14', border: '1px solid var(--border)' }}
      >
        <div className="grid grid-cols-3">
          {top3.map((p, i) => {
            const heat = ppmToHeat(p.momentum_ppm);
            const color = heatColor(heat);
            const rank = i + 1;
            return (
              <Link
                key={p.player_id}
                href={playerUrl(p.player_id, p.players.first_name, p.players.last_name)}
                className="flex flex-col gap-1 p-3 hover:bg-white/5 transition-colors"
                style={{
                  borderRight: i < 2 ? '1px solid var(--border)' : undefined,
                }}
              >
                {/* Rank + team badge */}
                <div className="flex items-center gap-1.5">
                  <span style={{ color: 'var(--silver)', opacity: 0.5, fontSize: '0.65rem', fontWeight: 500 }}>
                    #{rank}
                  </span>
                  <TeamBadge abbrev={p.players.teams.abbrev} />
                </div>
                {/* Last name */}
                <span
                  className="font-bold truncate"
                  style={{ color: 'var(--text-bright)', fontSize: '0.95rem', lineHeight: 1.2 }}
                >
                  {p.players.last_name}
                </span>
                {/* Heat score */}
                <span
                  className="font-bold"
                  style={{ color, fontSize: '1.1rem', lineHeight: 1 }}
                >
                  {heat}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 3. 4-column grid of 15 player cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px',
        }}
      >
        {top15.map((p, i) => (
          <PlayerCard key={p.player_id} p={p} rank={i + 1} />
        ))}
      </div>

      {/* 4. Legend */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span
            style={{
              color: 'var(--silver)',
              opacity: 0.5,
              fontSize: '0.6rem',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              flexShrink: 0,
            }}
          >
            HEAT
          </span>
          <div
            style={{
              flex: 1,
              height: '6px',
              borderRadius: '3px',
              background: 'linear-gradient(to right, #1e2232, var(--heat))',
            }}
          />
          <span style={{ color: 'var(--silver)', opacity: 0.45, fontSize: '0.6rem', fontFamily: 'monospace' }}>0</span>
          <span style={{ color: 'var(--silver)', opacity: 0.45, fontSize: '0.6rem', fontFamily: 'monospace' }}>50</span>
          <span style={{ color: 'var(--silver)', opacity: 0.45, fontSize: '0.6rem', fontFamily: 'monospace' }}>100</span>
        </div>
        <p style={{ color: 'var(--silver)', opacity: 0.4, fontSize: '0.65rem' }}>
          Heat = a player&apos;s last-5-game pace, scored 0–100. Higher = hotter recent form.
        </p>
      </div>
    </section>
  );
}
