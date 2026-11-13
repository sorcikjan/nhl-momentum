// How he got here: clubs and the draft in order, the current one in orange.
import type { Step } from '@/lib/profile-v3';

export function Timeline({ steps }: { steps: Step[] }) {
  if (!steps.length) return <div className="py-4 text-center text-xs" style={{ color: 'var(--text-muted)' }}>No career data</div>;
  return (
    <ol className="ml-1.5 border-l-2" style={{ borderColor: 'var(--border)' }}>
      {steps.map((s, i) => (
        <li key={i} data-now={s.now ? 'true' : undefined} className="relative pb-2 pl-3.5 pt-1 text-xs">
          <span className="absolute -left-[7px] top-[7px] h-2.5 w-2.5 rounded-full" style={{ background: s.now ? 'var(--heat)' : 'var(--border)', boxShadow: '0 0 0 2px var(--bg-card)' }} />
          <b className="font-extrabold" style={{ color: 'var(--text-bright)' }}>{s.title}</b><br />
          <span className="text-[11px]" style={{ color: 'var(--text-dim, #8a94a6)' }}>{s.detail}</span>
        </li>
      ))}
    </ol>
  );
}
