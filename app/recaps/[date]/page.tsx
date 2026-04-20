import { redirect, notFound } from 'next/navigation';
import { fetchRecap } from '@/lib/data';
import { recapUrl } from '@/lib/urls';

// Redirect /recaps/[date] → /recaps/[date]/[slug]
// Keeps old links working while establishing canonical slug URLs.
export default async function RecapDateRedirect({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();

  const recap = await fetchRecap(date).catch(() => null);
  if (!recap) notFound();

  redirect(recapUrl(date, recap.title));
}
