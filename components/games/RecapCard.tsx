import Link from 'next/link';

export default function RecapCard({
  headline, body, recapHref,
}: {
  headline: string;
  body: string;
  recapHref?: string | null;
}) {
  return (
    <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--heat)' }}>Recap</div>
      <h3 className="text-base font-bold font-editorial leading-snug mb-2" style={{ color: 'var(--text-bright)' }}>{headline}</h3>
      <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text)' }}>{body}</p>
      {recapHref && (
        <Link href={recapHref} className="text-xs font-semibold hover:opacity-80" style={{ color: 'var(--heat)' }}>
          Read full recap →
        </Link>
      )}
    </div>
  );
}
