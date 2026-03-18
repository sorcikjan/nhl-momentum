import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { playerUrl } from '@/lib/urls';

export const dynamic = 'force-dynamic';

export default async function PlayerRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data } = await supabaseAdmin
    .from('players')
    .select('first_name, last_name')
    .eq('id', id)
    .single();
  if (data) {
    redirect(playerUrl(id, data.first_name, data.last_name));
  }
  redirect(`/players/${id}/player`);
}
