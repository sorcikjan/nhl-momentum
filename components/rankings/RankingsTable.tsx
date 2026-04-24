'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { playerUrl, teamUrl } from '@/lib/urls';
import { deriveOutStatus, daysAgo } from '@/lib/player-status';
import { ppmToHeat } from '@/lib/heat';

interface Player {
  player_id: number;
  momentum_rank: number;
  momentum_ppm: number;
  season_ppm: number;
  breakout_delta: number;
  sos_coefficient: number;
  energy_bar: number;
  momentum_goals: number;
  momentum_assists: number;
  momentum_points: number;
  season_goals: number;
  season_points: number;
  last_played_date?: string | null;
  consecutive_games_missed?: number;
  players: {
    first_name: string;
    last_name: string;
    headshot_url: string | null;
    position_code: string;
    injury_status: string | null;
    teams: { id: number; abbrev: string; name: string };
  };
}

type SortKey = 'momentum_rank' | 'momentum_ppm' | 'breakout_delta' | 'season_ppm' | 'energy_bar' | 'sos_coefficient';

export default function RankingsTable({ players }: { players: Player[] }) {
  const [sort, setSort] = useState<SortKey>('momentum_rank');
  const [pos, setPos] = useState<string>('ALL');

  const positions = ['ALL', 'C', 'L', 'R', 'D'];

  const filtered = useMemo(() =>
    players
      .filter(p => pos === 'ALL' || p.players.position_code === pos)
      .sort((a, b) => {
        if (sort === 'momentum_rank') return (a.momentum_rank ?? 999) - (b.momentum_rank ?? 999);
        if (sort === 'energy_bar') return (b.energy_bar ?? 0) - (a.energy_bar ?? 0);
        return (b[sort] ?? 0) - (a[sort] ?? 0);
      }),
    [players, pos, sort]
  );

  const th = (label: string, key: SortKey, hideOnMobile = false) => (
    <th
      onClick={() => setSort(key)}
      className={`px-2 md:px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer select-none transition-colors${hideOnMobile ? ' hidden md:table-cell' : ''}`}
      style={{ color: sort === key ? 'var(--neon)' : 'var(--text)' }}
    >
      {label} {sort === key ? '↓' : ''}
    </th>
  );

  return (
    <div>
      {/* Position filter */}
      <div className="flex gap-2 mb-4">
        {positions.map(p => (
          <button key={p} onClick={() => setPos(p)}
            className="px-3 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer min-h-[44px]"
            style={{
              background: pos === p ? 'var(--neon-glow)' : 'var(--bg-card)',
              color: pos === p ? 'var(--neon)' : 'var(--text)',
              border: `1px solid ${pos === p ? 'var(--neon)' : 'var(--border)'}`,
            }}>
            {p}
          </button>
        ))}
        <span className="ml-auto text-xs self-center" style={{ color: 'var(--text)' }}>
          {filtered.length} players
        </span>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
              <tr>
                <th className="w-1 p-0" />
                <th className="px-2 md:px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider w-8 md:w-12"
                  style={{ color: 'var(--text)' }}>#</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text)' }}>Player</th>
                {th('Heat', 'momentum_ppm')}
                {th('Δ Avg', 'breakout_delta')}
                {th('SOS', 'sos_coefficient', true)}
                {th('Energy', 'energy_bar', true)}
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider hidden md:table-cell"
                  style={{ color: 'var(--text)' }}>Last 5</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map((p, i) => {
                const name = `${p.players.first_name} ${p.players.last_name}`;
                const delta = p.breakout_delta ?? 0;
                const energy = p.energy_bar ?? 100;
                const energyColor = energy >= 70 ? 'var(--green)' : energy >= 40 ? 'var(--amber)' : 'var(--red)';
                const lastPlayedDaysAgo = p.last_played_date ? daysAgo(p.last_played_date) : null;
                const outStatus = p.players.injury_status
                  ? null
                  : deriveOutStatus(p.consecutive_games_missed ?? null, lastPlayedDaysAgo, p.players.in_minors ?? false);

                const statusBadge = p.players.injury_status
                  ? { label: 'INJURED',   color: 'var(--red)',   bg: 'rgba(239,68,68,0.18)' }
                  : outStatus === 'minors'  ? { label: 'MINORS',    color: 'var(--neon)',  bg: 'rgba(99,179,237,0.15)' }
                  : outStatus === 'injured' ? { label: 'INJURED',   color: 'var(--red)',   bg: 'rgba(239,68,68,0.18)' }
                  : outStatus === 'out'     ? { label: 'OUT',       color: 'var(--amber)', bg: 'rgba(245,158,11,0.18)' }
                  : outStatus === 'scratch' ? { label: 'SCRATCHED', color: 'var(--amber)', bg: 'rgba(245,158,11,0.18)' }
                  : null;

                const heat = ppmToHeat(p.momentum_ppm);
                const heatOpacity = Math.max(0.15, heat / 100);

                return (
                  <tr key={p.player_id}
                    className="border-t transition-colors"
                    style={{
                      borderColor: 'var(--border)',
                      background: i % 2 === 0 ? 'var(--bg)' : 'var(--bg-card)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'var(--bg)' : 'var(--bg-card)')}
                  >
                    {/* Heat stripe */}
                    <td className="w-1 p-0">
                      <div className="w-1 h-full min-h-[40px]" style={{
                        background: 'var(--heat)',
                        opacity: heatOpacity,
                      }} />
                    </td>
                    <td className="px-2 md:px-3 py-2.5 font-mono text-xs w-8 md:w-12" style={{ color: 'var(--text)' }}>
                      {p.momentum_rank}
                    </td>
                    <td className="px-3 py-2.5">
                      <Link href={playerUrl(p.player_id, p.players.first_name, p.players.last_name)}
                        className="flex items-center gap-2 hover:opacity-80">
                        <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-800 flex-shrink-0">
                          {p.players.headshot_url
                            ? <img src={p.players.headshot_url} alt={name} className="w-full h-full object-cover" loading="lazy" />
                            : <div className="w-full h-full flex items-center justify-center text-xs"
                                style={{ color: 'var(--text)' }}>{p.players.first_name[0]}</div>
                          }
                        </div>
                        <div>
                          <div className="font-medium text-sm flex items-center gap-1.5 flex-wrap" style={{ color: 'var(--text-bright)' }}>
                            {name}
                            {statusBadge && (
                              <span className="text-xs px-1.5 py-0.5 rounded font-bold"
                                style={{ background: statusBadge.bg, color: statusBadge.color }}>
                                {statusBadge.label}
                              </span>
                            )}
                          </div>
                          <div className="text-xs" style={{ color: 'var(--text)' }}>
                            <Link href={teamUrl(p.players.teams.id, p.players.teams.name)}
                              className="hover:opacity-80" style={{ color: 'var(--neon)' }}
                              onClick={e => e.stopPropagation()}>
                              {p.players.teams.abbrev}
                            </Link>
                            {' · '}{p.players.position_code}
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-2 py-2.5 font-mono text-xs md:text-sm font-bold" style={{ color: heat >= 72 ? 'var(--heat)' : heat >= 50 ? 'var(--amber)' : 'var(--text)' }}>
                      {heat}
                    </td>
                    <td className="px-2 py-2.5 font-mono text-xs md:text-sm"
                      style={{ color: delta > 0 ? 'var(--heat)' : delta < 0 ? 'var(--silver)' : 'var(--text)' }}>
                      {delta > 0 ? '+' : ''}{delta > 0 || delta < 0 ? `${(delta / (p.season_ppm || 0.001) * 100).toFixed(0)}%` : '—'}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs hidden md:table-cell" style={{ color: 'var(--text)' }}>
                      {(p.sos_coefficient ?? 1).toFixed(2)}
                    </td>
                    <td className="px-3 py-2.5 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
                          <div className="h-1.5 rounded-full" style={{ width: `${energy}%`, background: energyColor }} />
                        </div>
                        <span className="text-xs font-mono" style={{ color: energyColor }}>{energy}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs hidden md:table-cell" style={{ color: 'var(--text-bright)' }}>
                      {p.momentum_goals}G {p.momentum_assists}A
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
