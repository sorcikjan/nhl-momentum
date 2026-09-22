// Heat score: momentum_ppm normalized to 0–100.
// The scale is calibrated so elite multi-point-per-game stretches hit ~95–100.
// PPM_MAX = 0.12 means a player scoring 0.12 pts/min in 5 games = 100 Heat.

export const PPM_MAX = 0.12;

export function ppmToHeat(ppm: number | null | undefined): number {
  if (!ppm || ppm <= 0) return 0;
  return Math.min(100, Math.round((ppm / PPM_MAX) * 100));
}

// Canonical Heat color scale — per the design brief, this is not decorative,
// it IS the metric. Every number, bar, tile, and stripe that represents a
// Heat value should be colored by this single function so a user can read
// temperature without reading a number.
export function heatColor(heat: number): string {
  if (heat >= 85) return '#ff3a0f'; // white-hot
  if (heat >= 70) return '#ff5a24'; // on fire
  if (heat >= 55) return '#ff8a47'; // hot
  if (heat >= 40) return '#f7b267'; // warm
  if (heat >= 25) return '#8a94a6'; // neutral
  return '#4a88ff';                 // ice cold
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

// Border/stripe color: scales BOTH hue (via heatColor's temperature bands)
// AND opacity with heat level — per the design brief, a rankings row's left
// border should let a user sense temperature without reading the number.
export function heatBorderColor(heat: number): string {
  const hex = heatColor(heat);
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const opacity = Math.max(0.35, Math.min(0.9, heat / 100));
  return `rgba(${r}, ${g}, ${b}, ${opacity.toFixed(2)})`;
}

// Short label for a player's heat state
export function heatLabel(heat: number): string | null {
  if (heat >= 88) return 'ON FIRE';
  if (heat >= 72) return 'HOT';
  if (heat >= 55) return 'WARM';
  return null;
}
