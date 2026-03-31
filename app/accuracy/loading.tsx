export default function AccuracyLoading() {
  return (
    <div className="max-w-5xl mx-auto pb-20 md:pb-0 animate-pulse">
      <div className="mb-6">
        <div className="h-7 w-40 rounded" style={{ background: 'var(--border)' }} />
        <div className="h-3 w-72 rounded mt-2" style={{ background: 'var(--border)' }} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className="h-3 w-20 rounded mb-2" style={{ background: 'var(--border)' }} />
            <div className="h-7 w-16 rounded" style={{ background: 'var(--border)' }} />
          </div>
        ))}
      </div>
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <div className="h-10" style={{ background: 'var(--bg-card)' }} />
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="h-11 border-t" style={{ borderColor: 'var(--border)', background: i % 2 === 0 ? 'var(--bg)' : 'var(--bg-card)' }} />
        ))}
      </div>
    </div>
  );
}
