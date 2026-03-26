import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { teamUrl } from '@/lib/urls';

export const revalidate = 300;

export default async function TeamRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data } = await supabaseAdmin
    .from('teams')
    .select('name')
    .eq('id', id)
    .single();
  if (data) {
    redirect(teamUrl(id, data.name));
  }
  redirect(`/teams/${id}/team`);
}
