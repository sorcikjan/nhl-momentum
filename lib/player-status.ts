// Shared player out-status utilities — usable in both server and client components.

export function daysAgo(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr + 'T12:00:00Z').getTime()) / 86_400_000);
}

/**
 * Derives player out-status from absence data.
 * Returns 'injured' | 'out' | 'scratch' | null.
 *
 * Uses consecutive games missed as the primary signal:
 *   1 game missed     → scratch
 *   2–4 games missed  → out
 *   5+ games missed   → injured
 *
 * Falls back to days when game count is unavailable:
 *   3–6 days   → scratch
 *   7–13 days  → out
 *   14+ days   → injured
 */
export function deriveOutStatus(
  consecutiveGamesMissed: number | null,
  lastPlayedDaysAgo: number | null,
): 'injured' | 'out' | 'scratch' | null {
  if (consecutiveGamesMissed !== null) {
    if (consecutiveGamesMissed === 0) return null;
    if (consecutiveGamesMissed === 1) return 'scratch';
    if (consecutiveGamesMissed <= 4) return 'out';
    return 'injured';
  }
  if (lastPlayedDaysAgo === null || lastPlayedDaysAgo < 3) return null;
  if (lastPlayedDaysAgo <= 6) return 'scratch';
  if (lastPlayedDaysAgo <= 13) return 'out';
  return 'injured';
}
