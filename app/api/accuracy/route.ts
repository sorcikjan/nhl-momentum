import { NextRequest, NextResponse } from 'next/server';
import { fetchAccuracy } from '@/lib/data';

export async function GET(req: NextRequest) {
  try {
    const model = req.nextUrl.searchParams.get('model') ?? undefined;
    const data = await fetchAccuracy(model);
    return NextResponse.json({ data, error: null });
  } catch (err) {
    return NextResponse.json({ data: null, error: (err as Error).message }, { status: 500 });
  }
}
