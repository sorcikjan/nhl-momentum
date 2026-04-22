import Link from 'next/link';
import { recapUrl } from '@/lib/urls';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Recap = any;

function cleanTitle(title: string): string {
  return title
    .replace(/^NHL Recap[^:]*:\s*/i, '')
    .replace(/^\d{1,2}\/\d{1,2}\/\d{2,4}:\s*/i, '');
}

// Derive a story-type label from the recap title
function storyLabel(title: string): { text: string; color: string } {
  const t = title.toLowerCase();
  if (t.includes('return') || t.includes('comeback') || t.includes('injury'))
    return { text: 'COMEBACK', color: 'var(--amber)' };
  if (t.includes('shutout') || t.includes('goalie') || t.includes('save'))
    return { text: 'SHUTOUT', color: 'var(--neon)' };
  if (t.includes('sweep') || t.includes('streak') || t.includes('dominat'))
    return { text: 'HOT STREAK', color: 'var(--heat)' };
  if (t.includes('upset') || t.includes('stun') || t.includes('shock'))
    return { text: 'UPSET', color: 'var(--red)' };
  if (t.includes('overtime') || t.includes(' ot ') || t.includes('shootout'))
    return { text: 'OVERTIME', color: 'var(--neon)' };
  return { text: 'LAST NIGHT', color: 'var(--heat)' };
}

function formatRecapDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatDayName(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z');
  return d.toLocaleDateString('en-US', { weekday: 'long' });
}

// ── Hero card (most recent recap) ─────────────────────────────────────────────

function RecapHeroCard({ recap }: { recap: Recap }) {
  const title = cleanTitle(recap.title ?? '');
  const href = recapUrl(recap.date, recap.title ?? '');
  const label = storyLabel(title);

  return (
    <Link
      href={href}
      className="block rounded-2xl overflow-hidden relative group"
      style={{ minHeight: '280px' }}
    >
      {/* Base gradient background */}
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, #2a0a00 0%, #1a0f00 40%, #0d0f14 100%)' }} />

      {/* Hero image — higher opacity than before so it reads */}
      {recap.hero_image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={recap.hero_image_url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 0.45, mixBlendMode: 'luminosity' }}
        />
      )}

      {/* Heavy bottom-up gradient so text always readable */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(to top, rgba(8,8,12,0.99) 0%, rgba(8,8,12,0.75) 45%, rgba(8,8,12,0.2) 100%)'
      }} />

      {/* Top-left: story type label */}
      <div className="absolute top-4 left-4 flex items-center gap-1.5">
        <span style={{ color: label.color, fontSize: '0.7rem', fontWeight: 700 }}>—</span>
        <span style={{ color: label.color, fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em' }}>
          {label.text}
        </span>
      </div>

      {/* Games count badge — top right */}
      {recap.games_count > 0 && (
        <div className="absolute top-3 right-4 flex items-center justify-center"
          style={{
            width: '38px', height: '38px', borderRadius: '50%',
            border: `2px solid ${label.color}`,
            background: 'rgba(8,8,12,0.7)',
          }}>
          <span className="font-black font-mono text-sm" style={{ color: label.color, lineHeight: 1 }}>
            {recap.games_count}
          </span>
        </div>
      )}

      {/* Content — bottom */}
      <div className="relative z-10 px-4 pb-4 pt-14 flex flex-col justify-end" style={{ minHeight: '280px' }}>
        <h2 className="font-editorial font-bold leading-tight mb-2"
          style={{ fontSize: 'clamp(1.25rem, 4vw, 1.6rem)', color: '#fff', textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}>
          {title}
        </h2>

        {recap.summary && (
          <p className="text-sm mb-3 line-clamp-2" style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
            {recap.summary}
          </p>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold group-hover:underline" style={{ color: 'var(--heat)' }}>
            Read recap →
          </span>
          <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {formatRecapDate(recap.date)}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── Compact story row (older recaps) ──────────────────────────────────────────

function CompactStoryRow({ recap }: { recap: Recap }) {
  const title = cleanTitle(recap.title ?? '');
  const href = recapUrl(recap.date, recap.title ?? '');
  const label = storyLabel(title);
  const dateLabel = formatRecapDate(recap.date);

  return (
    <Link
      href={href}
      className="flex items-start gap-3 rounded-xl hover:opacity-80 transition-opacity"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '12px' }}
    >
      {/* Thumbnail */}
      <div className="flex-shrink-0 rounded-lg overflow-hidden"
        style={{ width: '64px', height: '64px', position: 'relative', background: '#1a1f2e' }}>
        {recap.hero_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={recap.hero_image_url}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.75 }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #1a0a00, #0d0f14)' }}>
            <span style={{ fontSize: '1.2rem', opacity: 0.4 }}>📰</span>
          </div>
        )}
        {/* Dim overlay */}
        <div className="absolute inset-0" style={{ background: 'rgba(8,8,12,0.3)' }} />
      </div>

      {/* Text content */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        {/* Label */}
        <div className="flex items-center gap-1">
          <span style={{ color: label.color, fontSize: '0.6rem', fontWeight: 700 }}>—</span>
          <span style={{ color: label.color, fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em' }}>
            {label.text}
          </span>
        </div>

        {/* Title */}
        <p className="font-bold leading-snug line-clamp-2"
          style={{ fontSize: '0.8rem', color: 'var(--text-bright)' }}>
          {title}
        </p>

        {/* Subtitle */}
        <p className="text-xs" style={{ color: 'var(--silver)', opacity: 0.5 }}>
          {dateLabel}{recap.games_count ? ` · ${recap.games_count} games` : ''}
        </p>
      </div>
    </Link>
  );
}

// ── Main RecapFeed export ─────────────────────────────────────────────────────

export default function RecapFeed({ recaps }: { recaps: Recap[] }) {
  if (!recaps.length) return null;

  const [hero, ...stories] = recaps;
  const rest = stories.slice(0, 4);

  const dayName = formatDayName(hero.date);
  const dateSubtitle = formatRecapDate(hero.date);

  return (
    <section className="flex flex-col gap-4">

      {/* Section header */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-editorial font-bold" style={{ fontSize: '2rem', color: 'var(--text-bright)', lineHeight: 1.1 }}>
            {dayName}.
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--silver)', opacity: 0.5 }}>
            {dateSubtitle}{hero.games_count ? ` · ${hero.games_count} games` : ''}
          </p>
        </div>
      </div>

      {/* Hero recap card */}
      <RecapHeroCard recap={hero} />

      {/* More stories */}
      {rest.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold" style={{ color: 'var(--text-bright)' }}>
              More stories
            </span>
            <span className="text-xs" style={{ color: 'var(--silver)', opacity: 0.4 }}>
              AI-generated
            </span>
          </div>
          {rest.map((recap: Recap) => (
            <CompactStoryRow key={recap.date} recap={recap} />
          ))}
        </div>
      )}
    </section>
  );
}
