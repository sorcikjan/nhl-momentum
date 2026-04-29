export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto pb-20 md:pb-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <div className="h-3 w-12 rounded animate-pulse" style={{ background: 'var(--border)' }} />
        <div className="h-3 w-2 rounded animate-pulse" style={{ background: 'var(--border)' }} />
        <div className="h-3 w-32 rounded animate-pulse" style={{ background: 'var(--border)' }} />
      </div>

      {/* Article header */}
      <div className="mb-6">
        <div className="h-3 w-36 rounded animate-pulse mb-2" style={{ background: 'var(--border)' }} />
        <div className="h-8 w-4/5 rounded animate-pulse mb-2" style={{ background: 'var(--bg-card)' }} />
        <div className="h-7 w-3/5 rounded animate-pulse mb-3" style={{ background: 'var(--bg-card)' }} />
        <div className="h-3 w-48 rounded animate-pulse" style={{ background: 'var(--border)' }} />
      </div>

      {/* Hero image */}
      <div className="w-full rounded-xl animate-pulse mb-8"
        style={{ aspectRatio: '12/5', background: 'var(--bg-card)' }} />

      {/* Article paragraphs */}
      <div className="flex flex-col gap-3 mb-10">
        {[100, 100, 82, 100, 67].map((w, i) => (
          <div key={i} className="h-4 rounded animate-pulse"
            style={{ background: 'var(--border)', width: `${w}%` }} />
        ))}
      </div>

      {/* Game card */}
      <div className="rounded-2xl animate-pulse mb-6"
        style={{ height: 200, background: 'var(--bg-card)', border: '1px solid var(--border)' }} />

      {/* More paragraphs */}
      <div className="flex flex-col gap-3 mb-10">
        {[100, 100, 75].map((w, i) => (
          <div key={i} className="h-4 rounded animate-pulse"
            style={{ background: 'var(--border)', width: `${w}%` }} />
        ))}
      </div>
    </div>
  );
}
