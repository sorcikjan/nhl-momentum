'use client';
// Storylines grid — 3-column grid of story cards derived from recaps.
// Categories derived deterministically from the recap data + prediction outcomes.

import Link from 'next/link';
import { recapUrl } from '@/lib/urls';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Recap = any;

interface StoryCard {
  recap: Recap;
  category: { label: string; color: string };
  badge: { text: string; color: string } | null;
}

function cleanTitle(title: string): string {
  return title
    .replace(/^NHL Recap[^:]*:\s*/i, '')
    .replace(/^\d{1,2}\/\d{1,2}\/\d{2,4}:\s*/i, '');
}

// Derive a story category from recap title / characteristics
function deriveCategory(recap: Recap): { label: string; color: string } {
  const t = (recap.title ?? '').toLowerCase();
  const summary = (recap.summary ?? '').toLowerCase();
  const text = `${t} ${summary}`;

  if (text.includes('miss') || text.includes('upset') || text.includes('wrong') || text.includes('underdog'))
    return { label: 'THE MISS', color: 'var(--red)' };
  if (text.includes('shutout') || text.includes('goalie') || text.includes('save pct') || text.includes('save%') || text.includes(' sv%'))
    return { label: 'GOALIE WATCH', color: 'var(--neon)' };
  return { label: 'WHAT WE LEARNED', color: 'var(--heat)' };
}

// Build a badge for the top-right of the card
function deriveBadge(recap: Recap, category: { label: string }): { text: string; color: string } | null {
  if (category.label === 'GOALIE WATCH') {
    return { text: 'G · TOP START', color: 'var(--neon)' };
  }
  if (category.label === 'THE MISS') {
    return { text: 'PICK ✗', color: 'var(--red)' };
  }
  // games_count as a stat badge if available
  if (recap.games_count > 1) {
    return { text: `${recap.games_count} GAMES`, color: 'var(--heat)' };
  }
  return null;
}

// Assign distinct categories across the set — ensure all 3 don't have the same label
function assignCategories(recaps: Recap[]): StoryCard[] {
  const cards: StoryCard[] = recaps.map(r => {
    const category = deriveCategory(r);
    const badge = deriveBadge(r, category);
    return { recap: r, category, badge };
  });

  // If all categories are the same, diversify
  const labels = cards.map(c => c.category.label);
  const allSame = labels.every(l => l === labels[0]);
  if (allSame && cards.length >= 2) {
    if (cards[1]) {
      cards[1].category = { label: 'WHAT WE LEARNED', color: 'var(--heat)' };
    }
    if (cards[2]) {
      cards[2].category = { label: 'GOALIE WATCH', color: 'var(--neon)' };
    }
  }

  return cards;
}

function StoryCardItem({ card }: { card: StoryCard }) {
  const { recap, category, badge } = card;
  const title = cleanTitle(recap.title ?? '');
  const href = recapUrl(recap.date, recap.title ?? '');

  return (
    <Link
      href={href}
      className="relative rounded-xl overflow-hidden block hover:opacity-90 transition-opacity flex flex-col"
      style={{ background: '#13151c', minHeight: 200 }}
    >
      {/* Photo area / gradient */}
      {recap.hero_image_url ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={recap.hero_image_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: 0.3, mixBlendMode: 'luminosity' }}
          />
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to top, rgba(8,8,12,0.98) 0%, rgba(8,8,12,0.5) 60%, rgba(8,8,12,0.15) 100%)'
          }} />
        </>
      ) : (
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, rgba(255,90,36,0.08) 0%, rgba(10,11,15,1) 100%)'
        }} />
      )}

      {/* Top-right badge */}
      {badge && (
        <div className="absolute top-3 right-3 z-10">
          <span
            style={{
              fontFamily: 'var(--font-geist-mono), monospace',
              fontSize: '0.5rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: badge.color,
              background: 'rgba(10,11,15,0.7)',
              border: `1px solid ${badge.color}44`,
              borderRadius: 4,
              padding: '2px 6px',
            }}
          >
            {badge.text}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-end flex-1 p-4 gap-2" style={{ minHeight: 200 }}>
        {/* Category */}
        <div className="flex items-center gap-1">
          <span style={{ color: category.color, fontSize: '0.6rem', fontWeight: 700 }}>—</span>
          <span style={{ color: category.color, fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em' }}>{category.label}</span>
        </div>

        {/* Headline */}
        <h3
          className="line-clamp-2"
          style={{
            fontWeight: 800,
            fontSize: '0.9375rem',
            color: 'var(--text-bright)',
            lineHeight: 1.25,
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </h3>

        {/* Body */}
        {recap.summary && (
          <p
            className="line-clamp-2"
            style={{ fontSize: '0.75rem', color: 'var(--text)', lineHeight: 1.5 }}
          >
            {recap.summary}
          </p>
        )}
      </div>
    </Link>
  );
}

interface Props {
  recaps: Recap[];
}

function hasRealWords(title: string | null | undefined): boolean {
  return (title ?? '').replace(/[^a-zA-Z]/g, '').length >= 8;
}

export default function StorylinesGrid({ recaps }: Props) {
  const usable = recaps.filter(r => hasRealWords(r.title)).slice(0, 3);
  if (!usable.length) return null;

  const cards = assignCategories(usable);

  return (
    <section className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: '0.6875rem', color: 'var(--heat)', fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase', marginBottom: '6px' }}>
            STORYLINES · WRITTEN OVERNIGHT
          </p>
          <h2 style={{ fontFamily: 'var(--font-geist-sans), system-ui, sans-serif', fontWeight: 800, fontSize: '2rem', letterSpacing: '-0.03125rem', lineHeight: 1.05, color: 'var(--text-bright)' }}>
            What the data found while you slept.
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text)', marginTop: 6, maxWidth: '480px' }}>
            Every morning we read the box scores so you don&apos;t have to — including the games where our own pick was wrong.
          </p>
        </div>
        <Link href="/recaps" style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: '0.6875rem', color: 'var(--heat)', fontWeight: 600, flexShrink: 0 }}>
          ALL STORIES →
        </Link>
      </div>

      {/* Grid */}
      <div className={`grid gap-3 ${cards.length >= 3 ? 'md:grid-cols-3' : cards.length === 2 ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
        {cards.map((card, i) => (
          <StoryCardItem key={card.recap.date + i} card={card} />
        ))}
      </div>
    </section>
  );
}
