import { fetchGameShareCard } from '@/lib/data';
import { fallbackImage, gameImage, OG_SIZE } from '@/lib/og';

export const size = OG_SIZE;
export const contentType = 'image/png';
export const alt = 'Game card: teams, our pick and each team’s three hottest players';

// Same layout as the game cards, from a few small queries (not fetchMatch).
export default async function Image({ params }: { params: Promise<{ id: string; slug: string }> }) {
  const { id } = await params;
  const card = await fetchGameShareCard(Number(id)).catch(() => null);
  if (!card) return fallbackImage('NHL GAME', 'Hockey Intelligence, Daily.');
  const day = card.startTimeUTC
    ? new Date(card.startTimeUTC).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' })
    : '';
  return gameImage(card, day);
}
