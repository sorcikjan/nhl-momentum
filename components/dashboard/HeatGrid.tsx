'use client';

import { useState } from 'react';
import Link from 'next/link';
import { playerUrl } from '@/lib/urls';
import { ppmToHeat, heatColor } from '@/lib/heat';

// ── Types ─────────────────────────────────────────────────────────────────────

interface SkaterPlayer {
  player_id: number;
  momentum_ppm: number;
  season_ppm: number;
  players: {
    first_name: string;
    last_name: string;
    headshot_url: string | null;
    position_code: string;
    sweater_number?: number | null;
    birth_country?: string | null;
    teams: { abbrev: string };
  };
}

interface GoaliePlayer {
  id: number;
  first_name: string;
  last_name: string;
  headshot_url: string | null;
  birth_country?: string | null;
  teams: { id: number; abbrev: string; name: string } | null;
  avgSavePct: number;
  avgGAA: number;
  gamesPlayed: number;
}

interface NewcomerPlayer {
  player_id: number;
  season_goals: number;
  season_assists: number;
  season_games: number;
  momentum_ppm: number;
  players: {
    first_name: string;
    last_name: string;
    headshot_url: string | null;
    position_code: string;
    career_games: number;
    birth_country?: string | null;
    teams: { id: number; abbrev: string } | null;
  };
}

// ── Utilities ─────────────────────────────────────────────────────────────────

const FLAGS: Record<string, string> = {
  CAN: '🇨🇦', USA: '🇺🇸', SWE: '🇸🇪', FIN: '🇫🇮',
  CZE: '🇨🇿', SVK: '🇸🇰', RUS: '🇷🇺', DEU: '🇩🇪',
  CHE: '🇨🇭', AUT: '🇦🇹', LVA: '🇱🇻', DNK: '🇩🇰',
  NOR: '🇳🇴', BLR: '🇧🇾', UKR: '🇺🇦', SVN: '🇸🇮',
  FRA: '🇫🇷', GBR: '🇬🇧', NLD: '🇳🇱', KAZ: '🇰🇿',
  POL: '🇵🇱', BEL: '🇧🇪', HRV: '🇭🇷',
};

function flag(country?: string | null): string | null {
  return country ? (FLAGS[country] ?? null) : null;
}

function heatBg(heat: number): string {
  const t = heat / 100;
  return `rgb(${Math.round(13 + t * 120)},${Math.round(15 + t * 20)},${Math.round(20 - t * 10)})`;
}

function logoUrl(abbrev: string) {
  return `https://assets.nhle.com/logos/nhl/svg/${abbrev}_light.svg`;
}

// ── Shared card shell ─────────────────────────────────────────────────────────

