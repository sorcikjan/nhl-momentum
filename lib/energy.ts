// ─── Energy Bar ───────────────────────────────────────────────────────────────
// Science-based fatigue model for NHL players.
//
// Physiology basis:
//   - Glycogen depletion: 31–53% per game (maps to 2%/min TOI drain)
//   - Full recovery window: 24–48h (matches 40h from 50% at 1.25%/h)
//   - EPOC afterburn: first 3h post-game block efficient regen
//   - Deep sleep (00–08 UTC): 1.5× regen rate via GH release
//
// Threshold: energy < 70 % activates linear performance penalty.

export const ENERGY_DRAIN_PER_MIN  = 2;     // % per TOI minute — skaters
export const GOALIE_DRAIN_PER_MIN  = 0.5;   // % per TOI minute — goalies (60min full game)
export const EPOC_DELAY_HOURS      = 3;     // hours before regen begins post-game
export const BASE_REGEN_PER_HOUR   = 1.25;  // %/h passive rest  → 50%→100% in 40h
export const SLEEP_REGEN_PER_HOUR  = 1.8;   // %/h sleep window  → 1.5× boost
export const ENERGY_THRESHOLD      = 70;    // below this: performance penalty applies

export interface GameRecord {
  game_end_utc: Date;  // estimated end timestamp of the game
  toi_seconds: number; // player's time on ice for that game
}

/** Regen accumulated between two timestamps, accounting for sleep window (00–08 UTC) */
function regenForPeriod(from: Date, to: Date): number {
  if (from >= to) return 0;
  let regen = 0;
  let cursor = new Date(from);
  while (cursor < to) {
    const nextHour = new Date(cursor.getTime() + 3_600_000);
    const periodEnd = nextHour < to ? nextHour : to;
    const fraction  = (periodEnd.getTime() - cursor.getTime()) / 3_600_000;
    const isSleep   = cursor.getUTCHours() < 8; // 00:00–08:00 UTC
    regen += fraction * (isSleep ? SLEEP_REGEN_PER_HOUR : BASE_REGEN_PER_HOUR);
    cursor = periodEnd;
  }
  return regen;
}

/**
 * Calculates player energy level (0–100) from recent game history.
 *
 * For each game (chronologically):
 *   1. Drain energy by drainPerMin × TOI minutes
 *   2. Block regen for EPOC_DELAY_HOURS post-game
 *   3. Regen at base/sleep rate until next game ends (or now)
 *
 * @param gamesLast72h  Games in the last ~72h with end time and TOI
 * @param now           Target timestamp (default: current time)
 * @param drainPerMin   %/min drained (2 for skaters, 0.5 for goalies)
 */
export function calculatePlayerEnergy(
  gamesLast72h: GameRecord[],
  now: Date = new Date(),
  drainPerMin: number = ENERGY_DRAIN_PER_MIN,
): number {
  if (!gamesLast72h.length) return 100;

  const games = [...gamesLast72h].sort(
    (a, b) => a.game_end_utc.getTime() - b.game_end_utc.getTime(),
  );

  let energy = 100;

  for (let i = 0; i < games.length; i++) {
    const { game_end_utc, toi_seconds } = games[i];

    // 1. Drain
    energy = Math.max(0, energy - (toi_seconds / 60) * drainPerMin);

    // 2. Regen: starts EPOC_DELAY_HOURS after game, until next game ends (or now)
    const regenFrom = new Date(game_end_utc.getTime() + EPOC_DELAY_HOURS * 3_600_000);
    const regenTo   = i + 1 < games.length ? games[i + 1].game_end_utc : now;

    if (regenFrom < regenTo) {
      energy = Math.min(100, energy + regenForPeriod(regenFrom, regenTo));
    }
  }

  return Math.round(Math.min(100, Math.max(0, energy)));
}

/** Skater offensive multiplier — linear penalty below ENERGY_THRESHOLD */
export function energyMultiplier(energyBar: number): number {
  if (energyBar >= ENERGY_THRESHOLD) return 1.0;
  // energy 0 → 0.7, energy 70 → 1.0
  return 0.7 + (energyBar / ENERGY_THRESHOLD) * 0.3;
}

/**
 * Goalie defensive-filter multiplier.
 * Reduces shots-per-goal by 0.5% per point below 70% energy
 * (simulates slower reaction time in back-to-back situations).
 * Floor: 0.65 (max 35% reduction at energy = 0).
 */
export function goalieEnergyPenalty(energyBar: number): number {
  if (energyBar >= ENERGY_THRESHOLD) return 1.0;
  const pointsBelow = ENERGY_THRESHOLD - energyBar;
  return Math.max(0.65, 1 - pointsBelow * 0.005);
}
