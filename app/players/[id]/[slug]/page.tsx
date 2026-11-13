import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound, permanentRedirect } from 'next/navigation';
import { ProfileTabs } from '@/components/player/v3/ProfileTabs';
import { Hero } from '@/components/player/v3/Hero';
import { MiniHeader } from '@/components/player/v3/MiniHeader';
import { NowTab } from '@/components/player/v3/NowTab';
import { GamesTab } from '@/components/player/v3/GamesTab';
import { PlayerTab } from '@/components/player/v3/PlayerTab';
import { CareerTab } from '@/components/player/v3/CareerTab';
import { buildPlayerView } from '@/lib/player-view';
import { currentSeason } from '@/lib/nhl-api';
import { assertDatabaseUp, databaseDown } from '@/lib/supabase';
import { JsonLd } from '@/components/seo/JsonLd';
import { personLd, playerTitle } from '@/lib/seo';
import { playerShareText } from '@/lib/share';
import ShareButton from '@/components/ui/ShareButton';
import { SITE_URL } from '@/lib/site';
import { playerUrl } from '@/lib/urls';

// One build per render, shared by generateMetadata and the page.
// A missing player resolves to null; any other failure throws, so ISR keeps the last good page.
const cachedView = cache((id: string) => buildPlayerView(id));

// Player data changes only when the pipeline runs, and every run (nightly and
// after each finished game) calls /api/revalidate. 6 h keeps crawlers — 800+
// player pages in the sitemap — off the database without costing freshness.
export const revalidate = 21600;

// Render on first visit, then serve from the ISR cache for `revalidate` seconds.
// Without this, a dynamic-segment page is rendered on every request.
export function generateStaticParams() {
  return [];
}

// "2026–27" from the current NHL season id.
function seasonLabel() {
  const s = currentSeason();
  return `${s.slice(0, 4)}–${s.slice(6, 8)}`;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string; slug: string }> }): Promise<Metadata> {
  const { id } = await params;
  const data = await cachedView(id);
  if (!data?.player) return { title: 'Player' };
  const { player } = data;
  const canonicalPath = playerUrl(player.id, player.first_name, player.last_name);
  const name = `${player.first_name} ${player.last_name}`;
  const team = player.teams?.abbrev ?? '';
  const teamName = player.teams?.name ?? team;
  const pos  = player.position_code ?? '';
  const season = seasonLabel();
  const title = playerTitle(name, season);
  // The profile's one sentence leads; the rest says what the page holds.
  const desc = `${data.view.verdict} ${name} ${season} NHL stats — form, game log, role and career for the ${teamName} ${pos}.`;
  return {
    title,
    description: desc,
    alternates: { canonical: `${SITE_URL}${canonicalPath}` },
    openGraph: {
      title: `${name} — momentum.`,
      description: desc,
    },
    // The image comes from ./opengraph-image (Heat card).
    twitter: { card: 'summary_large_image', title: `${name} — ${season} NHL Stats`, description: desc },
  };
}

// Player profile v3 (docs/superpowers/specs/2026-11-13-player-profile-v3-design.md):
// four tabs, every panel server-rendered, ProfileTabs switches between them.
export default async function PlayerPage({ params }: { params: Promise<{ id: string; slug: string }> }) {
  // Throws only if the database is down and nothing was saved to render from.
  await assertDatabaseUp();
  const { id, slug } = await params;
  const data = await cachedView(id);
  // A player missing because the database is down is not a 404 (crawlers would drop the page).
  if (!data?.player) { if (databaseDown()) throw new Error('Database unavailable'); notFound(); }
  // Old or mistyped slugs (e.g. pre-accent-folding "tim-st-tzle") → one canonical URL.
  // loading.tsx streams this page, so it goes out as an instant meta refresh
  // (Google treats that as a permanent redirect), backed by the canonical tag.
  const { player, view, heat } = data;
  const canonicalPath = playerUrl(player.id, player.first_name, player.last_name);
  if (slug !== canonicalPath.split('/').pop()) permanentRedirect(canonicalPath);

  return (
    <>
      <JsonLd data={personLd({
        name: `${player.first_name} ${player.last_name}`,
        url: `${SITE_URL}${canonicalPath}`,
        image: player.headshot_url ?? null,
        team: player.teams?.name ?? null,
      })} />
      <div className="mx-auto mb-3 flex max-w-[960px] justify-end">
        <ShareButton text={playerShareText(`${player.first_name} ${player.last_name}`, heat)} />
      </div>
      <ProfileTabs
        initial="now"
        hero={<Hero hero={view.hero} />}
        mini={<MiniHeader {...view.mini} />}
        panels={{ now: <NowTab v={view} />, games: <GamesTab v={view} />, player: <PlayerTab v={view} />, career: <CareerTab v={view} /> }}
      />
    </>
  );
}
