// Shared player out-status utilities — usable in both server and client components.

export function daysAgo(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr + 'T12:00:00Z').getTime()) / 86_400_000);
}

/**
 * Derives player out-status from absence data.
 * Returns 'injured' | 'out' | 'scratch' | null.
 *
 * When game count is available, cross-checks with days to avoid false positives
 * from pipeline lag, end-of-season schedule gaps, or single-game rest decisions,
 * and season-to-playoffs transitions (where teams go dark for 1–3 days between
 * regular season and round 1, or between series).
 * A badge only fires when BOTH signals agree the player is genuinely absent.
 *
 *   Games missed + days absent:
 *     < 7 days regardless            → null  (covers season transitions & series gaps)
 *     1–2 games + 7–9 days           → scratch
 *     3–4 games + 7–13 days          → out
 *     5+ games  + 7+ days            → injured
 *
 * Falls back to days only when game count is unavailable:
 *   7–9 days   → scratch
 *   10–20 days → out
 *   21+ days   → injured
 */
export function deriveOutStatus(
  consecutiveGamesMissed: number | null,
  lastPlayedDaysAgo: number | null,
): 'injured' | 'out' | 'scratch' | null {
  if (consecutiveGamesMissed !== null) {
    if (consecutiveGamesMissed === 0) return null;
    // 7-day minimum: covers season-to-playoffs transition, between-series gaps,
    // and pipeline lag — avoids false positives from normal schedule breaks.
    if (lastPlayedDaysAgo === null || lastPlayedDaysAgo < 7) return null;
    if (consecutiveGamesMissed >= 5) return 'injured';
    if (consecutiveGamesMissed >= 3) return 'out';
    return 'scratch'; // 1–2 games missed + 7+ days absent
  }
  // Days-only fallback (no game count available)
  if (lastPlayedDaysAgo === null || lastPlayedDaysAgo < 7) return null;
  if (lastPlayedDaysAgo <= 9) return 'scratch';
  if (lastPlayedDaysAgo <= 20) return 'out';
  return 'injured';
}
