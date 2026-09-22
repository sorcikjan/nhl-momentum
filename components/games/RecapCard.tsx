import Link from 'next/link';

export default function RecapCard({
  headline, body, recapHref,
}: {
  headline: string;
  body: string;
  recapHref?: string | null;
}) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid rgba(255,90,36,0.35)',
        borderRadius: 14,
        padding: 22,
        boxShadow: '0 0 16px rgba(255,90,36,0.10)',
      }}
    >
      <div className="text-[10px] font-mono font-bold uppercase mb-2.5" style={{ color: 'var(--heat)', letterSpacing: '0.12em' }}>Recap</div>
      <h3
        className="font-sans font-extrabold leading-snug mb-2.5"
        style={{ fontSize: 'clamp(15px, 1.6vw, 22px)', color: 'var(--text-bright)', letterSpacing: '-0.025em', lineHeight: 1.2 }}
      >
        {headline}
      </h3>
      <p className="leading-relaxed mb-3" style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.55 }}>{body}</p>
      {recapHref && (
        <Link href={recapHref} className="text-xs font-mono font-bold hover:opacity-80" style={{ color: 'var(--heat)', letterSpacing: '0.04em' }}>
          READ FULL RECAP →
        </Link>
      )}
    </div>
  );
}
