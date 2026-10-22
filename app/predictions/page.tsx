import type { Metadata } from 'next';
import { PredictionsPage, predictionsMetadata } from '@/components/predictions/predictions-route';
import { todayET } from '@/lib/home';

// Tonight's predictions; canonical is the dated URL. 10 min keeps crawlers off the DB.
export const revalidate = 600;

export function generateMetadata(): Metadata {
  return predictionsMetadata(todayET());
}

export default function Page() {
  return <PredictionsPage date={todayET()} />;
}
