import { gameCover } from '@/lib/cover';
import { fallbackImage } from '@/lib/og';

// GET /games/{id}/cover — a finished game's cover image (1200×675). Final
// scores don't change, so the CDN keeps it for a day (see coverImage).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (await gameCover(Number(id))) ?? fallbackImage('NHL GAME', 'Hockey Intelligence, Daily.');
}
