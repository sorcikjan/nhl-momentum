import { NextRequest, NextResponse } from 'next/server';
import { requireIngestAuth } from '@/lib/ingest-auth';
import { supabaseAdmin } from '@/lib/supabase';
import Parser from 'rss-parser';

// GET /api/ingest/soft-signals?type=rss|newsdata|all
// Fetches NHL news from RSS and/or Newsdata.io and stores in soft_signals table.
// Deduplicates by URL — safe to run multiple times per day.

const rssParser = new Parser({ timeout: 10000 });

// ─── NHL.com RSS ──────────────────────────────────────────────────────────────

async function fetchRssSignals() {
  const feed = await rssParser.parseURL('https://www.to-rss.xyz/nhl/');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (feed.items ?? []).slice(0, 20).map((item: any) => ({
    type:         'rss_nhl',
    title:        item.title?.trim() ?? '',
    content:      item.contentSnippet?.trim() ?? item.content?.trim() ?? null,
    url:          item.link ?? null,
    source:       'NHL.com',
    published_at: item.pubDate ? new Date(item.pubDate).toISOString() : null,
  }));
}

// ─── Newsdata.io ──────────────────────────────────────────────────────────────

async function fetchNewsdataSignals() {
  const key = process.env.NEWSDATA_API_KEY;
  if (!key) return [];

  const url = `https://newsdata.io/api/1/news?apikey=${key}&q=NHL+hockey&language=en&category=sports&size=10`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return [];

  const json = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (json.results ?? []).map((item: any) => ({
    type:         'newsdata',
    title:        item.title?.trim() ?? '',
    content:      item.description?.trim() ?? null,
    url:          item.link ?? null,
    source:       item.source_name ?? item.source_id ?? 'Newsdata',
    published_at: item.pubDate ? new Date(item.pubDate).toISOString() : null,
  }));
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const authError = requireIngestAuth(req);
  if (authError) return authError;

  const type = req.nextUrl.searchParams.get('type') ?? 'all';

  const fetchers: Promise<typeof rssFmt>[] = [];
  if (type === 'rss' || type === 'all')      fetchers.push(fetchRssSignals().catch(() => []));
  if (type === 'newsdata' || type === 'all') fetchers.push(fetchNewsdataSignals().catch(() => []));

  const results = await Promise.all(fetchers);
  const signals = results.flat().filter(s => s.title);

  if (!signals.length) {
    return NextResponse.json({ data: { inserted: 0, skipped: 0 }, error: null });
  }

  // Deduplicate against existing URLs in DB
  const urls = signals.map(s => s.url).filter(Boolean);
  const { data: existing } = urls.length ? await supabaseAdmin
    .from('soft_signals')
    .select('url')
    .in('url', urls as string[]) : { data: [] };

  const existingUrls = new Set((existing ?? []).map((r: { url: string }) => r.url));
  const fresh = signals.filter(s => !s.url || !existingUrls.has(s.url));

  if (!fresh.length) {
    return NextResponse.json({ data: { inserted: 0, skipped: signals.length }, error: null });
  }

  const { error } = await supabaseAdmin.from('soft_signals').insert(fresh);
  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 });

  return NextResponse.json({
    data: { inserted: fresh.length, skipped: signals.length - fresh.length },
    error: null,
  });
}

// Dummy type for TypeScript inference
const rssFmt = {} as {
  type: string; title: string; content: string | null;
  url: string | null; source: string; published_at: string | null;
};
void rssFmt;
