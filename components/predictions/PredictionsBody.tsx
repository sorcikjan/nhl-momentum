import Link from 'next/link';
import { SectionHeading } from '@/components/ds';
import { GameCard } from '@/components/game/GameCard';
import { JsonLd } from '@/components/seo/JsonLd';
import type { GameCardData } from '@/lib/game-card';
import { itemListLd, predictionSentence, predictionsTitle } from '@/lib/seo';

const MONO = { fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' } as const;
const addDays = (d: string, n: number) => new Date(Date.parse(`${d}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
const short = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });

// Dated predictions landing page: every game that day as a GameCard plus one
// factual sentence (search engines need text, not just cards).
export function PredictionsBody({ date, today, cards, accuracyPct, siteUrl }: {
  date: string; today: string; cards: GameCardData[]; accuracyPct: number | null; siteUrl: string;
}) {
  const prev = addDays(date, -1), next = addDays(date, 1);
  const n = cards.length;
  return (
    <div className="pb-20 lg:pb-0">
      <JsonLd data={itemListLd(cards.map(c => ({ name: `${c.away.name} at ${c.home.name}`, url: `${siteUrl}${c.href}` })))} />
      <SectionHeading
        as="h1"
        size="page"
        kicker="PREDICTIONS"
        title={predictionsTitle(date, today)}
        sub={n
          ? <>{n} game{n === 1 ? '' : 's'} · our pick for every one, with each team&apos;s three hottest players.{accuracyPct != null && <> Our model is <b style={{ color: 'var(--rise)' }}>{Math.round(accuracyPct)}%</b> on winners this season.</>}</>
          : 'No NHL games on this date.'}
      />
      {n > 0 && (
        <div className="grid grid-cols-1 gap-x-3 gap-y-5 md:grid-cols-2 xl:grid-cols-3">
          {cards.map(c => (
            <div key={c.id}>
              <GameCard g={c} />
              <p className="mt-2 px-1 text-[13px] leading-relaxed" style={{ color: 'var(--text)' }}>{predictionSentence(c)}</p>
            </div>
          ))}
        </div>
      )}
      <nav className="mt-8 flex items-center justify-between text-[11px] font-bold" style={{ ...MONO, letterSpacing: 0.8 }}>
        <Link href={`/predictions/${prev}`} style={{ color: 'var(--text)' }}>← {short(prev).toUpperCase()}</Link>
        <Link href="/games" style={{ color: 'var(--text-muted)' }}>FULL SCHEDULE</Link>
        <Link href={`/predictions/${next}`} style={{ color: 'var(--text)' }}>{short(next).toUpperCase()} →</Link>
      </nav>
    </div>
  );
}
