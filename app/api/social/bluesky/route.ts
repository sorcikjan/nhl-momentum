import { NextRequest, NextResponse } from 'next/server';
import { requireIngestAuth } from '@/lib/ingest-auth';
import { kindsFor, lastPostAt, postWithImage } from '@/lib/bluesky';
import { todayET } from '@/lib/home';
import { blueskyPost, SHARE_KINDS, type ShareKind } from '@/lib/share-cards';
import { fetchShareData } from '@/lib/share-data';
import { CARD_SIZE, shareCardImage } from '@/lib/share-image';

export const dynamic = 'force-dynamic';

// POST /api/social/bluesky — the morning card on Bluesky (called by bluesky-morning cron).
//   ?dry=1           build the post and report it, don't post
//   ?kind=heat       post this card instead of today's rotation
//   ?force=1         post even if the account already posted in the last 12 h
export async function POST(req: NextRequest) {
  const authError = requireIngestAuth(req);
  if (authError) return authError;

  const q = req.nextUrl.searchParams;
  const dry = q.get('dry') === '1';
  const handle = process.env.BLUESKY_HANDLE, appPassword = process.env.BLUESKY_APP_PASSWORD;
  if (!dry && (!handle || !appPassword)) {
    return NextResponse.json({ error: 'BLUESKY_HANDLE / BLUESKY_APP_PASSWORD not set' }, { status: 503 });
  }

  // A retried cron must not post twice.
  if (!dry && q.get('force') !== '1' && handle) {
    const last = await lastPostAt(handle).catch(() => null);
    if (last && Date.now() - last.getTime() < 12 * 3_600_000) {
      return NextResponse.json({ skipped: `already posted at ${last.toISOString()}` });
    }
  }

  const d = await fetchShareData();
  const asked = q.get('kind') as ShareKind | null;
  const kinds = asked && SHARE_KINDS.includes(asked) ? [asked] : kindsFor(new Date());
  // "Last night" only when the games really were last night (not after an off-day).
  const yesterday = new Date(Date.parse(`${todayET()}T12:00:00Z`) - 86_400_000).toISOString().slice(0, 10);

  for (const kind of kinds) {
    if (kind === 'night' && d.night?.date !== yesterday) continue;
    const post = blueskyPost(kind, d);
    if (!post) continue;
    const image = new Uint8Array(await (await shareCardImage(kind, d)).arrayBuffer());
    if (image.length > 950_000) {
      console.error(`[bluesky] ${kind} card is ${image.length} bytes, over the upload limit`);
      continue;
    }
    if (dry) return NextResponse.json({ dry: true, kind, text: post.text, alt: post.alt, bytes: image.length });
    try {
      const uri = await postWithImage({ handle: handle!, appPassword: appPassword!, ...post, image, ...CARD_SIZE });
      console.log(`[bluesky] posted ${kind}: ${uri}`);
      return NextResponse.json({ posted: kind, uri });
    } catch (err) {
      console.error('[bluesky] post failed:', err);
      return NextResponse.json({ error: String(err) }, { status: 502 });
    }
  }
  return NextResponse.json({ skipped: 'no card has data today', tried: kinds });
}
