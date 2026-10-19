import type { Metadata } from 'next';
import ModelStatsCard from '@/components/accuracy/ModelStatsCard';
import MatchComparisonTable from '@/components/accuracy/MatchComparisonTable';
import { fetchAccuracy } from '@/lib/data';
import { assertDatabaseUp } from '@/lib/supabase';
import { SectionHeading } from '@/components/ds';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Prediction Accuracy',
  description: 'Track Momentum model performance — winner prediction accuracy, score error by version, and per-game history.',
  openGraph: {
    title: 'Prediction Accuracy — momentum.',
    description: 'Track Momentum model performance — winner prediction accuracy, score error by version, and per-game history.',
  },
};

export default async function AccuracyPage() {
  // Throw (→ keep serving the last good cached page) if the database is down.
  await assertDatabaseUp();
  const data = await fetchAccuracy().catch(() => null);
  const { modelVersions, predictions, modelStats } = data ?? {};

  const totalPredictions = modelStats?.reduce((sum: number, s: { totalPredictions: number }) => sum + s.totalPredictions, 0) ?? 0;
  const totalResolved = modelStats?.reduce((sum: number, s: { withOutcome: number }) => sum + s.withOutcome, 0) ?? 0;

  // Latest active model, fallback to highest version number
  const activeModel = modelVersions?.find((v: { is_active: boolean }) => v.is_active)?.version
    ?? modelStats?.sort((a: { version: string }, b: { version: string }) => b.version.localeCompare(a.version))[0]?.version
    ?? 'N/A';

  // Best accuracy across models with at least 10 scored games
  const bestStat = [...(modelStats ?? [])]
    .filter((s: { withOutcome: number }) => s.withOutcome >= 10)
    .sort((a: { winnerAccuracyPct: number | null }, b: { winnerAccuracyPct: number | null }) =>
      (b.winnerAccuracyPct ?? 0) - (a.winnerAccuracyPct ?? 0)
    )[0];

  return (
    <div className="pb-20 lg:pb-0">
      <SectionHeading as="h1" size="page" kicker="METHODOLOGY · TRACK RECORD" title="How we're doing." sub="Model performance across all versions — winner accuracy, score error, and per-game comparison." />

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Predictions', value: String(totalPredictions) },
          { label: 'Resolved', value: String(totalResolved) },
          { label: 'Best Accuracy', value: bestStat ? `${bestStat.winnerAccuracyPct}%` : 'N/A',
            sub: bestStat ? bestStat.version : undefined },
          { label: 'Active Model', value: activeModel },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-xl border p-3 md:p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <p className="text-xs leading-tight mb-1" style={{ color: 'var(--text)' }}>{kpi.label}</p>
            <p className="text-xl font-bold font-mono" style={{ color: 'var(--heat)' }}>{kpi.value}</p>
            {kpi.sub && <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--text)' }}>{kpi.sub}</p>}
          </div>
        ))}
      </div>

      {/* Model performance cards */}
      {(modelStats?.length ?? 0) > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text)' }}>
            Model Performance
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {([...(modelStats ?? [])] as {
              version: string; totalPredictions: number; withOutcome: number;
              winnerAccuracyPct: number | null; avgHomeError: number | null; avgAwayError: number | null;
            }[])
              .sort((a, b) => b.version.localeCompare(a.version))
              .map(stat => (
                <ModelStatsCard key={stat.version} stat={stat} />
              ))}
          </div>
        </div>
      )}

      {/* Per-game model comparison table */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text)' }}>
          Per-Game Model Comparison
        </h2>
        <MatchComparisonTable predictions={predictions ?? []} />
      </div>
    </div>
  );
}
