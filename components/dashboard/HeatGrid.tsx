'use client';

import { useState } from 'react';
import Link from 'next/link';
import { playerUrl } from '@/lib/urls';
import { ppmToHeat, heatBg, heatBorderColor } from '@/lib/heat';

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


function logoUrl(abbrev: string) {
  return `https://assets.nhle.com/logos/nhl/svg/${abbrev}_light.svg`;
}

// ── Shared card shell ─────────────────────────────────────────────────────────

function CardShell({
  href,
  headshotUrl,
  heat,
  topLeft,
  topRight,
  bottom,
}: {
  href: string;
  headshotUrl: string | null;
  heat: number;
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
        borderBottom: `4px solid ${heatBorderColor(heat)}`,
      }}
    >
      {headshotUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={headshotUrl} alt=""
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

      {/* Top row: rank left, metric right */}
      <div className="absolute top-0 left-0 right-0 flex items-start justify-between p-2">
        {topLeft}
        {topRight}
      </div>

      {/* Bottom: flag/pos/num + name+logo */}
      <div className="absolute bottom-0 left-0 right-0 p-2 flex flex-col gap-0.5">
        {bottom}
      </div>
    </Link>
  );
}

// ── Rank badge (top-left spotlight) ──────────────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
  return (
    <div style={{ lineHeight: 1 }}>
      <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.5rem', fontFamily: 'monospace', marginBottom: '1px' }}>#</div>
      <div style={{
        color: '#fff', fontSize: '1.3rem', fontWeight: 900, fontFamily: 'monospace', lineHeight: 1,
        textShadow: '0 0 18px rgba(249,115,22,0.73), 0 0 6px rgba(249,115,22,0.4)',
      }}>
        {rank}
      </div>
    </div>
  );
}

// ── Skater card ───────────────────────────────────────────────────────────────

function SkaterCard({ p, rank }: { p: SkaterPlayer; rank: number }) {
  const heat = ppmToHeat(p.momentum_ppm);
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
      topLeft={<RankBadge rank={rank} />}
      topRight={
        surge !== null ? (
          <span style={{
            color: surge >= 0 ? 'var(--heat)' : 'rgba(255,255,255,0.38)',
            fontSize: '0.9rem', fontWeight: 800, fontFamily: 'monospace', lineHeight: 1,
            textShadow: surge >= 0 ? '0 0 10px rgba(249,115,22,0.33)' : 'none',
          }}>
            {surge >= 0 ? '↑' : '↓'}{Math.abs(Math.round(surge))}%
          </span>
        ) : (
          <span style={{ color: 'var(--heat)', fontSize: '1.1rem', fontWeight: 900, fontFamily: 'monospace', lineHeight: 1 }}>
            {heat}
          </span>
        )
      }
      bottom={
        <div className="flex items-end justify-between gap-1">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.92rem', lineHeight: 1.2 }}>
              {f ? `${f} ` : ''}{p.players.position_code}{p.players.sweater_number != null ? ` · #${p.players.sweater_number}` : ''}
            </span>
            <span className="truncate" style={{
              color: '#fff', fontSize: '0.82rem', fontWeight: 800, lineHeight: 1.2,
              textShadow: '0 1px 6px rgba(0,0,0,0.9)',
            }}>
              {initial ? `${initial}. ` : ''}{p.players.last_name}
            </span>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl(abbrev)} alt={abbrev}
            style={{ width: 38, height: 38, flexShrink: 0, filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.9))' }} />
        </div>
      }
    />
  );
}

// ── Goalie card ───────────────────────────────────────────────────────────────