function CardShell({
  href,
  headshotUrl,
  heat,
  borderColor,
  topLeft,
  topRight,
  bottom,
}: {
  href: string;
  headshotUrl: string | null;
  heat: number;
  borderColor: string;
  topLeft: React.ReactNode;
  topRight: React.ReactNode;
  bottom: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="relative rounded-xl overflow-hidden block hover:scale-105 hover:z-10 transition-transform duration-200"
      style={{
        background: headshotUrl ? '#0d0f14' : `linear-gradient(135deg, ${heatBg(heat)} 0%, #0d0f14 80%)`,
        aspectRatio: '3 / 4',
        borderBottom: `4px solid ${borderColor}`,
      }}
    >
      {headshotUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={headshotUrl}
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
        />
      )}

      {/* Heat-tinted top glow */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at 50% 0%, ${heatBg(heat)}99 0%, transparent 55%)`,
      }} />

      {/* Bottom dark scrim */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(8,8,12,0.97) 0%, rgba(8,8,12,0.65) 38%, rgba(8,8,12,0.1) 70%, transparent 100%)',
      }} />

      {/* Top row */}
      <div className="absolute top-0 left-0 right-0 flex items-start justify-between p-1.5">
        {topLeft}
        {topRight}
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 p-2 flex flex-col gap-0.5">
        {bottom}
      </div>
    </Link>
  );
}

// ── Skater card ───────────────────────────────────────────────────────────────

function SkaterCard({ p, rank }: { p: SkaterPlayer; rank: number }) {
  const heat = ppmToHeat(p.momentum_ppm);
  const color = heatColor(heat);
  const abbrev = p.players.teams.abbrev;
  const surge = p.season_ppm && p.season_ppm > 0
    ? ((p.momentum_ppm - p.season_ppm) / p.season_ppm * 100)
    : null;
  const f = flag(p.players.birth_country);
  const initial = p.players.first_name?.[0] ?? '';

  return (
    <CardShell
      href={playerUrl(p.player_id, p.players.first_name, p.players.last_name)}
      headshotUrl={p.players.headshot_url}
      heat={heat}
      borderColor={color}
      topLeft={
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl(abbrev)} alt={abbrev}
          style={{ width: 40, height: 40, filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.9))' }} />
      }
      topRight={
        surge !== null ? (
          <span style={{
            color: surge >= 0 ? color : 'rgba(255,255,255,0.4)',
            fontSize: '0.68rem', fontWeight: 800, fontFamily: 'monospace', lineHeight: 1,
            textShadow: surge >= 0 ? `0 0 8px ${color}55` : 'none',
          }}>
            {surge >= 0 ? '↑' : '↓'}{Math.abs(Math.round(surge))}%
          </span>
        ) : (
          <span style={{ color, fontSize: '1rem', fontWeight: 900, fontFamily: 'monospace', lineHeight: 1 }}>
            {heat}
          </span>
        )
      }
      bottom={
        <>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.58rem', lineHeight: 1.2 }}>
            {f ? `${f} ` : ''}{p.players.position_code}{p.players.sweater_number != null ? ` · #${p.players.sweater_number}` : ''}
          </span>
          <span className="truncate" style={{
            color: '#fff', fontSize: '0.8rem', fontWeight: 800, lineHeight: 1.2,
            textShadow: '0 1px 6px rgba(0,0,0,0.9)',
          }}>
            {initial ? `${initial}. ` : ''}{p.players.last_name}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.52rem', fontFamily: 'monospace' }}>
            #{rank}
          </span>
        </>
      }
    />
  );
}

// ── Goalie card ───────────────────────────────────────────────────────────────

function GoalieCard({ g, rank }: { g: GoaliePlayer; rank: number }) {
  const abbrev = g.teams?.abbrev ?? '?';
  const sv = g.avgSavePct;
  const svColor = sv >= 0.920 ? 'var(--neon)' : sv >= 0.905 ? 'var(--heat)' : 'var(--silver)';
  const heat = Math.round(Math.max(0, Math.min(100, (sv - 0.85) / 0.10 * 100)));
  const f = flag(g.birth_country);
  const initial = g.first_name?.[0] ?? '';

  return (
    <CardShell
      href={playerUrl(g.id, g.first_name, g.last_name)}
      headshotUrl={g.headshot_url}
      heat={heat}
      borderColor={svColor}
      topLeft={
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl(abbrev)} alt={abbrev}
          style={{ width: 40, height: 40, filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.9))' }} />
      }
      topRight={
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: svColor, fontSize: '0.82rem', fontWeight: 900, fontFamily: 'monospace', lineHeight: 1 }}>
            .{Math.round(sv * 1000).toString().padStart(3, '0')}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.52rem', lineHeight: 1.4 }}>
            {g.avgGAA.toFixed(2)} GAA
          </div>
        </div>
      }
      bottom={
        <>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.58rem', lineHeight: 1.2 }}>
            {f ? `${f} ` : ''}G
          </span>
          <span className="truncate" style={{
            color: '#fff', fontSize: '0.8rem', fontWeight: 800, lineHeight: 1.2,
            textShadow: '0 1px 6px rgba(0,0,0,0.9)',
          }}>
            {initial ? `${initial}. ` : ''}{g.last_name}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.52rem', fontFamily: 'monospace' }}>
            #{rank}
          </span>
        </>
      }
    />
  );
}

// ── Newcomer card ─────────────────────────────────────────────────────────────

