import Link from 'next/link';

const day = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });

// No games in the selected range — point to the next game day instead of a blank box.
export function ScheduleEmpty({ nextGameDate }: { nextGameDate: string | null }) {
  return (
    <div className="rounded-[14px] border px-6 py-10 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <p className="text-sm" style={{ color: 'var(--text)' }}>No games in this range.</p>
      {nextGameDate && (
        <p className="mt-2 text-sm" style={{ color: 'var(--text)' }}>
          Next games:{' '}
          <Link href={`/games?range=custom&date=${nextGameDate}`} className="font-semibold" style={{ color: 'var(--heat)' }}>{day(nextGameDate)}</Link>
        </p>
      )}
    </div>
  );
}
