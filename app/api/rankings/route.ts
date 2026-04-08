import { NextResponse } from 'next/server';
import { fetchRankings } from '@/lib/data';

export async function GET() {
  try {
    const data = await fetchRankings();
    return NextResponse.json({ data, error: null });
  } catch (err) {
    console.error('[/api/rankings]', err);
    return NextResponse.json({ data: null, error: 'Internal server error' }, { status: 500 });
  }
}
