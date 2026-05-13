// Heat score: momentum_ppm normalized to 0–100.
// The scale is calibrated so elite multi-point-per-game stretches hit ~95–100.
// PPM_MAX = 0.12 means a player scoring 0.12 pts/min in 5 games = 100 Heat.

export const PPM_MAX = 0.12;

export function ppmToHeat(ppm: number | null | undefined): number {
  if (!ppm || ppm <= 0) return 0;
  return Math.min(100, Math.round((ppm / PPM_MAX) * 100));
}

// The Heat number is always orange — never amber, gray, or silver.
export function heatColor(_heat: number): string {
  return 'var(--heat)';
}

// Background color — continuous gradient from Ink (#0a0b0f) to Heat (#ff5a24).
export function heatBg(heat: number): string {
  const stops = [
    { h: 0,   r: 10,  g: 11,  b: 15 },  // Ink #0a0b0f
    { h: 20,  r: 28,  g: 14,  b: 6  },
    { h: 40,  r: 52,  g: 22,  b: 10 },
    { h: 60,  r: 100, g: 36,  b: 14 },
    { h: 80,  r: 170, g: 62,  b: 20 },
    { h: 100, r: 255, g: 90,  b: 36 },  // Heat #ff5a24
  ];
  const clamped = Math.max(0, Math.min(100, heat));
  let lo = stops[0], hi = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (clamped >= stops[i].h && clamped <= stops[i + 1].h) {
      lo = stops[i]; hi = stops[i + 1]; break;
    }
  }
  const t = lo.h === hi.h ? 0 : (clamped - lo.h) / (hi.h - lo.h);
  const r = Math.round(lo.r + (hi.r - lo.r) * t);
  const g = Math.round(lo.g + (hi.g - lo.g) * t);
  const b = Math.round(lo.b + (hi.b - lo.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

// Border color: Heat orange, opacity scaled by heat level
export function heatBorderColor(heat: number): string {
  const opacity = Math.max(0.15, Math.min(0.9, heat / 100));
  return `rgba(255, 90, 36, ${opacity.toFixed(2)})`;
}

// Short label for a player's heat state
export function heatLabel(heat: number): string | null {
  if (heat >= 88) return 'ON FIRE';
  if (heat >= 72) return 'HOT';
  if (heat >= 55) return 'WARM';
  return null;
}
