import Link from 'next/link';
import { recapUrl } from '@/lib/urls';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Recap = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Game = any;

function cleanTitle(title: string): string {
  return title.replace(/^NHL Recap[^:]*:\s*/i, '').replace(/^\d{1,2}\/\d{1,2}\/\d{2,4}:\s*/i, '');
}

export default function RecapHero({
  recap,
  gamesForDate,
}: {
  recap: Recap;
  gamesForDate: Game[];
}) {
  const title = cleanTitle(recap.title ?? '');
  const href = recapUrl(recap.date, recap.title ?? '');

  // Pick the featured game (highest combined score or first)
  const featured = gamesForDate.length > 0
    ? [...gamesForDate].sort((a, b) =>
        ((b.home_score ?? 0) + (b.away_score ?? 0)) - ((a.home_score ?? 0) + (a.away_score ?? 0))
      )[0]
    : null;

  return (
    <Link href={href} className="block rounded-2xl overflow-hidden relative group" style={{ minHeight: '260px' }}>
      {/* Background */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #1a0a00 0%, #0d0f14 60%, #0a0e1a 100%)' }} />

      {recap.hero_image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={recap.hero_image_url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 0.35 }}
        />
      )}

      {/* Gradient overlay — heavy bottom-up */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(to top, rgba(13,15,20,0.98) 0%, rgba(13,15,20,0.6) 50%, rgba(13,15,20,0.25) 100%)'
      }} />

      {/* Score strip — top */}
      {featured && (
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`https://assets.nhle.com/logos/nhl/svg/${featured.away_team?.abbrev}_light.svg`}
              alt={featured.away_team?.abbrev} className="w-6 h-6 drop-shadow" />
            <span className="text-sm font-mono font-bold" style={{ color: 'var(--text-bright)' }}>
              {featured.away_score}
            </span>
            <span className="text-xs" style={{ color: 'var(--silver)', opacity: 0.4 }}>·</span>
            <span className="text-sm font-mono font-bold" style={{ color: 'var(--text-bright)' }}>
              {featured.home_score}
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`https://assets.nhle.com/logos/nhl/svg/${featured.home_team?.abbrev}_light.svg`}
              alt={featured.home_team?.abbrev} className="w-6 h-6 drop-shadow" />
          </div>
          <span className="text-xs font-bold px-2 py-0.5 rounded"
            style={{ background: 'rgba(249,115,22,0.2)', color: 'var(--heat)', border: '1px solid rgba(249,115,22,0.3)' }}>
            RECAP
          </span>
        </div>
      )}

      {/* Content — bottom */}
      <div className="relative z-10 p-5 pt-16 flex flex-col justify-end" style={{ minHeight: '260px' }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--heat)', opacity: 0.8 }}>
          Last Night
        </p>

        <h2 className="font-editorial italic font-bold leading-tight mb-2"
          style={{ fontSize: 'clamp(1.1rem, 3.5vw, 1.5rem)', color: 'var(--text-bright)' }}>
          {title}
        </h2>

        {recap.summary && (
          <p className="text-xs mb-3 line-clamp-2" style={{ color: 'var(--text)', opacity: 0.75 }}>
            {recap.summary}
          </p>
        )}

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold group-hover:underline" style={{ color: 'var(--heat)' }}>
            Read recap →
          </span>
          {gamesForDate.length > 1 && (
            <span className="text-xs" style={{ color: 'var(--silver)', opacity: 0.5 }}>
              {gamesForDate.length} games
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
