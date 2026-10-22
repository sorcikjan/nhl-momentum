import type { Metadata } from 'next';
import { fetchSeasonPickAccuracy } from '@/lib/data';
import { fetchDayCards } from '@/lib/game-cards';
import { todayET } from '@/lib/home';
import { predictionsTitle } from '@/lib/seo';
import { SITE_URL } from '@/lib/site';
import { assertDatabaseUp } from '@/lib/supabase';
import { PredictionsBody } from './PredictionsBody';

// Shared by /predictions (today) and /predictions/[date].
export function predictionsMetadata(date: string): Metadata {
  const title = predictionsTitle(date, todayET());
  const description = `Our model's pick for every NHL game on ${new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })} — win probabilities and each team's three hottest players by Heat.`;
  const url = `${SITE_URL}/predictions/${date}`;
  return {
    title: { absolute: `${title} — momentum.` },
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export async function PredictionsPage({ date }: { date: string }) {
  // Throw (→ keep serving the last good cached page) if the database is down.
  await assertDatabaseUp();
  const [days, accuracy] = await Promise.all([
    fetchDayCards([date]),
    fetchSeasonPickAccuracy().catch(() => null),
  ]);
  return <PredictionsBody date={date} today={todayET()} cards={days[0]?.cards ?? []} accuracyPct={accuracy} siteUrl={SITE_URL} />;
}
