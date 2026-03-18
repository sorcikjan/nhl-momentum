import { NextResponse } from 'next/server';
import { fetchRankings } from '@/lib/data';

export async function GET() {
  try {
    const data = await fetchRankings();
    return NextResponse.json({ data, error: null });
  } catch (err) {
    return NextResponse.json({ data: null, error: (err as Error).message }, { status: 500 });
  }
}
