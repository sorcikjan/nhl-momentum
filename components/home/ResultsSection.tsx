import { SectionHeading, SectionLink } from '@/components/ds';
import { GameGrid, splitResults } from './GameGrid';
import type { GameCardData } from '@/lib/game-card';
import { dayLabel } from './format';

// "Our picks went 1 for 2." — plain, in the heading's sub line.
export function picksLine(results: GameCardData[]): string | null {
  const judged = results.filter(r => r.pickResult);
  if (!judged.length) return null;
  return `Our picks went ${judged.filter(r => r.pickResult === 'hit').length} for ${judged.length}.`;
}

// Last game day: our pick vs the result, as GameCards (same card as tonight's).
export function ResultsSection({ date, results }: { date: string | null; results: GameCardData[] }) {
  if (!date || !results.length) return null;
  return (
    <section data-section="results">
      <SectionHeading
        kicker={`LAST NIGHT · ${dayLabel(date).toUpperCase()} · ${results.length} GAME${results.length === 1 ? '' : 'S'}`}
        title="Last night."
        sub={picksLine(results) ?? undefined}
        size="feature"
        right={<SectionLink href={`/predictions/${date}`}>All results</SectionLink>}
      />
      <GameGrid {...splitResults(results)} />
    </section>
  );
}
