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
    teams: { abbrev: string };
  };
}

function HeatTile({ p, rank }: { p: Player; rank: number }) {
  const heat = ppmToHeat(p.momentum_ppm);
  const color = heatColor(heat);
  const pct = p.season_ppm > 0
    ? Math.round(((p.momentum_ppm - p.season_ppm) / p.season_ppm) * 100)
    : 0;

  return (
    <Link
      href={playerUrl(p.player_id, p.players.first_name, p.players.last_name)}
      className="flex flex-col items-center p-2.5 rounded-xl hover:opacity-80 transition-opacity relative overflow-hidden"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      {/* Heat glow background */}
      {heat >= 72 && (
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 50% 0%, ${color}18 0%, transparent 70%)` }} />
      )}

      {/* Headshot */}
      <div className="w-10 h-10 rounded-full overflow-hidden mb-1.5 flex-shrink-0 relative"
        style={{ border: `2px solid ${heat >= 72 ? color : 'var(--border)'}` }}>
        {p.players.headshot_url
          ? <img src={p.players.headshot_url} alt={p.players.last_name} className="w-full h-full object-cover" loading="lazy" />
          : <div className="w-full h-full flex items-center justify-center text-xs" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
              {p.players.first_name[0]}
            </div>
        }
      </div>

      {/* Name */}
      <span className="text-xs font-semibold text-center leading-tight mb-0.5 w-full truncate"
        style={{ color: 'var(--text-bright)' }}>
        {p.players.last_name}
      </span>

      {/* Team + position */}
      <span className="text-xs text-center" style={{ color: 'var(--silver)', fontSize: '0.6rem' }}>
        {p.players.teams.abbrev} · {p.players.position_code}
      </span>

      {/* Heat score */}
      <div className="mt-1.5 flex items-baseline gap-0.5">
        <span className="text-base font-black font-mono leading-none" style={{ color }}>
          {heat}
        </span>
        {pct !== 0 && (
          <span className="text-xs font-mono" style={{ color: pct > 0 ? 'var(--heat)' : 'var(--silver)', opacity: 0.7, fontSize: '0.6rem' }}>
            {pct > 0 ? '+' : ''}{pct}%
          </span>
        )}
      </div>

      {/* Rank */}
      <span className="absolute top-1.5 left-2 text-xs font-mono" style={{ color: 'var(--text)', opacity: 0.3, fontSize: '0.6rem' }}>
        #{rank}
      </span>
    </Link>
  );
}

export default function HeatGrid({
  players,
}: {
  players: Player[];
}) {
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

      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
        {top.map((p, i) => (
          <HeatTile key={p.player_id} p={p} rank={i + 1} />
        ))}
      </div>

      <p className="text-xs mt-2" style={{ color: 'var(--silver)', opacity: 0.5 }}>
        Heat = last-5-game pace vs season avg, scaled 0–100
      </p>
    </section>
  );
}
