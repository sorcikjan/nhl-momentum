// Minimal Bluesky (AT Protocol) client for the morning card: log in with an app
// password, upload the card, post it with the text. Plain fetch, no SDK.
import type { ShareKind } from '@/lib/share-cards';

const PDS = 'https://bsky.social/xrpc';
const APPVIEW = 'https://public.api.bsky.app/xrpc';

type Facet = { index: { byteStart: number; byteEnd: number }; features: { $type: 'app.bsky.richtext.facet#link'; uri: string }[] };

// Links in a Bluesky post are only clickable with a facet, and its offsets count
// UTF-8 bytes, not characters (the 🔥 before a link is 4 bytes).
export function linkFacets(text: string): Facet[] {
  const enc = new TextEncoder();
  const facets: Facet[] = [];
  for (const m of text.matchAll(/https?:\/\/[^\s)]+/g)) {
    const byteStart = enc.encode(text.slice(0, m.index)).length;
    facets.push({
      index: { byteStart, byteEnd: byteStart + enc.encode(m[0]).length },
      features: [{ $type: 'app.bsky.richtext.facet#link', uri: m[0] }],
    });
  }
  return facets;
}

// One card a day, rotating so followers don't see the same board every morning.
// Index = UTC weekday (0 = Sunday). The cron posts at 13:00 UTC, morning in the US.
const ROTATION: ShareKind[] = ['heat', 'heat', 'night', 'trends', 'heat', 'night', 'trends'];

// Today's kind first, then the others as fallbacks (no games last night → no night card).
export function kindsFor(date: Date): ShareKind[] {
  const first = ROTATION[date.getUTCDay()];
  return [first, ...(['heat', 'trends', 'night'] as ShareKind[]).filter(k => k !== first)];
}

async function xrpc<T>(method: string, init: RequestInit, base = PDS): Promise<T> {
  const res = await fetch(`${base}/${method}`, { ...init, signal: AbortSignal.timeout(15_000) });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method}: HTTP ${res.status} ${(body as { message?: string }).message ?? ''}`.trim());
  return body as T;
}

// When the account last posted — the guard against a retry posting twice.
export async function lastPostAt(handle: string): Promise<Date | null> {
  const feed = await xrpc<{ feed: { post: { record: { createdAt?: string } } }[] }>(
    `app.bsky.feed.getAuthorFeed?actor=${encodeURIComponent(handle)}&limit=1&filter=posts_no_replies`, {}, APPVIEW);
  const at = feed.feed[0]?.post.record.createdAt;
  return at ? new Date(at) : null;
}

export async function postWithImage(opts: {
  handle: string; appPassword: string; text: string;
  image: Uint8Array; alt: string; width: number; height: number;
}): Promise<string> {
  const session = await xrpc<{ did: string; accessJwt: string }>('com.atproto.server.createSession', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: opts.handle, password: opts.appPassword }),
  });
  const auth = { Authorization: `Bearer ${session.accessJwt}` };
  const { blob } = await xrpc<{ blob: unknown }>('com.atproto.repo.uploadBlob', {
    method: 'POST', headers: { ...auth, 'Content-Type': 'image/png' }, body: opts.image as BodyInit,
  });
  const record = {
    $type: 'app.bsky.feed.post',
    text: opts.text,
    facets: linkFacets(opts.text),
    createdAt: new Date().toISOString(),
    langs: ['en'],
    embed: {
      $type: 'app.bsky.embed.images',
      images: [{ image: blob, alt: opts.alt, aspectRatio: { width: opts.width, height: opts.height } }],
    },
  };
  const { uri } = await xrpc<{ uri: string }>('com.atproto.repo.createRecord', {
    method: 'POST', headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ repo: session.did, collection: 'app.bsky.feed.post', record }),
  });
  return uri;
}
