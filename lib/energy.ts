// ─── Energy Bar ───────────────────────────────────────────────────────────────
// Score 0-100 based on cumulative TOI over last 72 hours + opponent difficulty

const MAX_TOI_72H = 75 * 60; // ~75 min TOI in 72h = fully depleted baseline

export function calcEnergyBar(
  toiLast72hSeconds: number,
  opponentDefensiveFilter: number, // higher = tougher opponent
  leagueAvgDefensiveFilter: number,
): number {
  // Base fatigue: linear from 100 (fully rested) to 0 (max TOI)
  const fatigueRaw = Math.max(0, 1 - toiLast72hSeconds / MAX_TOI_72H);

  // Opponent difficulty adjustment: tougher opponent drains more energy
  const difficultyRatio = opponentDefensiveFilter / leagueAvgDefensiveFilter;
  const difficultyPenalty = Math.max(0, (difficultyRatio - 1) * 0.1);

  const energy = Math.round((fatigueRaw - difficultyPenalty) * 100);
  return Math.min(100, Math.max(0, energy));
}

/** Returns a multiplier < 1.0 when energy < 70, else 1.0 */
export function energyMultiplier(energyBar: number): number {
  if (energyBar >= 70) return 1.0;
  // Linear penalty: energy 0 → multiplier 0.7, energy 70 → multiplier 1.0
  return 0.7 + (energyBar / 70) * 0.3;
}
