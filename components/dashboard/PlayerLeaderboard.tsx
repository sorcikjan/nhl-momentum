'use client';

import { useState } from 'react';
import Link from 'next/link';
import { playerUrl } from '@/lib/urls';
import { daysAgo, deriveOutStatus } from '@/lib/player-status';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPlayer = Record<string, any> & {
  player_id: number;
  consecutive_games_missed?: number | null;
  players: {
    first_name: string;
    last_name: string;
    headshot_url: string | null;
    position_code: string;
    injury_status?: string | null;
    teams: { abbrev: string };
  };
};

export interface LeaderboardConfig {
  title: string;
  subtitle: string;
  badge: string;
  color: string;        // e.g. 'var(--neon)'
  colorBg: string;      // e.g. 'rgba(59,130,246,0.15)'
  metricKey: string;    // field name on the player object
  decimals: number;     // decimal places for value
  metricLabel: string;  // unit label, e.g. 'PPM', 'G', 'A', 'pts', '%'
  signed?: boolean;     // prepend '+' to positive values (for surge/delta columns)
  fullPageHref: string;
}

function relativeTime(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1)    return 'just now';
  if (mins < 60)   return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

export default function PlayerLeaderboard({
  config,
  players,
  lastUpdated,
  compact = false,
}: {
  config: LeaderboardConfig;
  players: AnyPlayer[];
  lastUpdated?: string | null;
  compact?: boolean;
}) {
  const defaultCount = compact ? 5 : 5;
  const [expanded, setExpanded] = useState(false);
  const visible = players.slice(0, expanded ? 10 : defaultCount);
  const canExpand = players.length > defaultCount;

  return (
    <div className="rounded-xl border p-4 flex flex-col"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold uppercase tracking-wider"
          style={{ color: config.color }}>
          {config.title}
        </h2>
        <span className="text-xs px-2 py-0.5 rounded"
          style={{ background: config.colorBg, color: config.color }}>
          {config.badge}
        </span>
      </div>
      {!compact && (
        <p className="text-xs mb-2" style={{ color: 'var(--text)' }}>
          {config.subtitle}
        </p>
      )}

      {!compact && lastUpdated && (
        <p className="text-xs mb-3" style={{ color: 'var(--text)', opacity: 0.7 }}>
          Updated {relativeTime(lastUpdated)}
        </p>
      )}

      {/* Player rows */}
      <div className="flex flex-col gap-2 flex-1">
        {visible.map((p, i) => {
          const name = `${p.players.first_name} ${p.players.last_name}`;
          const raw = p[config.metricKey];
          const numRaw = Number(raw);
          const formatted = raw == null
            ? '—'
            : config.decimals === 0
              ? String(Math.round(numRaw))
              : numRaw.toFixed(config.decimals);
          const value = raw != null && config.signed && numRaw > 0
            ? `+${formatted}`
            : formatted;

          return (
            <Link key={p.player_id}
              href={playerUrl(p.player_id, p.players.first_name, p.players.last_name)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:opacity-80"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <span className="text-xs w-5 text-center font-mono font-bold"
                style={{ color: config.color }}>
                {i + 1}
              </span>
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-800 flex-shrink-0">
                {p.players.headshot_url
                  ? <img src={p.players.headshot_url} alt={name}
                      className="w-full h-full object-cover" loading="lazy" />
                  : <div className="w-full h-full flex items-center justify-center text-xs"
                      style={{ color: 'var(--text)' }}>
                      {p.players.first_name[0]}
                    </div>
                }
              </div>
              <div className="flex-1 min-w-0">
                {(() => {
                  const lastPlayedDaysAgo = p.last_played_date ? daysAgo(p.last_played_date) : null;
                  const outStatus = p.players?.injury_status
                    ? 'injured'
                    : deriveOutStatus(p.consecutive_games_missed ?? null, lastPlayedDaysAgo);
                  const badge = p.players?.injury_status || outStatus === 'injured'
                    ? { label: 'INJURED',   color: 'var(--red)',   bg: 'rgba(239,68,68,0.18)' }
                    : outStatus === 'out'
                    ? { label: 'OUT',       color: 'var(--amber)', bg: 'rgba(245,158,11,0.18)' }
                    : outStatus === 'scratch'
                    ? { label: 'SCRATCHED', color: 'var(--amber)', bg: 'rgba(245,158,11,0.18)' }
                    : null;
                  return (
                    <div className="text-sm font-medium truncate flex items-center gap-1"
                      style={{ color: 'var(--text-bright)' }}>
                      {name}
                      {badge && (
                        <span className="text-xs px-1 py-0.5 rounded font-bold flex-shrink-0"
                          style={{ background: badge.bg, color: badge.color }}>
                          {badge.label}
                        </span>
                      )}
                    </div>
                  );
                })()}
                <div className="text-xs" style={{ color: 'var(--text)' }}>
                  {p.players.teams.abbrev} · {p.players.position_code}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-sm font-mono font-semibold"
                  style={{ color: config.color }}>{value}</div>
                <div className="text-xs" style={{ color: 'var(--text)' }}>
                  {config.metricLabel}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Expand toggle */}
      {canExpand && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="mt-2 w-full text-xs py-1.5 rounded-lg transition-opacity hover:opacity-80"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}>
          {expanded ? '↑ Show less' : `↓ Show ${players.length - 5} more`}
        </button>
      )}

      {/* Footer */}
      <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'var(--text)' }}>
            Showing top {visible.length}
          </span>
          <Link href={config.fullPageHref}
            className="text-xs font-medium hover:underline"
            style={{ color: config.color }}>
            View full rankings →
          </Link>
        </div>
      </div>
    </div>
  );
}
