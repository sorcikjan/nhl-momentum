import Link from 'next/link';

// The game's own story (headline is the section title above it): dek, body,
// and a way into the night it belongs to.
export function GameStory({ dek, body, nightHref, nightTitle }: { dek: string; body: string; nightHref: string | null; nightTitle: string | null }) {
  return (
    <article className="flex flex-col gap-4">
      {dek && <p className="text-base font-semibold leading-relaxed lg:text-lg" style={{ color: 'var(--text-bright)' }}>{dek}</p>}
      {body.split(/\n\s*\n/).map((para, i) => (
        <p key={i} className="text-[15px] leading-[1.7]" style={{ color: 'var(--text)' }}>{para.trim()}</p>
      ))}
      {nightHref && (
        <Link href={nightHref} className="self-start text-xs font-bold uppercase hover:opacity-80" style={{ color: 'var(--heat)', fontFamily: 'var(--font-geist-mono), ui-monospace, monospace', letterSpacing: '0.04em' }}>
          The whole night{nightTitle ? `: ${nightTitle}` : ''} →
        </Link>
      )}
    </article>
  );
}
