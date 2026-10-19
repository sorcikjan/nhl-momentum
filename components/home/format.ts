// Shared display formatting for homepage sections. Game times are shown in ET,
// as NHL schedules are, regardless of the server's timezone.
export function timeET(iso: string | null): string {
  if (!iso) return 'TBD';
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }) + ' ET';
}

export function dayLabel(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export const MONO = { fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' } as const;
