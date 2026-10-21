import { NextResponse } from 'next/server';
import { fetchSearchIndex } from '@/lib/data';

// Whole player/team search index, fetched once per visitor when they open search.
// CDN-cached for an hour, so typing in search never touches the database.
export async function GET() {
  try {
    const index = await fetchSearchIndex();
    return NextResponse.json(index, { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } });
  } catch (err) {
    console.error('[/api/search-index]', err);
    return NextResponse.json({ players: [], teams: [] }, { status: 502, headers: { 'Cache-Control': 'public, s-maxage=60' } });
  }
}
