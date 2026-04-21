// Heat score: momentum_ppm normalized to 0–100.
// The scale is calibrated so elite multi-point-per-game stretches hit ~95–100.
// PPM_MAX = 0.065 means a player scoring 0.065 pts/min in 5 games = 100 Heat.

export const PPM_MAX = 0.065;

export function ppmToHeat(ppm: number | null | undefined): number {
  if (!ppm || ppm <= 0) return 0;
  return Math.min(100, Math.round((ppm / PPM_MAX) * 100));
}

// CSS color for a given Heat value
export function heatColor(heat: number): string {
  if (heat >= 80) return 'var(--heat)';
  if (heat >= 60) return 'var(--amber)';
  if (heat >= 40) return 'var(--text)';
  return 'var(--silver)';
}

// Short label for a player's heat state
export function heatLabel(heat: number): string | null {
  if (heat >= 88) return 'ON FIRE';
  if (heat >= 72) return 'HOT';
  if (heat >= 55) return 'WARM';
  return null;
}
