import type { Metadata } from 'next';
import { HomeBody } from '@/components/home/HomeBody';
import { fetchHomeData, todayET } from '@/lib/home';
import { assertDatabaseUp } from '@/lib/supabase';

// Free-tier database: each render is several queries; crawlers visit every page.
export const revalidate = 120;

export const metadata: Metadata = {
  title: 'momentum. — Hockey Intelligence, Daily',
  description: 'Hockey intelligence powered by AI. Daily stories, predictions and player rankings for every NHL game — updated live.',
  openGraph: {
    title: 'momentum. — Hockey Intelligence, Daily',
    description: 'Hockey intelligence powered by AI. Stories, predictions and rankings for every NHL game.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'momentum. — Hockey Intelligence, Daily',
    description: 'Hockey intelligence powered by AI. Stories, predictions and rankings — updated live.',
  },
};

// Regular-season homepage per docs/design/redesign-2026/homepage-final.js.
export default async function HomePage() {
  // Throw (→ keep serving the last good cached page) if the database is down.
  await assertDatabaseUp();
  const data = await fetchHomeData(todayET());
  return <HomeBody data={data} heroImageUrl={data.heroImageUrl} />;
}
