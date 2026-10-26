'use client';
import { useState } from 'react';
import { teamLogo } from '@/lib/team-colors';

const MONO = { fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' } as const;
const card = { background: 'var(--bg-card)', borderColor: 'var(--border)' } as const;

export type TrendGame = {
  date: string; opp: string; home?: boolean; res?: 'W' | 'L' | null;
  heat?: number | null; // Heat after this game (skaters)
  // skaters
  g?: number; a?: number; pts?: number; sog?: number; toi?: number; pm?: number;
  // goalies
  svPct?: number | null; ga?: number; sa?: number;
};
// Heat is compared with his position: the average and the top 5%.
export type TrendData = { kind: 'skater' | 'goalie'; games: TrendGame[]; heatAvg: number | null; heatTop: number | null; peers: { one: string; many: string } | null };

type Metric = { key: string; label: string; unit: string; get?: (g: TrendGame) => number | null; fmt: (v: number) => string; signed?: boolean };
const SKATER: Metric[] = [
  { key: 'heat', label: 'Heat', unit: 'HEAT', get: g => g.heat ?? null, fmt: v => String(Math.round(v)) },
  { key: 'pts', label: 'Points', unit: 'PTS', get: g => g.pts ?? 0, fmt: v => v.toFixed(2) },
  { key: 'g', label: 'Goals', unit: 'G', get: g => g.g ?? 0, fmt: v => v.toFixed(2) },
  { key: 'sog', label: 'Shots', unit: 'SOG', get: g => g.sog ?? 0, fmt: v => v.toFixed(1) },
  { key: 'toi', label: 'Ice time', unit: 'MIN', get: g => g.toi ?? 0, fmt: v => v.toFixed(1) },
  { key: 'pm', label: '+/-', unit: '+/-', get: g => g.pm ?? 0, fmt: v => (v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1)), signed: true },
];
const GOALIE: Metric[] = [
  { key: 'svPct', label: 'Save %', unit: 'SV%', get: g => g.svPct ?? null, fmt: v => v.toFixed(3).replace(/^0/, '') },
  { key: 'ga', label: 'Goals against', unit: 'GA', get: g => g.ga ?? 0, fmt: v => v.toFixed(2) },
  { key: 'sa', label: 'Shots faced', unit: 'SA', get: g => g.sa ?? 0, fmt: v => v.toFixed(1) },
];
// Short, medium and long horizons, counted in games.
const RANGES = [
  { key: 'short', label: 'Last 10 games', games: 10 },
  { key: 'medium', label: 'Last 25 games', games: 25 },
  { key: 'season', label: 'Season', games: Infinity },
] as const;

const fmtDate = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const avg = (xs: number[]) => (xs.length ? xs.reduce((s, v) => s + v, 0) / xs.length : 0);

