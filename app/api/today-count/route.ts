import { NextResponse } from 'next/server';
import { fetchTodayGameCount } from '@/lib/data';

// Header "TONIGHT · N" pill. Served from the CDN for 5 min so the root layout
// needs no server fetch (a layout fetch would cap every page's ISR at 300s).
export async function GET() {
  try {
    const count = await fetchTodayGameCount();
    return NextResponse.json({ count }, { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } });
  } catch (err) {
    console.error('[/api/today-count]', err);
    return NextResponse.json({ count: null }, { status: 502, headers: { 'Cache-Control': 'public, s-maxage=60' } });
  }
}
