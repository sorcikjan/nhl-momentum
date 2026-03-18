import { NextResponse } from 'next/server';
import { fetchAccuracy } from '@/lib/data';

export async function GET() {
  try {
    const data = await fetchAccuracy();
    return NextResponse.json({ data, error: null });
  } catch (err) {
    return NextResponse.json({ data: null, error: (err as Error).message }, { status: 500 });
  }
}
