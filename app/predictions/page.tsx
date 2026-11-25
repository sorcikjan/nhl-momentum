import type { Metadata } from 'next';
import { PredictionsPage, predictionsMetadata } from '@/components/predictions/predictions-route';
import { todayET } from '@/lib/home';

// Tonight's predictions; canonical is the dated URL. 10 min keeps crawlers off the DB.
export const revalidate = 86400; // backstop: pages change on /api/revalidate (lib/cache-policy.ts)

export function generateMetadata(): Metadata {
  return predictionsMetadata(todayET());
}

export default function Page() {
  return <PredictionsPage date={todayET()} />;
}
