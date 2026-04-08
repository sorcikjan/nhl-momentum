import { NextRequest, NextResponse } from 'next/server';
import { fetchGames } from '@/lib/data';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: NextRequest) {
  const dateParam = req.nextUrl.searchParams.get('date');
  const date = dateParam ?? new Date().toISOString().slice(0, 10);

  if (dateParam && !DATE_RE.test(dateParam)) {
    return NextResponse.json({ data: null, error: 'Invalid date format' }, { status: 400 });
  }

  try {
    const data = await fetchGames(date);
    return NextResponse.json({ data, error: null });
  } catch (err) {
    console.error('[/api/games]', err);
    return NextResponse.json({ data: null, error: 'Internal server error' }, { status: 500 });
  }
}
