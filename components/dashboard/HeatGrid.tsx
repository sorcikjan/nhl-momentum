'use client';

import Link from 'next/link';
import { playerUrl } from '@/lib/urls';
import { ppmToHeat, heatColor, heatLabel } from '@/lib/heat';

interface Player {
  player_id: number;
  momentum_ppm: number;
  season_ppm: number;
  players: {
    first_name: string;
    last_name: string;
    headshot_url: string | null;
    position_code: string;
    teams: { abbrev: string };
  };
}

function HeatTile({ p, rank }: { p: Player; rank: number }) {
  const heat = ppmToHeat(p.momentum_ppm);
  const color = heatColor(heat);
  const label = heatLabel(heat);
  const pct = p.season_ppm > 0
    ? Math.round(((p.momentum_ppm - p.season_ppm) / p.season_ppm) * 100)
    : 0;
  const isHot = heat >= 72;

  return (
    <Link
      href={playerUrl(p.player_id, p.players.first_name, p.players.last_name)}
      className="relative flex-shrink-0 rounded-2xl overflow-hidden hover:opacity-90 transition-opacity"
      style={{ width: '140px', height: '190px' }}
    >
      {/* Headshot photo background */}
      {p.players.headshot_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={p.players.headshot_url}
          alt={p.players.last_name}
          className="absolute inset-0 w-full h-full object-cover object-top"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-4xl font-black"
          style={{ background: 'var(--bg-card)', color: 'var(--border)' }}>
          {p.players.first_name[0]}
        </div>
      )}

      {/* Bottom gradient */}
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(to top, rgba(13,15,20,0.97) 0%, rgba(13,15,20,0.6) 55%, rgba(13,15,20,0.15) 100%)' }} />

      {/* Heat glow at top for hot players */}
      {isHot && (
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 50% -10%, ${color}30 0%, transparent 60%)` }} />
      )}

      {/* Rank badge — top left */}
      <span className="absolute top-2.5 left-3 text-xs font-mono font-bold"
        style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.6rem' }}>
        #{rank}
      </span>

      {/* Hot label — top right */}
      {label && (
        <span className="absolute top-2 right-2 text-xs font-bold px-1.5 py-0.5 rounded"
          style={{ background: `${color}22`, color, border: `1px solid ${color}44`, fontSize: '0.6rem', letterSpacing: '0.05em' }}>
          {label}
        </span>
      )}

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col gap-0.5">
        {/* Heat score */}
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black font-mono leading-none" style={{ color }}>
            {heat}
          </span>
          {pct !== 0 && (
            <span className="text-xs font-mono" style={{ color: pct > 0 ? 'var(--heat)' : 'var(--silver)', opacity: 0.8, fontSize: '0.6rem' }}>
              {pct > 0 ? '+' : ''}{pct}%
            </span>
          )}
        </div>

        {/* Name */}
        <span className="text-sm font-bold leading-tight truncate" style={{ color: 'var(--text-bright)' }}>
          {p.players.last_name}
        </span>

        {/* Team · Position */}
        <span className="text-xs" style={{ color: 'var(--silver)', opacity: 0.6, fontSize: '0.65rem' }}>
          {p.players.teams.abbrev} · {p.players.position_code}
        </span>
      </div>

      {/* Heat stripe at very bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5"
        style={{ background: color, opacity: heat >= 55 ? 0.7 : 0.2 }} />
    </Link>
  );
}

export default function HeatGrid({ players }: { players: Player[] }) {
  const top = players.slice(0, 20);

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text)', opacity: 0.5 }}>
          Who&apos;s burning?
        </h2>
        <Link href="/rankings" className="text-xs hover:underline" style={{ color: 'var(--silver)' }}>
          All rankings →
        </Link>
      </div>

      {/* Horizontal scroll strip */}
      <div className="flex gap-3 overflow-x-auto pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {top.map((p, i) => (
          <HeatTile key={p.player_id} p={p} rank={i + 1} />
        ))}
      </div>
    </section>
  );
}
