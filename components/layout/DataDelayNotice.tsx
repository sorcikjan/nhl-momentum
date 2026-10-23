import { assertDatabaseUp, databaseDown } from '@/lib/supabase';

// Shown while pages render from saved data because the database isn't answering.
export async function DataDelayNotice() {
  await assertDatabaseUp().catch(() => {});
  if (!databaseDown()) return null;
  return (
    <div role="status" className="mb-4 rounded-xl border px-4 py-2.5 text-[13px]" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-soft)', color: 'var(--text)' }}>
      Live data is delayed. You&apos;re seeing the latest saved numbers; they&apos;ll update on their own.
    </div>
  );
}
