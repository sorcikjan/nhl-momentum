export default function RankingsLoading() {
  return (
    <div className="max-w-6xl mx-auto pb-20 md:pb-0 animate-pulse">
      <div className="mb-6">
        <div className="h-7 w-32 rounded" style={{ background: 'var(--border)' }} />
        <div className="h-3 w-64 rounded mt-2" style={{ background: 'var(--border)' }} />
      </div>
      <div className="flex gap-4 mb-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-3 w-28 rounded" style={{ background: 'var(--border)' }} />
        ))}
      </div>
      <div className="flex gap-2 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-7 w-12 rounded-lg" style={{ background: 'var(--bg-card)' }} />
        ))}
      </div>
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <div className="h-10" style={{ background: 'var(--bg-card)' }} />
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="h-11 border-t flex items-center px-3 gap-3"
            style={{ borderColor: 'var(--border)', background: i % 2 === 0 ? 'var(--bg)' : 'var(--bg-card)' }}>
            <div className="h-3 w-6 rounded" style={{ background: 'var(--border)' }} />
            <div className="w-7 h-7 rounded-full" style={{ background: 'var(--border)' }} />
            <div className="h-3 w-32 rounded" style={{ background: 'var(--border)' }} />
            <div className="ml-auto h-3 w-16 rounded" style={{ background: 'var(--border)' }} />
          </div>
        ))}
      </div>
    </div>
  );
}
