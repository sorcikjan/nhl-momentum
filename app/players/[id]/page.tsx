import { notFound, permanentRedirect } from 'next/navigation';
import { getPlayerLanding } from '@/lib/nhl-api';
import { playerUrl } from '@/lib/urls';

// /players/{id} without the name: three-stars links (the NHL gives only "D. Pastrnak")
// and old links. Google found three of these as 404s; send them to the profile.
// The name comes from NHL.com, cached a day, so this costs the database nothing.
export default async function PlayerById({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d{7}$/.test(id)) notFound();
  const p = await getPlayerLanding(Number(id), 86400).catch(() => null) as { firstName?: { default?: string }; lastName?: { default?: string } } | null;
  const first = p?.firstName?.default, last = p?.lastName?.default;
  if (!first || !last) notFound();
  permanentRedirect(playerUrl(id, first, last));
}
