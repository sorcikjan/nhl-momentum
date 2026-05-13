'use client';
import { useState, useMemo } from 'react';
import {
  ComposedChart, Area, Bar, CartesianGrid, XAxis, YAxis,
  ReferenceLine, ResponsiveContainer, Tooltip,
} from 'recharts';
import { ppmToHeat } from '@/lib/heat';

interface Snapshot {
  momentum_ppm: number;
  season_ppm: number;
  calculated_at: string;
}

interface GameEvent {
  date: string;
  goals: number;
  assists: number;
  plusMinus: number;
}

type Tab = '6w' | 'season';

export default function HeatTimeline({
  snapshots,
  seasonPpm,
  gameEvents,
}: {
  snapshots: Snapshot[];
  seasonPpm?: number;
  gameEvents?: GameEvent[];
}) {
  const [tab, setTab] = useState<Tab>('6w');

  const deduped = useMemo(() => {
    const byDate = new Map<string, Snapshot>();
    for (const s of snapshots) byDate.set(s.calculated_at.slice(0, 10), s);
    return Array.from(byDate.values()).sort((a, b) => a.calculated_at.localeCompare(b.calculated_at));
  }, [snapshots]);

  const eventsByDate = useMemo(() => {
    const m = new Map<string, GameEvent>();
    for (const e of (gameEvents ?? [])) {
      if (e.date) m.set(e.date, e);
    }
    return m;
  }, [gameEvents]);

  const data = useMemo(() => {
    let src = deduped;
    if (tab === '6w') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 42);
      const cutoffStr = cutoff.toISOString().slice(0, 10);
      src = deduped.filter(s => s.calculated_at.slice(0, 10) >= cutoffStr);
    }
    return src.map(s => {
      const dateKey = s.calculated_at.slice(5, 10).replace('-', '/');
      const ev = eventsByDate.get(dateKey);
      return {
        date: dateKey,
        heat: ppmToHeat(s.momentum_ppm),
        goals: ev != null ? ev.goals : null,
        assists: ev != null ? ev.assists : null,
        plusMinus: ev != null ? ev.plusMinus : null,
      };
    });
  }, [deduped, tab, eventsByDate]);

  const seasonAvgHeat = ppmToHeat(seasonPpm ?? 0);
  const hasGameEvents = (gameEvents?.length ?? 0) > 0;

  const first = data[0]?.heat ?? 0;
  const last = data[data.length - 1]?.heat ?? 0;
  const diff = last - first;
  const narrative = data.length >= 3
    ? diff > 5
      ? `+${diff} pts vs window open`
      : diff < -5
      ? `${diff} pts vs window open`
      : 'Flat over window'
    : '';

  if (!snapshots.length) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm" style={{ color: 'var(--text)' }}>No timeline data yet</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text)' }}>
            Heat · 0–100
          </span>
          {hasGameEvents && (
            <div className="flex items-center gap-2 text-xs font-mono" style={{ color: 'var(--text)' }}>
              <span className="flex items-center gap-1">
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: 'rgba(255,90,36,0.8)' }} />
                G
              </span>
              <span className="flex items-center gap-1">
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: 'rgba(58,136,255,0.65)' }} />
                A
              </span>
            </div>
          )}
          {narrative && (
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded"
              style={{
                background: diff > 0 ? 'rgba(255,90,36,0.12)' : 'rgba(148,163,184,0.1)',
                color: diff > 0 ? 'var(--heat)' : 'var(--silver)',
              }}>
              {narrative}
            </span>
          )}
        </div>
        <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
          {(['6w', 'season'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer"
              style={{
                background: tab === t ? 'rgba(255,90,36,0.18)' : 'var(--bg-card)',
                color: tab === t ? 'var(--heat)' : 'var(--text)',
              }}>
              {t === '6w' ? '6W' : 'Season'}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="pr-4 pb-4 pl-1">
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: 8 }}>
            <defs>
              <linearGradient id="heatAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="rgba(255,90,36,1)" stopOpacity={0.15} />
                <stop offset="95%" stopColor="rgba(255,90,36,1)" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="2 4"
              stroke="var(--border)"
              vertical={false}
            />

            <XAxis
              dataKey="date"
              tick={{ fill: 'var(--text)', fontSize: 10, fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
              interval="preserveStartEnd"
              dy={4}
            />

            <YAxis
              yAxisId="heat"
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tick={{ fill: 'var(--text)', fontSize: 10, fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={false}
              width={26}
            />

            {hasGameEvents && (
              <YAxis
                yAxisId="stats"
                orientation="right"
                domain={[0, 8]}
                hide
              />
            )}

            {seasonAvgHeat > 0 && (
              <ReferenceLine
                yAxisId="heat"
                y={seasonAvgHeat}
                stroke="rgba(255,90,36,0.45)"
                strokeDasharray="4 4"
                label={{
                  value: `season avg  ${seasonAvgHeat}`,
                  position: 'insideTopRight',
                  fill: 'rgba(255,90,36,0.65)',
                  fontSize: 10,
                  fontFamily: 'monospace',
                  dy: -6,
                }}
              />
            )}

            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const find = (key: string) => (payload as any[]).find((p: any) => p.dataKey === key)?.value;
                const heat = find('heat') as number | undefined;
                const goals = find('goals') as number | null | undefined;
                const assists = find('assists') as number | null | undefined;
                const plusMinus = find('plusMinus') as number | null | undefined;
                const hasGame = goals != null;
                return (
                  <div style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 8, padding: '8px 12px', fontSize: 12, fontFamily: 'monospace',
                  }}>
                    <div style={{ color: 'var(--text-bright)', marginBottom: 6 }}>{label}</div>
                    {heat != null && (
                      <div style={{ color: 'var(--heat)' }}>Heat  {heat}</div>
                    )}
                    {hasGame && (
                      <>
                        <div style={{ color: 'rgba(255,90,36,0.85)', marginTop: 4 }}>
                          {goals}G · {assists}A · {(goals ?? 0) + (assists ?? 0)} Pts
                        </div>
                        <div style={{
                          color: (plusMinus ?? 0) > 0 ? 'var(--rise)' : (plusMinus ?? 0) < 0 ? 'var(--red)' : 'var(--text)',
                          marginTop: 2,
                        }}>
                          {(plusMinus ?? 0) > 0 ? '+' : ''}{plusMinus} +/-
                        </div>
                      </>
                    )}
                  </div>
                );
              }}
            />

            {/* Game event bars rendered before Area so they appear behind the heat line */}
            {hasGameEvents && (
              <>
                <Bar
                  yAxisId="stats"
                  dataKey="goals"
                  stackId="gp"
                  fill="rgba(255,90,36,0.8)"
                  barSize={5}
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  yAxisId="stats"
                  dataKey="assists"
                  stackId="gp"
                  fill="rgba(58,136,255,0.65)"
                  barSize={5}
                  radius={[2, 2, 0, 0]}
                />
              </>
            )}

            <Area
              yAxisId="heat"
              type="monotone"
              dataKey="heat"
              stroke="var(--heat)"
              strokeWidth={1.5}
              fill="url(#heatAreaGrad)"
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              dot={(props: any) => {
                if (props.index === data.length - 1) {
                  return (
                    <circle
                      key="endpoint"
                      cx={props.cx}
                      cy={props.cy}
                      r={3.5}
                      fill="var(--heat)"
                      stroke="var(--bg-card)"
                      strokeWidth={1.5}
                    />
                  );
                }
                return <g key={`d-${props.index}`} />;
              }}
              activeDot={{ r: 4, fill: 'var(--heat)', stroke: 'var(--bg-card)', strokeWidth: 1.5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
