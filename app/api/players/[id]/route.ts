import { NextRequest, NextResponse } from 'next/server';
import { fetchPlayer } from '@/lib/data';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const data = await fetchPlayer(id);
    return NextResponse.json({ data, error: null });
  } catch (err) {
    console.error('[/api/players]', err);
    return NextResponse.json({ data: null, error: 'Internal server error' }, { status: 500 });
  }
}
