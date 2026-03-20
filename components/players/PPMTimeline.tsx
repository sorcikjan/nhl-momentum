'use client';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';

interface Snapshot {
  momentum_ppm: number;
  season_ppm: number;
  calculated_at: string;
}

export default function PPMTimeline({ snapshots }: { snapshots: Snapshot[] }) {
  if (!snapshots.length) {
    return (
      <div className="rounded-xl border p-6 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <p className="text-sm" style={{ color: 'var(--text)' }}>No timeline data yet</p>
      </div>
    );
  }

  // One snapshot per calendar day (latest wins) — avoids same-date duplicates from multiple ingests
  const byDate = new Map<string, Snapshot>();
  for (const s of snapshots) {
    const day = s.calculated_at.slice(0, 10);
    byDate.set(day, s);
  }
  const deduped = Array.from(byDate.values());

  const data = deduped.map(s => ({
    label: new Date(s.calculated_at).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
    momentum: Math.round((s.momentum_ppm ?? 0) * 10000) / 10000,
    season:   Math.round((s.season_ppm   ?? 0) * 10000) / 10000,
  }));

  const latestSeason = data[data.length - 1]?.season ?? 0;

  return (
    <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text)' }}>
        PPM Timeline
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="label" tick={{ fill: 'var(--text)', fontSize: 10 }} interval="preserveStartEnd" />
          <YAxis tick={{ fill: 'var(--text)', fontSize: 10 }} width={50} />
          <Tooltip
            contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}
            labelStyle={{ color: 'var(--text-bright)' }}
            itemStyle={{ color: 'var(--text)' }}
          />
          <ReferenceLine y={latestSeason} stroke="var(--silver)" strokeDasharray="4 4" />
          <Line
            type="monotone" dataKey="momentum" name="Momentum PPM"
            stroke="var(--neon)" strokeWidth={2} dot={false} activeDot={{ r: 4 }}
          />
          <Line
            type="monotone" dataKey="season" name="Season PPM"
            stroke="var(--silver)" strokeWidth={1.5} dot={false} strokeDasharray="4 4"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
