export default function PlayerLoading() {
  return (
    <div className="max-w-4xl mx-auto pb-20 md:pb-0 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-20 h-20 rounded-full" style={{ background: 'var(--border)' }} />
        <div>
          <div className="h-7 w-48 rounded mb-2" style={{ background: 'var(--border)' }} />
          <div className="h-4 w-32 rounded" style={{ background: 'var(--border)' }} />
        </div>
      </div>
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className="h-3 w-20 rounded mb-2" style={{ background: 'var(--border)' }} />
            <div className="h-7 w-16 rounded" style={{ background: 'var(--border)' }} />
          </div>
        ))}
      </div>
      {/* Chart placeholder */}
      <div className="rounded-xl border p-4 mb-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', height: 220 }} />
      {/* Recent games */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <div className="h-10" style={{ background: 'var(--bg-card)' }} />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 border-t" style={{ borderColor: 'var(--border)', background: i % 2 === 0 ? 'var(--bg)' : 'var(--bg-card)' }} />
        ))}
      </div>
    </div>
  );
}
