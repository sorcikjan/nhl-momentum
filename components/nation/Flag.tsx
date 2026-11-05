// The nations' flags as SVG — Windows shows emoji flags as two letters.
// Drawn on a 30×20 field; simplified where a coat of arms would be (Slovakia).
const FIELDS: Record<string, React.ReactNode> = {
  CZE: <><rect width="30" height="10" fill="#ffffff" /><rect y="10" width="30" height="10" fill="#d7141a" /><path d="M0 0L15 10L0 20Z" fill="#11457e" /></>,
  SVK: <>
    <rect width="30" height="7" fill="#ffffff" /><rect y="6.67" width="30" height="6.67" fill="#0b4ea2" /><rect y="13.33" width="30" height="6.67" fill="#ee1c25" />
    <path d="M6.5 4.5h7v6.5c0 2.6-1.8 4-3.5 4.8-1.7-.8-3.5-2.2-3.5-4.8z" fill="#ee1c25" stroke="#ffffff" strokeWidth=".6" />
    <path d="M9.5 6.2h1v1.3h1.4v.9h-1.4v.9h1.9v.9h-1.9v2.4h-1v-2.4h-1.9v-.9h1.9v-.9h-1.4v-.9h1.4z" fill="#ffffff" />
    <path d="M6.9 13c.6-1 1.4-1.4 2-1 .4-.6 1.8-.6 2.2 0 .6-.4 1.4 0 2 1-1.1 1.4-2.3 2.1-3.1 2.5-.8-.4-2-1.1-3.1-2.5z" fill="#0b4ea2" />
  </>,
  SWE: <><rect width="30" height="20" fill="#006aa7" /><rect x="9.4" width="3.75" height="20" fill="#fecc00" /><rect y="8" width="30" height="4" fill="#fecc00" /></>,
  FIN: <><rect width="30" height="20" fill="#ffffff" /><rect x="8.3" width="5" height="20" fill="#002f6c" /><rect y="7.3" width="30" height="5.4" fill="#002f6c" /></>,
  DEU: <><rect width="30" height="6.67" fill="#000000" /><rect y="6.67" width="30" height="6.67" fill="#dd0000" /><rect y="13.33" width="30" height="6.67" fill="#ffce00" /></>,
  CHE: <><rect width="30" height="20" fill="#da291c" /><rect x="13.2" y="4" width="3.6" height="12" fill="#ffffff" /><rect x="9" y="8.2" width="12" height="3.6" fill="#ffffff" /></>,
  LVA: <><rect width="30" height="20" fill="#9e3039" /><rect y="8" width="30" height="4" fill="#ffffff" /></>,
  DNK: <><rect width="30" height="20" fill="#c8102e" /><rect x="9.7" width="3.3" height="20" fill="#ffffff" /><rect y="8.6" width="30" height="2.9" fill="#ffffff" /></>,
};

export function Flag({ code, width = 24, className }: { code: string; width?: number; className?: string }) {
  const field = FIELDS[code];
  if (!field) return null;
  return (
    <svg width={width} height={(width * 2) / 3} viewBox="0 0 30 20" aria-hidden="true" className={className}
      style={{ borderRadius: 2, flexShrink: 0, boxShadow: '0 0 0 1px rgba(255,255,255,0.08)' }}>
      {field}
    </svg>
  );
}
