'use client';

import { useState } from 'react';
import Link from 'next/link';
import { playerUrl } from '@/lib/urls';
import { daysAgo, deriveOutStatus } from '@/lib/player-status';

interface Player {
  player_id: number;
  breakout_delta: number;
  momentum_ppm: number;
  season_ppm: number;
  last_played_date?: string | null;
  consecutive_games_missed?: number | null;
  players: {
    first_name: string;
    last_name: string;
    headshot_url: string | null;
    position_code: string;
    injury_status?: string | null;
    in_minors?: boolean | null;
    teams: { abbrev: string };
  };
}

function relativeTime(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1)    return 'just now';
  if (mins < 60)   return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

export default function BreakoutWatch({
  players,
  lastUpdated,
}: {
  players: Player[];
  lastUpdated?: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = players.slice(0, expanded ? 10 : 5);
  const canExpand = players.length > 5;

  return (
    <div className="rounded-xl border p-4 flex flex-col" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--amber)' }}>
          🔥 Breakout Watch
        </h2>
        <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--amber)' }}>
          Recent vs Season
        </span>
      </div>
      <p className="text-xs mb-2" style={{ color: 'var(--text)' }}>
        Players whose last 5-game pace is well above their season average — potential hot streaks worth watching.
      </p>

      {lastUpdated && (
        <p className="text-xs mb-3" style={{ color: 'var(--text)', opacity: 0.7 }}>
          Updated {relativeTime(lastUpdated)}
        </p>
      )}

      <div className="flex flex-col gap-2 flex-1">
        {visible.map((p) => {
          const name = `${p.players.first_name} ${p.players.last_name}`;
          const delta = p.breakout_delta ?? 0;
          const barPct = Math.min(100, Math.abs(delta) * 500);
          const pctAbove = p.season_ppm > 0
            ? Math.round(((p.momentum_ppm - p.season_ppm) / p.season_ppm) * 100)
            : 0;

          return (
            <Link key={p.player_id}
              href={playerUrl(p.player_id, p.players.first_name, p.players.last_name)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:opacity-80"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-800 flex-shrink-0">
                {p.players.headshot_url
                  ? <img src={p.players.headshot_url} alt={name} className="w-full h-full object-cover" loading="lazy" />
                  : <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: 'var(--text)' }}>
                      {p.players.first_name[0]}
                    </div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium truncate flex items-center gap-1.5" style={{ color: 'var(--text-bright)' }}>
                    {name}
                    {(() => {
                      const lastPlayedDaysAgo = p.last_played_date ? daysAgo(p.last_played_date) : null;
                      const outStatus = p.players?.injury_status
                        ? 'injured'
                        : deriveOutStatus(p.consecutive_games_missed ?? null, lastPlayedDaysAgo, p.players?.in_minors ?? false);
                      if (!outStatus) return null;
                      const label = outStatus === 'minors' ? 'MINORS' : outStatus === 'injured' ? 'INJURED' : outStatus === 'scratch' ? 'SCRATCHED' : 'OUT';
                      const color = outStatus === 'minors' ? 'var(--neon)' : outStatus === 'injured' ? 'var(--red)' : 'var(--amber)';
                      const bg    = outStatus === 'minors' ? 'rgba(99,179,237,0.15)' : outStatus === 'injured' ? 'rgba(239,68,68,0.18)' : 'rgba(245,158,11,0.18)';
                      return (
                        <span className="text-xs px-1 py-0.5 rounded font-bold flex-shrink-0"
                          style={{ background: bg, color }}>{label}</span>
                      );
                    })()}
                  </span>
                  <span className="text-xs font-mono font-semibold ml-2 flex-shrink-0" style={{ color: 'var(--amber)' }}>
                    {pctAbove >= 0 ? '+' : ''}{pctAbove}% vs avg
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
                  <div className="h-1.5 rounded-full transition-all" style={{ width: `${barPct}%`, background: 'var(--amber)' }} />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs" style={{ color: 'var(--text)' }}>
                    {p.players.teams.abbrev} · {p.players.position_code}
                  </span>
                  <span className="text-xs font-mono" style={{ color: 'var(--text)' }}>
                    {p.momentum_ppm?.toFixed(4)} PPM
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {canExpand && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="mt-2 w-full text-xs py-1.5 rounded-lg transition-opacity hover:opacity-80"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}>
          {expanded ? '↑ Show less' : `↓ Show ${players.length - 5} more`}
        </button>
      )}

      <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'var(--text)' }}>
            Showing top {visible.length}
          </span>
          <Link href="/rankings"
            className="text-xs font-medium hover:underline"
            style={{ color: 'var(--amber)' }}>
            View full rankings →
          </Link>
        </div>
      </div>
    </div>
  );
}
