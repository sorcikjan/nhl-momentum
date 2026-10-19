import Link from 'next/link';
import { formatAccuracy } from '@/lib/home';
import { MONO } from './format';

// "NEW HERE?" hook (design ValuePropStrip). Full-bleed: cancels the layout gutters.
export function ValuePropStrip({ pickAccuracyPct }: { pickAccuracyPct: number | null }) {
  return (
    <div
      data-section="value-prop"
      className="-mx-4 -mt-4 flex flex-col gap-2 border-b px-4 py-2.5 lg:-mx-12 lg:-mt-8 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:px-12 lg:py-3.5"
      style={{ background: 'linear-gradient(90deg, var(--heat-dim) 0%, transparent 70%)', borderColor: 'rgba(255, 90, 36, 0.2)' }}
    >
      <div className="flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-6">
        <span className="whitespace-nowrap text-[9px] font-bold lg:text-[10px]" style={{ ...MONO, color: 'var(--heat)', letterSpacing: 1.4 }}>NEW HERE?</span>
        <span className="text-[11px] leading-snug lg:text-sm lg:font-medium" style={{ color: 'var(--text-bright)' }}>
          Momentum gives every NHL player a <span className="font-bold" style={{ color: 'var(--heat)' }}>Heat score from 0 to 100</span>,
          updated every game. See who&apos;s burning, who&apos;s cooling, and which games tonight are worth watching.
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-3 text-[11px]" style={MONO}>
        <span style={{ color: 'var(--text)' }}>{formatAccuracy(pickAccuracyPct)}</span>
        <Link href="/welcome" className="font-bold" style={{ color: 'var(--heat)' }}>How it works →</Link>
      </div>
    </div>
  );
}
