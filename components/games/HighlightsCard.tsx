export default function HighlightsCard({
  youtubeId, nhlUrl, awayAbbrev, homeAbbrev,
}: {
  youtubeId?: string | null;
  nhlUrl?: string | null;
  awayAbbrev: string;
  homeAbbrev: string;
}) {
  if (!youtubeId && !nhlUrl) return null;
  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="px-4 pt-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text)' }}>
        Highlights
      </div>
      {youtubeId ? (
        <div className="mt-3" style={{ aspectRatio: '16/9' }}>
          <iframe
            width="100%" height="100%"
            src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`}
            title={`${awayAbbrev} vs ${homeAbbrev} Highlights`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            style={{ display: 'block' }}
          />
        </div>
      ) : nhlUrl ? (
        <a
          href={nhlUrl} target="_blank" rel="noopener noreferrer"
          className="m-4 flex items-center justify-center gap-2 text-sm px-4 py-3 rounded-lg font-medium hover:opacity-80 transition-opacity"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-bright)' }}
        >
          ▶ Watch highlights on NHL.com ↗
        </a>
      ) : null}
    </div>
  );
}
