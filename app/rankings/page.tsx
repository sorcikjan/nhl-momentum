import RankingsTable from '@/components/rankings/RankingsTable';
import { fetchRankings } from '@/lib/data';

export default async function RankingsPage() {
  const data = await fetchRankings().catch(() => null);
  const players = data?.top100 ?? [];

  return (
    <div className="max-w-6xl mx-auto pb-20 md:pb-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-bright)' }}>Rankings</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text)' }}>
          TOP 100 skaters ranked by momentum score · sortable by any metric
        </p>
      </div>

      <div className="flex flex-wrap gap-4 mb-5 text-xs" style={{ color: 'var(--text)' }}>
        <span><span style={{ color: 'var(--neon)' }}>M.PPM</span> — Momentum PPM (last 5 games)</span>
        <span><span style={{ color: 'var(--silver)' }}>S.PPM</span> — Season PPM</span>
        <span><span style={{ color: 'var(--green)' }}>Delta</span> — Surge vs season baseline</span>
        <span>SOS — Strength of schedule (0.8–1.2)</span>
      </div>

      <RankingsTable players={players} />
    </div>
  );
}
