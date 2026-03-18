'use client';
import { useState } from 'react';

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
  players: {
    first_name: string;
    last_name: string;
    headshot_url: string | null;
    position_code: string;
    injury_status: string | null;
    teams: { abbrev: string };
  };
}

type SortKey = 'momentum_rank' | 'momentum_ppm' | 'breakout_delta' | 'season_ppm' | 'energy_bar' | 'sos_coefficient';

export default function RankingsTable({ players }: { players: Player[] }) {
  const [sort, setSort] = useState<SortKey>('momentum_rank');
  const [pos, setPos] = useState<string>('ALL');

  const positions = ['ALL', 'C', 'L', 'R', 'D'];

  const filtered = players
    .filter(p => pos === 'ALL' || p.players.position_code === pos)
    .sort((a, b) => {
      if (sort === 'momentum_rank') return (a.momentum_rank ?? 999) - (b.momentum_rank ?? 999);
      if (sort === 'energy_bar') return (b.energy_bar ?? 0) - (a.energy_bar ?? 0);
      return (b[sort] ?? 0) - (a[sort] ?? 0);
    });

  const th = (label: string, key: SortKey) => (
    <th
      onClick={() => setSort(key)}
      className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer select-none transition-colors"
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
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
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
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider w-12"
                  style={{ color: 'var(--text)' }}>#</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text)' }}>Player</th>
                {th('M.PPM', 'momentum_ppm')}
                {th('S.PPM', 'season_ppm')}
                {th('Delta', 'breakout_delta')}
                {th('SOS', 'sos_coefficient')}
                {th('Energy', 'energy_bar')}
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text)' }}>Last 5</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map((p, i) => {
                const name = `${p.players.first_name} ${p.players.last_name}`;
                const delta = p.breakout_delta ?? 0;
                const energy = p.energy_bar ?? 100;
                const energyColor = energy >= 70 ? 'var(--green)' : energy >= 40 ? 'var(--amber)' : 'var(--red)';

                return (
                  <tr key={p.player_id}
                    className="border-t transition-colors cursor-pointer"
                    style={{
                      borderColor: 'var(--border)',
                      background: i % 2 === 0 ? 'var(--bg)' : 'var(--bg-card)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'var(--bg)' : 'var(--bg-card)')}
                  >
                    <td className="px-3 py-2.5 font-mono text-xs w-12" style={{ color: 'var(--text)' }}>
                      {p.momentum_rank}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-800 flex-shrink-0">
                          {p.players.headshot_url
                            ? <img src={p.players.headshot_url} alt={name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-xs"
                                style={{ color: 'var(--text)' }}>{p.players.first_name[0]}</div>
                          }
                        </div>
                        <div>
                          <div className="font-medium text-sm" style={{ color: 'var(--text-bright)' }}>
                            {name}
                            {p.players.injury_status && (
                              <span className="ml-1 text-xs px-1 rounded" style={{ background: 'rgba(239,68,68,0.2)', color: 'var(--red)' }}>
                                {p.players.injury_status}
                              </span>
                            )}
                          </div>
                          <div className="text-xs" style={{ color: 'var(--text)' }}>
                            {p.players.teams.abbrev} · {p.players.position_code}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-sm font-semibold" style={{ color: 'var(--neon)' }}>
                      {(p.momentum_ppm ?? 0).toFixed(4)}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-sm" style={{ color: 'var(--silver)' }}>
                      {(p.season_ppm ?? 0).toFixed(4)}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-sm"
                      style={{ color: delta > 0 ? 'var(--green)' : delta < 0 ? 'var(--red)' : 'var(--text)' }}>
                      {delta > 0 ? '+' : ''}{delta.toFixed(4)}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs" style={{ color: 'var(--text)' }}>
                      {(p.sos_coefficient ?? 1).toFixed(2)}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
                          <div className="h-1.5 rounded-full" style={{ width: `${energy}%`, background: energyColor }} />
                        </div>
                        <span className="text-xs font-mono" style={{ color: energyColor }}>{energy}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs" style={{ color: 'var(--text-bright)' }}>
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
