import ModelStatsCard from '@/components/accuracy/ModelStatsCard';
import PredictionHistory from '@/components/accuracy/PredictionHistory';
import { ComparisonExample } from '@/components/accuracy/ModelComparison';
import { fetchAccuracy } from '@/lib/data';

export default async function AccuracyPage() {
  const data = await fetchAccuracy().catch(() => null);
  const { modelVersions, predictions, modelStats } = data ?? {};

  const totalPredictions = modelStats?.reduce((sum: number, s: { totalPredictions: number }) => sum + s.totalPredictions, 0) ?? 0;
  const totalResolved = modelStats?.reduce((sum: number, s: { withOutcome: number }) => sum + s.withOutcome, 0) ?? 0;
  const overallAccuracy = modelStats?.find((s: { winnerAccuracyPct: number | null }) => s.winnerAccuracyPct !== null)?.winnerAccuracyPct ?? null;

  return (
    <div className="max-w-5xl mx-auto pb-20 md:pb-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-bright)' }}>Prediction Accuracy</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text)' }}>
          Track model performance over time — winner prediction accuracy, score error, and model versioning.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Predictions', value: String(totalPredictions) },
          { label: 'Resolved', value: String(totalResolved) },
          { label: 'Winner Accuracy', value: overallAccuracy !== null ? `${overallAccuracy}%` : 'N/A' },
          { label: 'Active Model', value: modelVersions?.find((v: { is_active: boolean; version: string }) => v.is_active)?.version ?? 'N/A' },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text)' }}>{kpi.label}</p>
            <p className="text-xl font-bold font-mono" style={{ color: 'var(--neon)' }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {(modelStats?.length ?? 0) > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text)' }}>
            Model Performance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(modelStats ?? []).map((stat: {
              version: string; totalPredictions: number; withOutcome: number;
              winnerAccuracyPct: number | null; avgHomeError: number | null; avgAwayError: number | null;
            }) => (
              <ModelStatsCard key={stat.version} stat={stat} />
            ))}
          </div>
        </div>
      )}

      {(modelVersions?.length ?? 0) > 0 && (
        <div className="mb-6 rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <div className="px-4 py-3 border-b" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text)' }}>
              Model Versions
            </h2>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {(modelVersions ?? []).map((v: { version: string; description: string; is_active: boolean; created_at: string }) => (
              <div key={v.version} className="px-4 py-3 flex items-center justify-between"
                style={{ background: 'var(--bg)' }}>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-semibold" style={{ color: 'var(--neon)' }}>{v.version}</span>
                  {v.is_active && (
                    <span className="text-xs px-2 py-0.5 rounded font-semibold"
                      style={{ background: 'rgba(0,255,136,0.15)', color: 'var(--neon)' }}>
                      ACTIVE
                    </span>
                  )}
                  <span className="text-sm" style={{ color: 'var(--text)' }}>{v.description}</span>
                </div>
                <span className="text-xs font-mono" style={{ color: 'var(--text)' }}>
                  {new Date(v.created_at).toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text)' }}>
          Per-Game Model Comparison
        </h2>
        <ComparisonExample />
      </div>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text)' }}>
          Prediction History
        </h2>
        <PredictionHistory predictions={predictions ?? []} />
      </div>
    </div>
  );
}