function GoalieCard({ g, rank }: { g: GoaliePlayer; rank: number }) {
  const abbrev = g.teams?.abbrev ?? '?';
  const sv = g.avgSavePct;
  const heat = Math.round(Math.max(0, Math.min(100, (sv - 0.85) / 0.10 * 100)));
  const f = flag(g.birth_country);
  const initial = g.first_name?.[0] ?? '';

  return (
    <CardShell
      href={playerUrl(g.id, g.first_name, g.last_name)}
      headshotUrl={g.headshot_url}
      heat={heat}
      topLeft={<RankBadge rank={rank} />}
      topRight={
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: 'var(--heat)', fontSize: '1rem', fontWeight: 900, fontFamily: 'monospace', lineHeight: 1 }}>
            .{Math.round(sv * 1000).toString().padStart(3, '0')}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.54rem', lineHeight: 1.4 }}>
            {g.avgGAA.toFixed(2)} GAA
          </div>
        </div>
      }
      bottom={
        <div className="flex items-end justify-between gap-1">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.92rem', lineHeight: 1.2 }}>
              {f ? `${f} ` : ''}G
            </span>
            <span className="truncate" style={{
              color: '#fff', fontSize: '0.82rem', fontWeight: 800, lineHeight: 1.2,
              textShadow: '0 1px 6px rgba(0,0,0,0.9)',
            }}>
              {initial ? `${initial}. ` : ''}{g.last_name}
            </span>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl(abbrev)} alt={abbrev}
            style={{ width: 38, height: 38, flexShrink: 0, filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.9))' }} />
        </div>
      }
    />
  );
}

// ── Newcomer card ─────────────────────────────────────────────────────────────

function NewcomerCard({ p, rank }: { p: NewcomerPlayer; rank: number }) {
  const heat = ppmToHeat(p.momentum_ppm);
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
      topLeft={<RankBadge rank={rank} />}
      topRight={
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1rem', fontWeight: 900, fontFamily: 'monospace', lineHeight: 1 }}>
            {ppg}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.54rem', lineHeight: 1.4 }}>
            p/g · {p.players.career_games} GP
          </div>
        </div>
      }
      bottom={
        <div className="flex items-end justify-between gap-1">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.92rem', lineHeight: 1.2 }}>
              {f ? `${f} ` : ''}{p.players.position_code}
            </span>
            <span className="truncate" style={{
              color: '#fff', fontSize: '0.82rem', fontWeight: 800, lineHeight: 1.2,
              textShadow: '0 1px 6px rgba(0,0,0,0.9)',
            }}>
              {initial ? `${initial}. ` : ''}{p.players.last_name}
            </span>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl(abbrev)} alt={abbrev}
            style={{ width: 38, height: 38, flexShrink: 0, filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.9))' }} />
        </div>
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
  limit = 8,
}: {
  skaters: SkaterPlayer[];
  goalies: GoaliePlayer[];
  newcomers: NewcomerPlayer[];
  limit?: number;
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
                background: tab === key ? 'var(--heat)' : 'var(--bg-card)',
                color: tab === key ? '#fff' : 'var(--text)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Card grid — 2 cols on mobile, 4 on sm+ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {tab === 'skaters' && skaters.slice(0, limit).map((p, i) => (
          <SkaterCard key={p.player_id} p={p} rank={i + 1} />
        ))}
        {tab === 'goalies' && goalies.slice(0, limit).map((g, i) => (
          <GoalieCard key={g.id} g={g} rank={i + 1} />
        ))}
        {tab === 'newcomers' && newcomers.slice(0, limit).map((p, i) => (
          <NewcomerCard key={p.player_id} p={p} rank={i + 1} />
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2">
        <span style={{
          color: 'var(--silver)', opacity: 0.45, fontSize: '0.6rem',
          fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0,
        }}>
          {tab === 'skaters' ? 'HEAT' : tab === 'goalies' ? 'SV%' : 'PPG'}
        </span>
        <div style={{
          flex: 1, height: '5px', borderRadius: '3px',
          background: 'linear-gradient(to right, rgb(90,95,115), rgb(155,140,90), rgb(220,135,40), rgb(255,55,10))',
        }} />
        <span style={{ color: 'var(--silver)', opacity: 0.4, fontSize: '0.6rem' }}>cold</span>
        <span style={{ color: 'var(--silver)', opacity: 0.4, fontSize: '0.6rem' }}>hot</span>
      </div>

    </section>
  );
}