function Toggle<T extends string>({ items, value, onChange, label }: { items: { key: T; label: string }[]; value: T; onChange: (k: T) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {items.map(i => (
        <button key={i.key} type="button" aria-pressed={i.key === value} onClick={() => onChange(i.key)}
          className="min-h-[34px] rounded-full border px-3 text-xs font-bold transition-colors"
          style={i.key === value
            ? { borderColor: 'var(--heat)', background: 'rgba(255,90,36,0.12)', color: 'var(--text-bright)' }
            : { borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}>
          {i.label}
        </button>
      ))}
    </div>
  );
}

const W = 1280, H = 220, PAD = 18;

function HeatLine({ games, avg, top }: { games: TrendGame[]; avg: number | null; top: number | null }) {
  const slot = W / games.length;
  const x = (i: number) => slot * (i + 0.5);
  const y = (h: number) => H - PAD - (h / 100) * (H - PAD * 2);
  const pts = games.map((g, i) => (g.heat == null ? null : { i, h: g.heat, g }));
  const shown = pts.filter((p): p is NonNullable<typeof p> => p != null);
  const line = shown.map((p, k) => `${k ? 'L' : 'M'} ${x(p.i).toFixed(1)} ${y(p.h).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-[170px] w-full lg:h-[240px]" preserveAspectRatio="none" role="img" aria-label="Heat after each game">
      {top != null && <rect x="0" y={y(100)} width={W} height={y(top) - y(100)} fill="var(--heat)" opacity="0.06" />}
      {top != null && <line x1="0" y1={y(top)} x2={W} y2={y(top)} stroke="var(--text-muted)" strokeWidth="1" strokeDasharray="2 4" vectorEffect="non-scaling-stroke" />}
      {avg != null && <line x1="0" y1={y(avg)} x2={W} y2={y(avg)} stroke="var(--text-bright)" strokeWidth="1.5" strokeDasharray="7 6" opacity="0.7" vectorEffect="non-scaling-stroke" />}
      <path d={line} stroke="var(--heat)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      {shown.map((p, k) => (
        <circle key={p.i} cx={x(p.i)} cy={y(p.h)} r={k === shown.length - 1 ? 7 : 5} fill={k === shown.length - 1 ? 'var(--heat)' : 'var(--bg-card)'} stroke="var(--heat)" strokeWidth="2.5" vectorEffect="non-scaling-stroke">
          <title>{`${fmtDate(p.g.date)} ${p.g.home ? 'vs' : '@'} ${p.g.opp}: Heat ${p.h} after the game`}</title>
        </circle>
      ))}
    </svg>
  );
}

// Under the chart, one column per game: the opponent's logo and the result.
// Past 25 games there is no room, so only the first and last dates.
function GameAxis({ games }: { games: TrendGame[] }) {
  if (games.length > 25) {
    return (
      <div className="flex justify-between text-[10px] font-semibold" style={{ ...MONO, color: 'var(--text-muted)' }}>
        <span>{fmtDate(games[0].date)}</span><span>{fmtDate(games[games.length - 1].date)}</span>
      </div>
    );
  }
  return (
    <div className="flex" aria-hidden>
      {games.map((g, i) => (
        <div key={`${g.date}-${i}`} className="flex min-w-0 flex-1 flex-col items-center gap-0.5" title={`${fmtDate(g.date)} ${g.home ? 'vs' : '@'} ${g.opp}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {g.opp && <img src={teamLogo(g.opp)} alt="" width={20} height={20} loading="lazy" className="h-4 w-4 object-contain lg:h-5 lg:w-5" />}
          <span className="hidden text-[9px] sm:block" style={{ ...MONO, color: 'var(--text-muted)' }}>{g.opp}</span>
          {g.res && <span className="text-[9px] font-bold" style={{ ...MONO, color: g.res === 'W' ? 'var(--rise)' : 'var(--red)' }}>{g.res}</span>}
        </div>
      ))}
    </div>
  );
}

