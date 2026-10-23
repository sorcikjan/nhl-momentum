import type { Metadata } from 'next';
import { HotBody } from '@/components/hot/HotBody';
import { fetchRankings } from '@/lib/data';
import { hotView } from '@/lib/hot-view';
import { assertDatabaseUp } from '@/lib/supabase';

// Free-tier database: data changes only when the pipeline runs, and pipeline
// runs call /api/revalidate — so a longer interval costs no freshness.
export const revalidate = 600;

export const metadata: Metadata = {
  title: 'NHL Heat Leaders — Hottest Players Right Now',
  description: 'The hottest NHL players right now: Heat score from the last five games, who is breaking out above his season pace, and who is cooling off.',
  openGraph: {
    title: 'NHL Heat Leaders — momentum.',
    description: 'Who is burning right now — the NHL players furthest above their season pace.',
  },
};

// Heat page per docs/design/redesign-2026 DesktopHotPlayers / MobileHotPlayers.
export default async function HotPage() {
  // Throws only if the database is down and nothing was saved to render from.
  await assertDatabaseUp();
  const rankings = await fetchRankings().catch(() => null);
  return <HotBody view={hotView(rankings)} />;
}
