// ─── Strength of Schedule (SOS) Multiplier ────────────────────────────────────
// Adjusts Momentum points by 0.8–1.2 based on opponent defensive strength

/**
 * Calculate SOS coefficient for a player's last N games.
 * opponentFilters: array of defensive filter scores for each opponent faced
 * leagueAvgFilter: league average defensive filter (baseline = 1.0)
 */
export function calcSOSCoefficient(
  opponentFilters: number[],
  leagueAvgFilter: number,
): number {
  if (opponentFilters.length === 0) return 1.0;

  const avgOpponentFilter =
    opponentFilters.reduce((a, b) => a + b, 0) / opponentFilters.length;

  // Ratio > 1 means faced tougher-than-average opponents → reward with higher coefficient
  const ratio = avgOpponentFilter / leagueAvgFilter;

  // Clamp to 0.8 – 1.2
  return Math.min(1.2, Math.max(0.8, ratio));
}