function GameBars({ games, metric }: { games: TrendGame[]; metric: Metric }) {
  const vals = games.map(g => metric.get!(g));
  const nums = vals.filter((v): v is number => v != null);
  const lo = metric.signed ? Math.min(0, ...nums) : metric.key === 'svPct' ? Math.min(0.8, ...nums) : 0;
  const hi = Math.max(lo + (metric.key === 'svPct' ? 0.05 : 1), ...nums);
  const y = (v: number) => H - PAD - ((v - lo) / (hi - lo)) * (H - PAD * 2);
  const slot = W / Math.max(1, games.length);
  const bw = Math.max(4, Math.min(48, slot * 0.6));
  // Five-game rolling average, the trend through the noise of single games.
  const roll = vals.map((_, i) => avg(vals.slice(Math.max(0, i - 4), i + 1).filter((v): v is number => v != null)));
  const rollPath = roll.map((v, i) => `${i ? 'L' : 'M'} ${(slot * (i + 0.5)).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-[150px] w-full lg:h-[220px]" preserveAspectRatio="none" role="img" aria-label={`${metric.label} by game`}>
      {[0.2, 0.4, 0.6, 0.8].map(f => <line key={f} x1="0" y1={H * f} x2={W} y2={H * f} stroke="var(--border-soft)" strokeWidth="1" strokeDasharray="3 5" />)}
      <line x1="0" y1={y(lo)} x2={W} y2={y(lo)} stroke="var(--border)" strokeWidth="1" />
      {metric.signed && lo < 0 && <line x1="0" y1={y(0)} x2={W} y2={y(0)} stroke="var(--text-muted)" strokeWidth="1" />}
      {games.map((g, i) => {
        const v = vals[i];
        if (v == null) return null;
        const top = metric.signed ? Math.min(y(v), y(0)) : y(v);
        const height = Math.max(2, Math.abs((metric.signed ? y(0) : y(lo)) - y(v)));
        const color = metric.signed ? (v >= 0 ? 'var(--rise)' : 'var(--red)') : v > 0 ? 'var(--heat)' : 'var(--border)';
        return (
          <rect key={`${g.date}-${i}`} x={slot * (i + 0.5) - bw / 2} y={top} width={bw} height={height} rx="3" fill={color} opacity="0.85">
            <title>{`${fmtDate(g.date)} vs ${g.opp}: ${Number.isInteger(v) && metric.key !== 'svPct' ? (metric.signed && v > 0 ? `+${v}` : v) : metric.fmt(v)} ${metric.unit}`}</title>
          </rect>
        );
      })}
      {games.length >= 3 && <path d={rollPath} stroke="var(--text-bright)" strokeWidth="2" fill="none" strokeDasharray="5 5" vectorEffect="non-scaling-stroke" opacity="0.7" />}
    </svg>
  );
}

// Profile trend: pick a stat and a horizon, one point per game. Heat is the
// value after each game against his position; game stats are bars with a
// five-game rolling average.
export function TrendChart({ data }: { data: TrendData }) {
  const metrics = data.kind === 'goalie' ? GOALIE : SKATER;
  const [metricKey, setMetric] = useState(metrics[0].key);
  const [rangeKey, setRange] = useState<(typeof RANGES)[number]['key']>('medium');
  const metric = metrics.find(m => m.key === metricKey) ?? metrics[0];
  const range = RANGES.find(r => r.key === rangeKey)!;

  const games = range.games === Infinity ? data.games : data.games.slice(-range.games);
  const vals = games.map(g => metric.get!(g)).filter((v): v is number => v != null);
  let body: React.ReactNode = null, summary: React.ReactNode = null, legend: React.ReactNode = null;
  if (games.length >= 2 && vals.length >= 2) {
    if (metric.key === 'heat') {
      body = <HeatLine games={games} avg={data.heatAvg} top={data.heatTop} />;
      const first = vals[0], last = vals[vals.length - 1];
      summary = <>Now <b style={{ color: 'var(--heat)' }}>{last}</b> · {last >= first ? '+' : '−'}{Math.abs(last - first)} over these {games.length} games</>;
      legend = data.peers && (
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-[11px]" style={{ ...MONO, color: 'var(--text-muted)' }}>
          <span><span style={{ color: 'var(--heat)' }}>━●</span> Heat after each game</span>
          {data.heatAvg != null && <span><span style={{ color: 'var(--text-bright)' }}>╍</span> average {data.peers.one} ({data.heatAvg})</span>}
          {data.heatTop != null && <span>┈ top 5% of {data.peers.many} ({data.heatTop})</span>}
        </div>
      );
    } else {
      body = <GameBars games={games} metric={metric} />;
      const total = metric.key === 'g' || metric.key === 'pts' ? ` · ${vals.reduce((s, v) => s + v, 0)} total` : '';
      // Save % over a span is saves over shots, not the average of nightly percentages.
      const sa = games.reduce((n, g) => n + (g.sa ?? 0), 0);
      const value = metric.key === 'svPct' ? (sa ? (sa - games.reduce((n, g) => n + (g.ga ?? 0), 0)) / sa : 0) : avg(vals);
      summary = <><b style={{ color: 'var(--text-bright)' }}>{metric.fmt(value)}</b> {metric.unit}{metric.key === 'svPct' ? '' : ' per game'} over {games.length} games{total} · dashed: five-game average</>;
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border p-4 lg:p-6" style={card}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Toggle label="Stat" items={metrics.map(m => ({ key: m.key, label: m.label }))} value={metric.key} onChange={setMetric} />
        <Toggle label="Time span" items={RANGES.map(r => ({ key: r.key, label: r.label }))} value={rangeKey} onChange={setRange} />
      </div>
      {body ? (
        <>
          <p className="text-[13px]" style={{ color: 'var(--text)' }}>{summary}</p>
          {body}
          <GameAxis games={games} />
          {legend}
        </>
      ) : (
        <p className="py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Not enough games in this span yet.</p>
      )}
    </div>
  );
}
