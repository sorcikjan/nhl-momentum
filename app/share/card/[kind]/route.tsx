import { fetchShareData } from '@/lib/share-data';
import { SHARE_KINDS, type ShareKind } from '@/lib/share-cards';
import { shareCardImage } from '@/lib/share-image';

// GET /share/card/{heat|trends|night} — this morning's share card, 1080×1350.
export async function GET(_req: Request, { params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  if (!SHARE_KINDS.includes(kind as ShareKind)) return new Response('Not found', { status: 404 });
  return shareCardImage(kind as ShareKind, await fetchShareData());
}
