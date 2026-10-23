'use client';
import { useState } from 'react';

const MONO = { fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' } as const;
const card = { background: 'var(--bg-card)', borderColor: 'var(--border)' } as const;

export type TrendGame = {
  date: string; opp: string;
  // skaters
  g?: number; a?: number; pts?: number; sog?: number; toi?: number; pm?: number;
  // goalies
  svPct?: number | null; ga?: number; sa?: number;
};
export type TrendData = { kind: 'skater' | 'goalie'; heat: { date: string; heat: number }[]; seasonAvgHeat: number | null; games: TrendGame[] };

type Metric = { key: string; label: string; unit: string; get?: (g: TrendGame) => number | null; fmt: (v: number) => string; signed?: boolean };
const SKATER: Metric[] = [
  { key: 'heat', label: 'Heat', unit: 'HEAT', fmt: v => String(Math.round(v)) },
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
// Short, medium and long horizons: by games for per-game stats, by days for Heat.
const RANGES = [
  { key: 'short', label: 'Last 10 games', games: 10, days: 14 },
  { key: 'medium', label: 'Last 25 games', games: 25, days: 45 },
  { key: 'season', label: 'Season', games: Infinity, days: Infinity },
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

function HeatLine({ series, seasonAvg }: { series: { date: string; heat: number }[]; seasonAvg: number | null }) {
  const x = (i: number) => (series.length === 1 ? W / 2 : (i / (series.length - 1)) * W);
  const y = (h: number) => H - PAD - (h / 100) * (H - PAD * 2);
  const line = series.map((p, i) => `${i ? 'L' : 'M'} ${x(i).toFixed(1)} ${y(p.heat).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-[150px] w-full lg:h-[220px]" preserveAspectRatio="none" role="img" aria-label="Heat by day">
      {[0.2, 0.4, 0.6, 0.8].map(f => <line key={f} x1="0" y1={H * f} x2={W} y2={H * f} stroke="var(--border-soft)" strokeWidth="1" strokeDasharray="3 5" />)}
      {seasonAvg != null && <line x1="0" y1={y(seasonAvg)} x2={W} y2={y(seasonAvg)} stroke="var(--text-muted)" strokeWidth="1" strokeDasharray="6 6" />}
      <path d={`${line} L ${x(series.length - 1)} ${H} L ${x(0)} ${H} Z`} fill="var(--heat)" opacity="0.12" />
      <path d={line} stroke="var(--heat)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      {series.map((p, i) => (
        <circle key={p.date} cx={x(i)} cy={y(p.heat)} r={i === series.length - 1 ? 6 : 10} fill={i === series.length - 1 ? 'var(--heat)' : 'transparent'}>
          <title>{`${fmtDate(p.date)}: Heat ${p.heat}`}</title>
        </circle>
      ))}
    </svg>
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
            <title>{`${fmtDate(g.date)} vs ${g.opp}: ${Number.isInteger(v) ? (metric.signed && v > 0 ? `+${v}` : v) : metric.fmt(v)} ${metric.unit}`}</title>
          </rect>
        );
      })}
      {games.length >= 3 && <path d={rollPath} stroke="var(--text-bright)" strokeWidth="2" fill="none" strokeDasharray="5 5" vectorEffect="non-scaling-stroke" opacity="0.7" />}
    </svg>
  );
}

// Profile trend: pick a stat and a horizon. Heat is daily; game stats are one
// bar per game with a five-game rolling average.
export function TrendChart({ data }: { data: TrendData }) {
  const metrics = data.kind === 'goalie' ? GOALIE : SKATER;
  const [metricKey, setMetric] = useState(metrics[0].key);
  const [rangeKey, setRange] = useState<(typeof RANGES)[number]['key']>('medium');
  const metric = metrics.find(m => m.key === metricKey) ?? metrics[0];
  const range = RANGES.find(r => r.key === rangeKey)!;

  let body: React.ReactNode, summary: React.ReactNode, from: string | null = null, to: string | null = null;
  if (metric.key === 'heat') {
    const cutoff = range.days === Infinity ? '' : new Date(Date.now() - range.days * 86_400_000).toISOString().slice(0, 10);
    const series = data.heat.filter(p => p.date >= cutoff);
    if (series.length < 2) body = null;
    else {
      body = <HeatLine series={series} seasonAvg={data.seasonAvgHeat} />;
      const first = series[0].heat, last = series[series.length - 1].heat;
      summary = <>Now <b style={{ color: 'var(--heat)' }}>{last}</b> · {last >= first ? '+' : '−'}{Math.abs(last - first)} over this span{data.seasonAvgHeat != null && <> · season average {data.seasonAvgHeat} (dashed)</>}</>;
      from = series[0].date; to = series[series.length - 1].date;
    }
  } else {
    const games = range.games === Infinity ? data.games : data.games.slice(-range.games);
    const vals = games.map(g => metric.get!(g)).filter((v): v is number => v != null);
    if (games.length < 2) body = null;
    else {
      body = <GameBars games={games} metric={metric} />;
      const total = metric.key === 'g' || metric.key === 'pts' ? ` · ${vals.reduce((s, v) => s + v, 0)} total` : '';
      // Save % over a span is saves over shots, not the average of nightly percentages.
      const sa = games.reduce((n, g) => n + (g.sa ?? 0), 0);
      const value = metric.key === 'svPct' ? (sa ? (sa - games.reduce((n, g) => n + (g.ga ?? 0), 0)) / sa : 0) : avg(vals);
      summary = <><b style={{ color: 'var(--text-bright)' }}>{metric.fmt(value)}</b> {metric.unit}{metric.key === 'svPct' ? '' : ' per game'} over {games.length} games{total} · dashed: five-game average</>;
      from = games[0].date; to = games[games.length - 1].date;
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border p-4 lg:p-6" style={card}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Toggle label="Stat" items={metrics.map(m => ({ key: m.key, label: m.label }))} value={metric.key} onChange={setMetric} />
        <Toggle label="Time span" items={RANGES.map(r => ({ key: r.key, label: r.key === 'short' && metric.key === 'heat' ? 'Last 2 weeks' : r.key === 'medium' && metric.key === 'heat' ? 'Last 6 weeks' : r.label }))} value={rangeKey} onChange={setRange} />
      </div>
      {body ? (
        <>
          <p className="text-[13px]" style={{ color: 'var(--text)' }}>{summary}</p>
          {body}
          <div className="flex justify-between text-[10px] font-semibold" style={{ ...MONO, color: 'var(--text-muted)' }}>
            <span>{from && fmtDate(from)}</span><span>{to && fmtDate(to)}</span>
          </div>
        </>
      ) : (
        <p className="py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Not enough games in this span yet.</p>
      )}
    </div>
  );
}
