import { NextRequest, NextResponse } from 'next/server';
import { fetchAccuracy } from '@/lib/data';

export async function GET(req: NextRequest) {
  try {
    const model = req.nextUrl.searchParams.get('model') ?? undefined;
    const data = await fetchAccuracy(model);
    return NextResponse.json({ data, error: null });
  } catch (err) {
    console.error('[/api/accuracy]', err);
    return NextResponse.json({ data: null, error: 'Internal server error' }, { status: 500 });
  }
}
