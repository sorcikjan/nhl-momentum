'use client';
import { useState, useMemo } from 'react';
import { AreaChart, Area, ReferenceLine, ResponsiveContainer, Tooltip, YAxis } from 'recharts';
import { ppmToHeat } from '@/lib/heat';

interface Snapshot {
  momentum_ppm: number;
  season_ppm: number;
  calculated_at: string;
}

type Tab = '6w' | 'season';

export default function HeatTimeline({ snapshots, seasonPpm }: { snapshots: Snapshot[]; seasonPpm?: number }) {
  const [tab, setTab] = useState<Tab>('6w');

  const deduped = useMemo(() => {
    const byDate = new Map<string, Snapshot>();
    for (const s of snapshots) byDate.set(s.calculated_at.slice(0, 10), s);
    return Array.from(byDate.values()).sort((a, b) => a.calculated_at.localeCompare(b.calculated_at));
  }, [snapshots]);

  const data = useMemo(() => {
    let src = deduped;
    if (tab === '6w') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 42);
      const cutoffStr = cutoff.toISOString().slice(0, 10);
      src = deduped.filter(s => s.calculated_at.slice(0, 10) >= cutoffStr);
    }
    return src.map(s => ({
      date: s.calculated_at.slice(5, 10).replace('-', '/'),
      heat: ppmToHeat(s.momentum_ppm),
    }));
  }, [deduped, tab]);

  const seasonAvgHeat = ppmToHeat(seasonPpm ?? 0);

  const first = data[0]?.heat ?? 0;
  const last = data[data.length - 1]?.heat ?? 0;
  const diff = last - first;
  const narrative = data.length >= 3
    ? diff > 5 ? `Trending up +${diff} pts over this window`
    : diff < -5 ? `Trending down ${diff} pts over this window`
    : 'Holding steady'
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
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text)' }}>Heat Trend</span>
          {narrative && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--heat)' }}>{narrative}</p>
          )}
        </div>
        <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
          {(['6w', 'season'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer"
              style={{
                background: tab === t ? 'rgba(249,115,22,0.18)' : 'var(--bg-card)',
                color: tab === t ? 'var(--heat)' : 'var(--text)',
              }}>
              {t === '6w' ? '6W' : 'Season'}
            </button>
          ))}
        </div>
      </div>

      <div className="px-2 pb-4">
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="heatAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="rgba(249,115,22,1)" stopOpacity={0.28} />
                <stop offset="95%" stopColor="rgba(249,115,22,1)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <YAxis domain={[0, 100]} hide />
            {seasonAvgHeat > 0 && (
              <ReferenceLine y={seasonAvgHeat} stroke="rgba(249,115,22,0.4)" strokeDasharray="4 4" />
            )}
            <Tooltip
              contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: 'var(--text-bright)', marginBottom: 2 }}
              itemStyle={{ color: 'var(--heat)' }}
              formatter={(v) => [`Heat ${v}`, '']}
            />
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
                    <circle
                      key="endpoint"
                      cx={props.cx}
                      cy={props.cy}
                      r={4}
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
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
