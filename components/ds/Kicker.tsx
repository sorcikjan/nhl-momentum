// Small uppercase label with a leading bar (design primitives.js Kicker).
export function Kicker({
  children,
  color = 'var(--story)',
  size = 10,
}: {
  children: React.ReactNode;
  color?: string;
  size?: number;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 font-bold uppercase"
      style={{ fontSize: size, letterSpacing: 1.4, color }}
    >
      <span aria-hidden style={{ width: 14, height: 2, background: color, borderRadius: 1 }} />
      {children}
    </span>
  );
}
