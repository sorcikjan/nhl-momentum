'use client';
import { useState, useMemo } from 'react';
import {
  ComposedChart, Area, Line, CartesianGrid, XAxis, YAxis,
  ReferenceLine, ResponsiveContainer, Tooltip,
} from 'recharts';
import { ppmToHeat } from '@/lib/heat';

interface Snapshot {
  momentum_ppm: number;
  season_ppm: number;
  calculated_at: string;
}

interface GameEvent {
  date: string;      // "MM/DD"
  fullDate: string;  // "YYYY-MM-DD" for lookup and sort
  goals: number;
  assists: number;
  plusMinus: number;
}

type Tab    = '6w' | 'season';
type Metric = 'heat' | 'goals' | 'assists' | 'plusMinus';

const METRICS: { key: Metric; label: string; color: string }[] = [
  { key: 'heat',      label: 'Heat', color: 'var(--heat)' },
  { key: 'goals',     label: 'G',    color: '#f59e0b' },
  { key: 'assists',   label: 'A',    color: '#3a88ff' },
  { key: 'plusMinus', label: '+/-',  color: '#00e5a0' },
];

export default function HeatTimeline({
  snapshots,
  leaguePpm,
  gameEvents,
  leagueGoalsPerGame,
  leagueAssistsPerGame,
  p95GoalsPerGame,
  p5GoalsPerGame,
  p95AssistsPerGame,
  p5AssistsPerGame,
  p95PlusMinusPerGame,
  p5PlusMinusPerGame,
}: {
  snapshots: Snapshot[];
  leaguePpm?: number;
  gameEvents?: GameEvent[];
  leagueGoalsPerGame?: number;
  leagueAssistsPerGame?: number;
  p95GoalsPerGame?: number;
  p5GoalsPerGame?: number;
  p95AssistsPerGame?: number;
  p5AssistsPerGame?: number;
  p95PlusMinusPerGame?: number;
  p5PlusMinusPerGame?: number;
}) {
  const [tab,    setTab]    = useState<Tab>('6w');
  const [metric, setMetric] = useState<Metric>('heat');

  const deduped = useMemo(() => {
    const byDate = new Map<string, Snapshot>();
    for (const s of snapshots) byDate.set(s.calculated_at.slice(0, 10), s);
    return Array.from(byDate.values()).sort((a, b) => a.calculated_at.localeCompare(b.calculated_at));
  }, [snapshots]);

  const allData = useMemo(() => {
    const sorted = [...(gameEvents ?? [])].sort((a, b) => a.fullDate.localeCompare(b.fullDate));

    // Build snapshot heat lookup: "YYYY-MM-DD" → heat value
    const heatByDate = new Map<string, number>();
    for (const s of deduped) {
      heatByDate.set(s.calculated_at.slice(0, 10), ppmToHeat(s.momentum_ppm));
    }

    const fmtDate = (iso: string) => {
      const d = new Date(iso + 'T12:00:00Z');
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // No game events (goalies / edge case): fall back to date-based snapshot data
    if (sorted.length === 0) {
      return deduped.map((s, i) => ({
        label:        `G${i + 1}`,
        dateLabel:    fmtDate(s.calculated_at.slice(0, 10)),
        snapshotDate: s.calculated_at.slice(0, 10),
        heat:         ppmToHeat(s.momentum_ppm),
        cumGoals:     null as number | null,
        cumAssists:   null as number | null,
        cumPlusMinus: null as number | null,
        leaguePaceGoals:   null as number | null,
        leaguePaceAssists: null as number | null,
        p95PaceGoals:      null as number | null,
        p5PaceGoals:       null as number | null,
        p95PaceAssists:    null as number | null,
        p5PaceAssists:     null as number | null,
        p95PacePlusMinus:  null as number | null,
        p5PacePlusMinus:   null as number | null,
      }));
    }

    // Game-driven: one point per game played
    let cumGoals = 0, cumAssists = 0, cumPlusMinus = 0;

    return sorted.map((ev, i) => {
      cumGoals     += ev.goals;
      cumAssists   += ev.assists;
      cumPlusMinus += ev.plusMinus;

      const gameIndex = i + 1;

      // Find heat from snapshot on game date or up to 2 days after
      // (pipeline may run the following day)
      let heat = 0;
      for (let d = 0; d <= 2; d++) {
        const dt = new Date(ev.fullDate + 'T12:00:00Z');
        dt.setDate(dt.getDate() + d);
        const key = dt.toISOString().slice(0, 10);
        const h = heatByDate.get(key);
        if (h !== undefined) { heat = h; break; }
      }

      return {
        label:             `G${gameIndex}`,
        dateLabel:         fmtDate(ev.fullDate),
        snapshotDate:      ev.fullDate,
        heat,
        cumGoals,
        cumAssists,
        cumPlusMinus,
        leaguePaceGoals:    leagueGoalsPerGame    ? leagueGoalsPerGame    * gameIndex : null,
        leaguePaceAssists:  leagueAssistsPerGame  ? leagueAssistsPerGame  * gameIndex : null,
        p95PaceGoals:       p95GoalsPerGame       ? p95GoalsPerGame       * gameIndex : null,
        p5PaceGoals:        p5GoalsPerGame        ? p5GoalsPerGame        * gameIndex : null,
        p95PaceAssists:     p95AssistsPerGame     ? p95AssistsPerGame     * gameIndex : null,
        p5PaceAssists:      p5AssistsPerGame      ? p5AssistsPerGame      * gameIndex : null,
        p95PacePlusMinus:   p95PlusMinusPerGame   ? p95PlusMinusPerGame   * gameIndex : null,
        p5PacePlusMinus:    p5PlusMinusPerGame    ? p5PlusMinusPerGame    * gameIndex : null,
      };
    });
  }, [deduped, gameEvents, leagueGoalsPerGame, leagueAssistsPerGame,
      p95GoalsPerGame, p5GoalsPerGame, p95AssistsPerGame, p5AssistsPerGame,
      p95PlusMinusPerGame, p5PlusMinusPerGame]);

  const data = useMemo(() => {
    if (tab === '6w') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 42);
      const cutoffStr = cutoff.toISOString().slice(0, 10);
      return allData.filter(d => d.snapshotDate >= cutoffStr);
    }
    return allData;
  }, [allData, tab]);

  const hasGameEvents = (gameEvents?.length ?? 0) > 0;

  // Build a lookup so the custom tick can find the date label by game label
  const dateLabelMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const d of data) m.set(d.label, d.dateLabel);
    return m;
  }, [data]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const GameTick = ({ x, y, payload }: any) => (
    <g transform={`translate(${x},${y})`}>
      <text dy={5} textAnchor="middle" fill="var(--text)" fontSize={9} fontFamily="monospace" opacity={0.65}>
        {dateLabelMap.get(payload.value) ?? ''}
      </text>
    </g>
  );

  // Custom dot that renders only at the last point as an end-of-line label.
  // Using dot (not label) because dot props always include exact cx/cy pixels.
  const endDot = (text: string, color: string) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (props: any) => {
      if (props.index !== data.length - 1) return <g key={props.index} />;
      return (
        <text key={text} x={props.cx + 5} y={props.cy} fill={color}
          fontSize={9} fontFamily="monospace" dominantBaseline="middle">
          {text}
        </text>
      );
    };

  const leagueAvgHeat = leaguePpm ? ppmToHeat(leaguePpm) : null;

  const first = data[0]?.heat ?? 0;
  const last  = data[data.length - 1]?.heat ?? 0;
  const diff  = last - first;
  const narrative = metric === 'heat' && data.length >= 3
    ? diff > 5  ? `+${diff} pts vs window open`
    : diff < -5 ? `${diff} pts vs window open`
    : 'Flat over window'
    : '';

  const activeMeta = METRICS.find(m => m.key === metric)!;

  // For +/- the pace lines can span a wide range — compute clean integer domain
  // so recharts doesn't generate fractional ticks.
  const pmDomain = useMemo((): [number, number] => {
    const vals = data.flatMap(d => [
      d.cumPlusMinus, d.p95PacePlusMinus, d.p5PacePlusMinus,
    ]).filter((v): v is number => v != null);
    if (!vals.length) return [-5, 5];
    const lo = Math.min(...vals, -5);
    const hi = Math.max(...vals,  1);
    const step = hi - lo > 30 ? 10 : hi - lo > 10 ? 5 : 1;
    return [Math.floor(lo / step) * step, Math.ceil(hi / step) * step];
  }, [data]);

  const yDomain =
    metric === 'heat'      ? [0, 100] as [number, number] :
    metric === 'plusMinus' ? pmDomain :
                             [0, 'auto'] as [number, string];

  const yTicks = metric === 'heat' ? [0, 25, 50, 75, 100] : undefined;

  // Thin X-axis ticks for long season view
  const xInterval = data.length > 30 ? Math.floor(data.length / 8) - 1 : 'preserveStartEnd';

  if (!snapshots.length) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm" style={{ color: 'var(--text)' }}>No timeline data yet</p>
      </div>
    );
  }

  return (
    <div>
      {/* Row 1: title + narrative + window toggle */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xs font-semibold uppercase tracking-wider shrink-0" style={{ color: 'var(--text)' }}>
            {metric === 'heat' ? 'Heat · 0–100' : `Cumul. ${activeMeta.label}`}
          </span>
          {narrative && (
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded"
              style={{
                background: diff > 0 ? 'rgba(255,90,36,0.12)' : 'rgba(148,163,184,0.1)',
                color:      diff > 0 ? 'var(--heat)'           : 'var(--silver)',
              }}>
              {narrative}
            </span>
          )}
        </div>
        <div className="flex rounded-lg overflow-hidden border shrink-0" style={{ borderColor: 'var(--border)' }}>
          {(['6w', 'season'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer"
              style={{
                background: tab === t ? 'rgba(255,90,36,0.18)' : 'var(--bg-card)',
                color:      tab === t ? 'var(--heat)'           : 'var(--text)',
              }}>
              {t === '6w' ? '6W' : 'Season'}
            </button>
          ))}
        </div>
      </div>

      {/* Row 2: metric selector (skaters only) */}
      {hasGameEvents && (
        <div className="px-4 pb-2 flex items-center gap-1.5">
          {METRICS.map(m => (
            <button key={m.key} onClick={() => setMetric(m.key)}
              className="px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer"
              style={{
                background: metric === m.key ? `color-mix(in srgb, ${m.color} 15%, transparent)` : 'transparent',
                color:      metric === m.key ? m.color : 'var(--text)',
                border:     `1px solid ${metric === m.key ? m.color : 'var(--border)'}`,
                opacity:    metric === m.key ? 1 : 0.7,
              }}>
              {m.label}
            </button>
          ))}
        </div>
      )}

      {/* Chart */}
      <div className="pr-4 pb-4 pl-1">
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={data} margin={{ top: 8, right: 52, bottom: 4, left: 8 }}>
            <defs>
              <linearGradient id="heatAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="rgba(255,90,36,1)" stopOpacity={0.15} />
                <stop offset="95%" stopColor="rgba(255,90,36,1)" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" vertical={false} />

            <XAxis
              dataKey="label"
              tick={<GameTick />}
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
              interval={xInterval}
              height={36}
            />

            <YAxis
              domain={yDomain}
              ticks={yTicks}
              tickFormatter={metric === 'plusMinus' ? (v: number) => String(Math.round(v)) : undefined}
              tick={{ fill: 'var(--text)', fontSize: 10, fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={false}
              width={26}
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const find = (key: string) => (payload as any[]).find((p: any) => p.dataKey === key)?.value;
                const heat    = find('heat')               as number | undefined;
                const goals   = find('cumGoals')          as number | null | undefined;
                const assists = find('cumAssists')        as number | null | undefined;
                const pm      = find('cumPlusMinus')      as number | null | undefined;
                const lgGoals   = find('leaguePaceGoals')   as number | null | undefined;
                const lgAsst    = find('leaguePaceAssists') as number | null | undefined;
                const p95Goals  = find('p95PaceGoals')      as number | null | undefined;
                const p5Goals   = find('p5PaceGoals')       as number | null | undefined;
                const p95Asst   = find('p95PaceAssists')    as number | null | undefined;
                const p5Asst    = find('p5PaceAssists')     as number | null | undefined;
                const p95PM     = find('p95PacePlusMinus')  as number | null | undefined;
                const p5PM      = find('p5PacePlusMinus')   as number | null | undefined;
                const labelStr = String(label ?? '');
                const dateLabel = dateLabelMap.get(labelStr) ?? labelStr;
                return (
                  <div style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 8, padding: '8px 12px', fontSize: 12, fontFamily: 'monospace',
                  }}>
                    <div style={{ color: 'var(--text-bright)', marginBottom: 6 }}>{dateLabel}</div>
                    {metric === 'heat' && heat != null && (
                      <>
                        <div style={{ color: 'var(--heat)' }}>Heat  {heat}</div>
                        {leagueAvgHeat != null && <div style={{ color: 'rgba(255,90,36,0.5)', marginTop: 2 }}>League avg  {leagueAvgHeat}</div>}
                      </>
                    )}
                    {metric === 'goals' && goals != null && (
                      <>
                        <div style={{ color: '#f59e0b' }}>Goals  {goals}</div>
                        {p95Goals != null && <div style={{ color: 'rgba(245,158,11,0.7)', marginTop: 2 }}>Top 5%  {Math.round(p95Goals)}</div>}
                        {lgGoals  != null && <div style={{ color: 'rgba(245,158,11,0.45)', marginTop: 1 }}>Avg  {Math.round(lgGoals)}</div>}
                        {p5Goals  != null && <div style={{ color: 'rgba(245,158,11,0.3)', marginTop: 1 }}>Bot 5%  {Math.round(p5Goals)}</div>}
                      </>
                    )}
                    {metric === 'assists' && assists != null && (
                      <>
                        <div style={{ color: '#3a88ff' }}>Assists  {assists}</div>
                        {p95Asst != null && <div style={{ color: 'rgba(58,136,255,0.7)', marginTop: 2 }}>Top 5%  {Math.round(p95Asst)}</div>}
                        {lgAsst  != null && <div style={{ color: 'rgba(58,136,255,0.45)', marginTop: 1 }}>Avg  {Math.round(lgAsst)}</div>}
                        {p5Asst  != null && <div style={{ color: 'rgba(58,136,255,0.3)', marginTop: 1 }}>Bot 5%  {Math.round(p5Asst)}</div>}
                      </>
                    )}
                    {metric === 'plusMinus' && pm != null && (
                      <>
                        <div style={{ color: pm >= 0 ? '#00e5a0' : 'var(--red)' }}>+/-  {pm > 0 ? '+' : ''}{pm}</div>
                        {p95PM != null && <div style={{ color: 'rgba(0,229,160,0.7)', marginTop: 2 }}>Top 5%  {p95PM > 0 ? '+' : ''}{Math.round(p95PM)}</div>}
                        {p5PM  != null && <div style={{ color: 'rgba(0,229,160,0.35)', marginTop: 1 }}>Bot 5%  {p5PM > 0 ? '+' : ''}{Math.round(p5PM)}</div>}
                      </>
                    )}
                  </div>
                );
              }}
            />

            {/* ── Heat view ── */}
            {metric === 'heat' && (
              <>
                <Area
                  type="monotone"
                  dataKey="heat"
                  stroke="var(--heat)"
                  strokeWidth={2}
                  fill="url(#heatAreaGrad)"
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  dot={(props: any) => {
                    if (props.index === data.length - 1) {
                      return (
                        <circle key="endpoint" cx={props.cx} cy={props.cy} r={3.5}
                          fill="var(--heat)" stroke="var(--bg-card)" strokeWidth={1.5} />
                      );
                    }
                    return <g key={`d-${props.index}`} />;
                  }}
                  activeDot={{ r: 4, fill: 'var(--heat)', stroke: 'var(--bg-card)', strokeWidth: 1.5 }}
                />
                {leagueAvgHeat != null && (
                  <ReferenceLine
                    y={leagueAvgHeat}
                    stroke="rgba(255,90,36,0.4)"
                    strokeDasharray="4 4"
                    label={{
                      value: `League average  ${leagueAvgHeat}`,
                      position: 'insideTopLeft',
                      fill: 'rgba(255,90,36,0.5)',
                      fontSize: 10,
                      fontFamily: 'monospace',
                      dy: -6,
                    }}
                  />
                )}
              </>
            )}

            {/* ── Goals view ── */}
            {metric === 'goals' && (
              <>
                {p95GoalsPerGame != null && (
                  <Line type="monotone" dataKey="p95PaceGoals"
                    stroke="rgba(245,158,11,0.6)" strokeWidth={1} strokeDasharray="3 4"
                    dot={endDot('Top 5%', 'rgba(245,158,11,0.7)')} activeDot={false} connectNulls />
                )}
                {leagueGoalsPerGame != null && (
                  <Line type="monotone" dataKey="leaguePaceGoals"
                    stroke="rgba(245,158,11,0.35)" strokeWidth={1} strokeDasharray="3 4"
                    dot={endDot('Avg', 'rgba(245,158,11,0.5)')} activeDot={false} connectNulls />
                )}
                {p5GoalsPerGame != null && (
                  <Line type="monotone" dataKey="p5PaceGoals"
                    stroke="rgba(245,158,11,0.2)" strokeWidth={1} strokeDasharray="3 4"
                    dot={endDot('Bot 5%', 'rgba(245,158,11,0.35)')} activeDot={false} connectNulls />
                )}
                <Line type="monotone" dataKey="cumGoals"
                  stroke="#f59e0b" strokeWidth={2} dot={false} connectNulls
                  activeDot={{ r: 4, fill: '#f59e0b', stroke: 'var(--bg-card)', strokeWidth: 1.5 }} />
              </>
            )}

            {/* ── Assists view ── */}
            {metric === 'assists' && (
              <>
                {p95AssistsPerGame != null && (
                  <Line type="monotone" dataKey="p95PaceAssists"
                    stroke="rgba(58,136,255,0.6)" strokeWidth={1} strokeDasharray="3 4"
                    dot={endDot('Top 5%', 'rgba(58,136,255,0.7)')} activeDot={false} connectNulls />
                )}
                {leagueAssistsPerGame != null && (
                  <Line type="monotone" dataKey="leaguePaceAssists"
                    stroke="rgba(58,136,255,0.35)" strokeWidth={1} strokeDasharray="3 4"
                    dot={endDot('Avg', 'rgba(58,136,255,0.5)')} activeDot={false} connectNulls />
                )}
                {p5AssistsPerGame != null && (
                  <Line type="monotone" dataKey="p5PaceAssists"
                    stroke="rgba(58,136,255,0.2)" strokeWidth={1} strokeDasharray="3 4"
                    dot={endDot('Bot 5%', 'rgba(58,136,255,0.35)')} activeDot={false} connectNulls />
                )}
                <Line type="monotone" dataKey="cumAssists"
                  stroke="#3a88ff" strokeWidth={2} dot={false} connectNulls
                  activeDot={{ r: 4, fill: '#3a88ff', stroke: 'var(--bg-card)', strokeWidth: 1.5 }} />
              </>
            )}

            {/* ── +/- view ── */}
            {metric === 'plusMinus' && (
              <>
                {p95PlusMinusPerGame != null && (
                  <Line type="monotone" dataKey="p95PacePlusMinus"
                    stroke="rgba(0,229,160,0.6)" strokeWidth={1} strokeDasharray="3 4"
                    dot={endDot('Top 5%', 'rgba(0,229,160,0.7)')} activeDot={false} connectNulls />
                )}
                {p5PlusMinusPerGame != null && (
                  <Line type="monotone" dataKey="p5PacePlusMinus"
                    stroke="rgba(0,229,160,0.25)" strokeWidth={1} strokeDasharray="3 4"
                    dot={endDot('Bot 5%', 'rgba(0,229,160,0.4)')} activeDot={false} connectNulls />
                )}
                <ReferenceLine y={0}
                  stroke="rgba(0,229,160,0.3)"
                  strokeDasharray="4 4"
                  label={{ value: 'zero', position: 'insideTopLeft',
                    fill: 'rgba(0,229,160,0.4)', fontSize: 10, fontFamily: 'monospace', dy: -6 }} />
                <Line type="monotone" dataKey="cumPlusMinus"
                  stroke="#00e5a0" strokeWidth={2} dot={false} connectNulls
                  activeDot={{ r: 4, fill: '#00e5a0', stroke: 'var(--bg-card)', strokeWidth: 1.5 }} />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
