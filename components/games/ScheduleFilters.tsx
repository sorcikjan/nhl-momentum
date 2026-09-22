'use client';
import { useRouter } from 'next/navigation';

export type ScheduleRange = 'all' | 'today' | 'tomorrow' | 'week' | 'custom';

const OPTIONS: { key: ScheduleRange; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: 'week', label: 'This week' },
  { key: 'custom', label: 'Custom' },
];

export default function ScheduleFilters({ active, customDate }: { active: ScheduleRange; customDate?: string }) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {OPTIONS.map(opt => (
        <button
          key={opt.key}
          onClick={() => {
            if (opt.key === 'custom') {
              const today = new Date().toISOString().slice(0, 10);
              router.push(`/games?range=custom&date=${customDate ?? today}`);
              return;
            }
            router.push(`/games?range=${opt.key}`);
          }}
          className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all cursor-pointer"
          style={{
            background: active === opt.key ? 'var(--heat)' : 'var(--bg-card)',
            border: `1px solid ${active === opt.key ? 'var(--heat)' : 'var(--border)'}`,
            color: active === opt.key ? '#fff' : 'var(--text)',
          }}
        >
          {opt.label}
        </button>
      ))}
      {active === 'custom' && (
        <input
          type="date"
          defaultValue={customDate}
          onChange={e => router.push(`/games?range=custom&date=${e.target.value}`)}
          className="px-3 py-1.5 rounded-full text-sm font-mono"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-bright)' }}
        />
      )}
    </div>
  );
}
