import MomentumLeaders from '@/components/dashboard/MomentumLeaders';
import BreakoutWatch from '@/components/dashboard/BreakoutWatch';
import TodaysGames from '@/components/dashboard/TodaysGames';

async function getRankings() {
  const res = await fetch('http://localhost:3000/api/rankings', { cache: 'no-store' });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data;
}

async function getTodaysGames() {
  const today = new Date().toISOString().slice(0, 10);
  const res = await fetch(`http://localhost:3000/api/games?date=${today}`, { cache: 'no-store' });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data?.games ?? [];
}

export default async function DashboardPage() {
  const [rankings, games] = await Promise.all([getRankings(), getTodaysGames()]);

  const leaders = rankings?.momentumLeaders?.skaters ?? [];
  const breakout = rankings?.breakoutWatch ?? [];

  return (
    <div className="max-w-6xl mx-auto pb-20 md:pb-0">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-bright)' }}>Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text)' }}>
          Momentum-based NHL analytics · Model v1.0
        </p>
      </div>

      {/* Stat bar */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Players Tracked', value: rankings?.top100?.length ? '733' : '—' },
          { label: 'Momentum Window', value: 'Last 5 G' },
          { label: 'Model Version',   value: 'v1.0' },
        ].map(s => (
          <div key={s.label} className="rounded-lg border p-3 text-center"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className="text-lg font-bold font-mono" style={{ color: 'var(--neon)' }}>{s.value}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Left col: Momentum Leaders */}
        <div className="lg:col-span-1">
          <MomentumLeaders players={leaders} />
        </div>

        {/* Mid col: Breakout Watch */}
        <div className="lg:col-span-1">
          <BreakoutWatch players={breakout} />
        </div>

        {/* Right col: Today's Games */}
        <div className="lg:col-span-1">
          <TodaysGames games={games} />
        </div>

      </div>
    </div>
  );
}
