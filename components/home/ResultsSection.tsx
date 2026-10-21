import { SectionHeading } from '@/components/ds';
import { GameCard } from '@/components/game/GameCard';
import type { GameCardData } from '@/lib/game-card';
import { dayLabel, MONO } from './format';

function Tally({ results }: { results: GameCardData[] }) {
  const judged = results.filter(r => r.pickResult);
  if (!judged.length) return null;
  const hits = judged.filter(r => r.pickResult === 'hit').length;
  return (
    <div className="flex items-center gap-3 rounded-[10px] border px-3 py-1.5 lg:px-4 lg:py-2.5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-soft)' }}>
      <span className="hidden text-[10px] font-bold lg:inline" style={{ ...MONO, color: 'var(--text-muted)', letterSpacing: 1 }}>WE GOT</span>
      <span className="text-sm font-extrabold lg:text-[22px]" style={{ ...MONO, color: 'var(--rise)' }}>{hits}/{judged.length}</span>
      <span className="text-[9px] font-semibold lg:text-[10px]" style={{ ...MONO, color: 'var(--text)' }}>right · {Math.round((hits / judged.length) * 100)}%</span>
    </div>
  );
}

// Last game day: our pick vs the result, as GameCards (same card as tonight's).
export function ResultsSection({ date, results }: { date: string | null; results: GameCardData[] }) {
  if (!date || !results.length) return null;
  return (
    <section data-section="results">
      <SectionHeading
        kicker={`${dayLabel(date).toUpperCase()} · ${results.length} GAME${results.length === 1 ? '' : 'S'}`}
        title="Results & predictions."
        size="feature"
        right={<Tally results={results} />}
      />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {results.map(r => <GameCard key={r.id} g={r} />)}
      </div>
    </section>
  );
}
