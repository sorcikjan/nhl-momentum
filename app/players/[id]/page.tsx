import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { playerUrl } from '@/lib/urls';

// Free-tier database: data changes only when the pipeline runs, and pipeline
// runs call /api/revalidate — so a longer interval costs no freshness.
export const revalidate = 600;

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
