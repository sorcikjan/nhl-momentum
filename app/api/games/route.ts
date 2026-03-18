import { NextRequest, NextResponse } from 'next/server';
import { fetchGames } from '@/lib/data';

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date') ?? new Date().toISOString().slice(0, 10);
  try {
    const data = await fetchGames(date);
    return NextResponse.json({ data, error: null });
  } catch (err) {
    return NextResponse.json({ data: null, error: (err as Error).message }, { status: 500 });
  }
}
