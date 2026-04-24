import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

// Called by pipeline workers (game-finish-worker, daily-worker) after writing
// to Supabase so the homepage ISR cache is immediately invalidated — no stale
// data waiting for the next visitor to accidentally trigger a refresh.

export async function POST(request: Request) {
  const key = request.headers.get('x-api-key') ?? '';
  if (key !== process.env.INGEST_API_KEY) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  revalidatePath('/');
  revalidatePath('/games');
  revalidatePath('/rankings');
  revalidatePath('/accuracy');

  return NextResponse.json({ revalidated: true, ts: new Date().toISOString() });
}
