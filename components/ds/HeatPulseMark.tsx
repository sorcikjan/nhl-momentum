// The "Heat Pulse" mark — an ECG line climbing into a flame tip
// (docs/design/redesign-2026/brand-foundation.js HeatPulseMark).
export function HeatPulseMark({ size = 28, glow = true }: { size?: number; glow?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden
      style={{ filter: glow ? 'drop-shadow(0 0 8px rgba(255, 90, 36, 0.33))' : undefined }}
    >
      <path
        d="M4 30 L12 30 L15 22 L19 36 L23 14 L27 28 L30 24 C32 22 35 22 36 26 C37 30 35 34 30 36 C28 37 26 37 24 36"
        stroke="var(--heat)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="36" cy="26" r="2.5" fill="var(--heat)" />
    </svg>
  );
}
