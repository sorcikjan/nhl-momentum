'use client';
import { useRouter, useSearchParams } from 'next/navigation';

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function DateNav({ selected }: { selected: string }) {
  const router = useRouter();

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 3 + i);
    return d;
  });

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {days.map(day => {
        const iso = day.toISOString().slice(0, 10);
        const isToday    = iso === today;
        const isSelected = iso === selected;
        return (
          <button key={iso} onClick={() => router.push(`/games?date=${iso}`)}
            className="flex flex-col items-center min-w-[52px] py-2 px-1 rounded-xl transition-all cursor-pointer"
            style={{
              background: isSelected ? 'var(--neon)' : isToday ? 'var(--neon-glow)' : 'var(--bg-card)',
              border: `1px solid ${isSelected ? 'var(--neon)' : isToday ? 'var(--neon)' : 'var(--border)'}`,
              color: isSelected ? '#fff' : isToday ? 'var(--neon)' : 'var(--text)',
            }}>
            <span className="text-xs font-medium">{DAYS[day.getDay()]}</span>
            <span className="text-lg font-bold leading-tight">{day.getDate()}</span>
            <span className="text-xs">{day.toLocaleString('default', { month: 'short' })}</span>
          </button>
        );
      })}
    </div>
  );
}
