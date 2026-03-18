import { NextRequest, NextResponse } from 'next/server';
import { getGamesByDate } from '@/lib/nhl-api';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/games?date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date') ??
    new Date().toISOString().slice(0, 10);

  try {
    // Fetch schedule from NHL API
    const games = await getGamesByDate(date);

    // Fetch our predictions for these games from DB
    const gameIds = (games as { id: number }[]).map(g => g.id);
    const { data: predictions } = await supabaseAdmin
      .from('predictions')
      .select('*, prediction_outcomes(*)')
      .in('game_id', gameIds);

    return NextResponse.json({ data: { games, predictions }, error: null });
  } catch (err) {
    return NextResponse.json(
      { data: null, error: (err as Error).message },
      { status: 500 }
    );
  }
}