function NewcomerCard({ p, rank }: { p: NewcomerPlayer; rank: number }) {
  const heat = ppmToHeat(p.momentum_ppm);
  const color = heatColor(heat);
  const abbrev = p.players.teams?.abbrev ?? '?';
  const f = flag(p.players.birth_country);
  const initial = p.players.first_name?.[0] ?? '';
  const pts = p.season_goals + p.season_assists;
  const ppg = p.season_games > 0 ? (pts / p.season_games).toFixed(2) : '—';

  return (
    <CardShell
      href={playerUrl(p.player_id, p.players.first_name, p.players.last_name)}
      headshotUrl={p.players.headshot_url}
      heat={heat}
      borderColor={color}
      topLeft={
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl(abbrev)} alt={abbrev}
          style={{ width: 40, height: 40, filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.9))' }} />
      }
      topRight={
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.68rem', fontWeight: 800, fontFamily: 'monospace', lineHeight: 1 }}>
            {p.players.career_games} GP
          </div>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.52rem', lineHeight: 1.4 }}>
            {ppg} p/g
          </div>
        </div>
      }
      bottom={
        <>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.58rem', lineHeight: 1.2 }}>
            {f ? `${f} ` : ''}{p.players.position_code}
          </span>
          <span className="truncate" style={{
            color: '#fff', fontSize: '0.8rem', fontWeight: 800, lineHeight: 1.2,
            textShadow: '0 1px 6px rgba(0,0,0,0.9)',
          }}>
            {initial ? `${initial}. ` : ''}{p.players.last_name}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.52rem', fontFamily: 'monospace' }}>
            #{rank}
          </span>
        </>
      }
    />
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type Tab = 'skaters' | 'goalies' | 'newcomers';

const TABS: { key: Tab; label: string }[] = [
  { key: 'skaters',   label: 'Skaters'     },
  { key: 'goalies',   label: 'Goalies'     },
  { key: 'newcomers', label: 'Fresh faces' },
];

const HEADLINES: Record<Tab, { title: React.ReactNode; sub: string }> = {
  skaters: {
    title: <><span style={{ color: 'var(--text-bright)' }}>Who&apos;s </span><span style={{ color: 'var(--heat)' }}>burning?</span></>,
    sub: 'Top skaters by 5-game momentum. ↑/↓ = vs season average.',
  },
  goalies: {
    title: <span style={{ color: 'var(--text-bright)' }}>Between the pipes</span>,
    sub: 'Top goalies ranked by 5-game save %.',
  },
  newcomers: {
    title: <span style={{ color: 'var(--text-bright)' }}>Fresh faces</span>,
    sub: 'First-year skaters making noise this season.',
  },
};

export default function HeatGrid({
  skaters,
  goalies,
  newcomers,
}: {
  skaters: SkaterPlayer[];
  goalies: GoaliePlayer[];
  newcomers: NewcomerPlayer[];
}) {
  const [tab, setTab] = useState<Tab>('skaters');
  const { title, sub } = HEADLINES[tab];

  return (
    <section className="flex flex-col gap-4">

      {/* Header + tabs */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-editorial" style={{ fontSize: '1.75rem', lineHeight: 1.1, fontWeight: 700 }}>
            {title}
          </h2>
          <p style={{ color: 'var(--silver)', opacity: 0.55, fontSize: '0.78rem', marginTop: '0.25rem' }}>
            {sub}
          </p>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="text-xs px-2.5 py-1 rounded-full font-semibold transition-colors"
              style={{
                background: tab === key ? 'var(--neon)' : 'var(--bg-card)',
                color: tab === key ? '#000' : 'var(--text)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Card grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
        {tab === 'skaters' && skaters.slice(0, 16).map((p, i) => (
          <SkaterCard key={p.player_id} p={p} rank={i + 1} />
        ))}
        {tab === 'goalies' && goalies.map((g, i) => (
          <GoalieCard key={g.id} g={g} rank={i + 1} />
        ))}
        {tab === 'newcomers' && newcomers.map((p, i) => (
          <NewcomerCard key={p.player_id} p={p} rank={i + 1} />
        ))}
      </div>

      {/* Skater legend */}
      {tab === 'skaters' && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span style={{
              color: 'var(--silver)', opacity: 0.5, fontSize: '0.6rem',
              fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', flexShrink: 0,
            }}>HEAT</span>
            <div style={{
              flex: 1, height: '6px', borderRadius: '3px',
              background: 'linear-gradient(to right, #1e2232, var(--heat))',
            }} />
            {['0', '50', '100'].map(n => (
              <span key={n} style={{ color: 'var(--silver)', opacity: 0.45, fontSize: '0.6rem', fontFamily: 'monospace' }}>{n}</span>
            ))}
          </div>
          <p style={{ color: 'var(--silver)', opacity: 0.4, fontSize: '0.65rem' }}>
            Bottom border color = heat. ↑/↓ in corner = momentum vs season average.
          </p>
        </div>
      )}

    </section>
  );
}
