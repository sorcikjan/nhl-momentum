// Shared player out-status utilities — usable in both server and client components.

export function daysAgo(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr + 'T12:00:00Z').getTime()) / 86_400_000);
}

/**
 * Derives player out-status from absence data.
 * Returns 'minors' | 'injured' | 'out' | 'scratch' | null.
 *
 * When inMinors is true and the player has missed games, returns 'minors' immediately.
 *
 * When game count is available, cross-checks with days to avoid false positives
 * from pipeline lag, end-of-season schedule gaps, or single-game rest decisions.
 * A badge only fires when BOTH signals agree the player is genuinely absent.
 *
 *   Games missed + days absent:
 *     < 3 days regardless            → null  (too recent to flag)
 *     1–2 games + 3–5 days           → scratch
 *     3–4 games + 3–9 days           → out
 *     5+ games  + 3+ days            → injured
 *
 * Falls back to days only when game count is unavailable:
 *   3–5 days   → scratch
 *   6–13 days  → out
 *   14+ days   → injured
 */
export function deriveOutStatus(
  consecutiveGamesMissed: number | null,
  lastPlayedDaysAgo: number | null,
  inMinors = false,
): 'minors' | 'injured' | 'out' | 'scratch' | null {
  if (consecutiveGamesMissed !== null) {
    if (consecutiveGamesMissed === 0) return null;
    // Require the player to also be absent for 3+ days — prevents false
    // positives from pipeline lag, single-game rest, or schedule gaps.
    if (lastPlayedDaysAgo !== null && lastPlayedDaysAgo < 3) return null;
    if (inMinors) return 'minors';
    if (consecutiveGamesMissed >= 5) return 'injured';
    if (consecutiveGamesMissed >= 3) return 'out';
    return 'scratch'; // 1–2 games missed + 3+ days absent
  }
  // Days-only fallback (no game count available)
  if (lastPlayedDaysAgo === null || lastPlayedDaysAgo < 3) return null;
  if (lastPlayedDaysAgo <= 5) return 'scratch';
  if (lastPlayedDaysAgo <= 13) return 'out';
  return 'injured';
}
