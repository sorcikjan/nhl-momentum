'use client';

import { useState } from 'react';
import Link from 'next/link';
import { playerUrl } from '@/lib/urls';
import { ppmToHeat, heatBg, heatBorderColor, heatColor } from '@/lib/heat';

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
        textShadow: '0 0 18px rgba(255,90,36,0.73), 0 0 6px rgba(255,90,36,0.4)',
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
            textShadow: surge >= 0 ? '0 0 10px rgba(255,90,36,0.33)' : 'none',
          }}>
            {surge >= 0 ? '↑' : '↓'}{Math.abs(Math.round(surge))}%
          </span>
        ) : (
          <span style={{ color: heatColor(heat), fontSize: '1.1rem', fontWeight: 900, fontFamily: 'monospace', lineHeight: 1 }}>
            {heat}
          </span>
        )
      }
      bottom={
        <div className="flex items-end justify-between gap-1">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.92rem', lineHeight: 1.2 }}>
              {p.players.position_code}{p.players.sweater_number != null ? ` · #${p.players.sweater_number}` : ''}
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

// ── Skater row (for desktop column view) ──────────────────────────────────────

function SkaterRow({ p, rank }: { p: SkaterPlayer; rank: number }) {
  const heat = ppmToHeat(p.momentum_ppm);
  const abbrev = p.players.teams.abbrev;
  const initial = p.players.first_name?.[0] ?? '';

  return (
    <Link
      href={playerUrl(p.player_id, p.players.first_name, p.players.last_name)}
      className="flex items-center gap-3 rounded-lg px-3 py-2 hover:opacity-80 transition-opacity"
      style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}
    >
      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem', fontFamily: 'monospace', minWidth: '16px' }}>
        {rank}
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logoUrl(abbrev)} alt={abbrev} style={{ width: 24, height: 24, flexShrink: 0 }} />
      <span className="flex-1 truncate text-sm font-semibold" style={{ color: 'var(--text-bright)' }}>
        {initial}. {p.players.last_name}
      </span>
      <span
        className="text-xs font-mono font-bold px-1.5 py-0.5 rounded"
        style={{
          background: `${heatBg(heat)}44`,
          color: heatColor(heat),
          border: `1px solid ${heatBorderColor(heat)}`,
        }}
      >
        {heat}
      </span>
    </Link>
  );
}

// ── Goalie card ───────────────────────────────────────────────────────────────

function GoalieCard({ g, rank }: { g: GoaliePlayer; rank: number }) {
  const abbrev = g.teams?.abbrev ?? '?';
  const sv = g.avgSavePct;
  const heat = Math.round(Math.max(0, Math.min(100, (sv - 0.85) / 0.10 * 100)));
  const initial = g.first_name?.[0] ?? '';

  return (
    <CardShell
      href={playerUrl(g.id, g.first_name, g.last_name)}
      headshotUrl={g.headshot_url}
      heat={heat}
      topLeft={<RankBadge rank={rank} />}
      topRight={
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: heatColor(heat), fontSize: '1rem', fontWeight: 900, fontFamily: 'monospace', lineHeight: 1 }}>
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
            <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.92rem', lineHeight: 1.2 }}>G</span>
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

// ── Goalie row ─────────────────────────────────────────────────────────────────

function GoalieRow({ g, rank }: { g: GoaliePlayer; rank: number }) {
  const abbrev = g.teams?.abbrev ?? '?';
  const sv = g.avgSavePct;
  const heat = Math.round(Math.max(0, Math.min(100, (sv - 0.85) / 0.10 * 100)));
  const initial = g.first_name?.[0] ?? '';

  return (
    <Link
      href={playerUrl(g.id, g.first_name, g.last_name)}
      className="flex items-center gap-3 rounded-lg px-3 py-2 hover:opacity-80 transition-opacity"
      style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}
    >
      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem', fontFamily: 'monospace', minWidth: '16px' }}>
        {rank}
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logoUrl(abbrev)} alt={abbrev} style={{ width: 24, height: 24, flexShrink: 0 }} />
      <span className="flex-1 truncate text-sm font-semibold" style={{ color: 'var(--text-bright)' }}>
        {initial}. {g.last_name}
      </span>
      <span className="text-xs font-mono" style={{ color: heatColor(heat) }}>
        .{Math.round(sv * 1000).toString().padStart(3, '0')}
      </span>
    </Link>
  );
}

// ── Newcomer card ─────────────────────────────────────────────────────────────

