import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { gameUrl } from '@/lib/urls';

export const dynamic = 'force-dynamic';

export default async function GameRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data } = await supabaseAdmin
    .from('games')
    .select(`
      game_date,
      away_team:teams!games_away_team_id_fkey ( abbrev ),
      home_team:teams!games_home_team_id_fkey ( abbrev )
    `)
    .eq('id', id)
    .single();
  if (data) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const away = (data.away_team as any)?.abbrev ?? 'away';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const home = (data.home_team as any)?.abbrev ?? 'home';
    redirect(gameUrl(id, away, home, data.game_date));
  }
  redirect(`/games/${id}/game`);
}
