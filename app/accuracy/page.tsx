import type { Metadata } from 'next';
import ModelStatsCard from '@/components/accuracy/ModelStatsCard';
import MatchComparisonTable from '@/components/accuracy/MatchComparisonTable';
import { fetchAccuracy } from '@/lib/data';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Prediction Accuracy',
  description: 'Track NHL Momentum model performance — winner prediction accuracy, score error by version, and per-game history.',
  openGraph: {
    title: 'Prediction Accuracy — NHL Momentum',
    description: 'Track NHL Momentum model performance — winner prediction accuracy, score error by version, and per-game history.',
  },
};

export default async function AccuracyPage() {
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
    <div className="max-w-5xl mx-auto pb-20 md:pb-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-bright)' }}>Prediction Accuracy</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text)' }}>
          Model performance across all versions — winner accuracy, score error, and per-game comparison.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Predictions', value: String(totalPredictions) },
          { label: 'Resolved', value: String(totalResolved) },
          { label: 'Best Accuracy', value: bestStat ? `${bestStat.winnerAccuracyPct}%` : 'N/A',
            sub: bestStat ? bestStat.version : undefined },
          { label: 'Active Model', value: activeModel },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text)' }}>{kpi.label}</p>
            <p className="text-xl font-bold font-mono" style={{ color: 'var(--neon)' }}>{kpi.value}</p>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