function NewcomerCard({ p, rank }: { p: NewcomerPlayer; rank: number }) {
  const heat = ppmToHeat(p.momentum_ppm);
  const abbrev = p.players.teams?.abbrev ?? '?';
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
              {p.players.position_code}
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

// ── Newcomer row ──────────────────────────────────────────────────────────────

function NewcomerRow({ p, rank }: { p: NewcomerPlayer; rank: number }) {
  const heat = ppmToHeat(p.momentum_ppm);
  const abbrev = p.players.teams?.abbrev ?? '?';
  const initial = p.players.first_name?.[0] ?? '';
  const pts = p.season_goals + p.season_assists;
  const ppg = p.season_games > 0 ? (pts / p.season_games).toFixed(2) : '—';

  return (
    <Link
      href={playerUrl(p.player_id, p.players.first_name, p.players.last_name)}
      className="flex items-center gap-3 rounded-lg px-3 py-2 hover:opacity-80 transition-opacity"
      style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}
    >
      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem', fontFamily: 'monospace', minWidth: '16px' }}>
        {rank}
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logoUrl(abbrev)} alt={abbrev} style={{ width: 24, height: 24, flexShrink: 0 }} />
      <span className="flex-1 truncate text-sm font-semibold" style={{ color: 'var(--text-bright)' }}>
        {initial}. {p.players.last_name}
      </span>
      <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>{ppg} p/g</span>
    </Link>
  );
}

// ── Desktop column ─────────────────────────────────────────────────────────────

interface ColumnProps {
  tag: string;
  title: string;
  subtitle: string;
  listLink: string;
  children: React.ReactNode;
}

function DesktopColumn({ tag, title, subtitle, listLink, children }: ColumnProps) {
  return (
    <div className="rounded-xl border flex flex-col" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <p className="text-xs font-bold tracking-widest uppercase mb-0.5" style={{ color: 'var(--heat)', opacity: 0.7 }}>
          {tag}
        </p>
        <p className="font-semibold text-sm" style={{ color: 'var(--text-bright)' }}>{title}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text)', opacity: 0.5 }}>{subtitle}</p>
      </div>
      <div className="flex flex-col flex-1">
        {children}
      </div>
      <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
        <a href={listLink} className="text-xs font-semibold" style={{ color: 'var(--heat)' }}>
          FULL LIST →
        </a>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type Tab = 'skaters' | 'goalies' | 'newcomers';

const TABS: { key: Tab; label: string }[] = [
  { key: 'skaters',   label: 'Heat'        },
  { key: 'goalies',   label: 'Goalies'     },
  { key: 'newcomers', label: 'Fresh faces' },
];

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

  const top5Skaters = skaters.slice(0, 5);
  const top5Goalies = goalies.slice(0, 5);
  const top5Newcomers = newcomers.slice(0, 5);

  return (
    <section className="flex flex-col gap-4">

      {/* Section headline */}
      <div>
        <h2 style={{ fontFamily: 'var(--font-fraunces), Georgia, serif', fontWeight: 900, fontSize: '1.75rem', letterSpacing: '-0.025em', lineHeight: 1.05 }}>
          <span style={{ color: 'var(--text-bright)' }}>Who&apos;s </span>
          <span style={{ color: 'var(--heat)' }}>burning.</span>
        </h2>
        <p style={{ color: 'var(--silver)', opacity: 0.55, fontSize: '0.78rem', marginTop: '0.25rem' }}>
          Top skaters, goalies and rookies by recent Heat.
        </p>
      </div>

      {/* Desktop: 3-column layout */}
      <div className="hidden md:grid md:grid-cols-3 gap-4">
        <DesktopColumn
          tag="HEAT · TOP 5"
          title="Hottest skaters"
          subtitle="Ranked by 5-game momentum"
          listLink="/rankings"
        >
          {top5Skaters.map((p, i) => (
            <SkaterRow key={p.player_id} p={p} rank={i + 1} />
          ))}
        </DesktopColumn>

        <DesktopColumn
          tag="GOALIES · TOP 5"
          title="Best in net"
          subtitle="Ranked by 5-game save %"
          listLink="/rankings?tab=goalies"
        >
          {top5Goalies.map((g, i) => (
            <GoalieRow key={g.id} g={g} rank={i + 1} />
          ))}
        </DesktopColumn>

        <DesktopColumn
          tag="ROOKIES · TOP 5"
          title="Rookies on the rise"
          subtitle="First-year skaters making noise"
          listLink="/rankings?tab=newcomers"
        >
          {top5Newcomers.map((p, i) => (
            <NewcomerRow key={p.player_id} p={p} rank={i + 1} />
          ))}
        </DesktopColumn>
      </div>

      {/* Mobile: tab switcher + card grid */}
      <div className="md:hidden">
        {/* Pill tab switcher */}
        <div className="flex gap-1 mb-4">
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

        {/* Card grid — 2 cols */}
        <div className="grid grid-cols-2 gap-2">
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
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2">
        <span style={{
          color: 'var(--silver)', opacity: 0.45, fontSize: '0.6rem',
          fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0,
        }}>
          HEAT
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
