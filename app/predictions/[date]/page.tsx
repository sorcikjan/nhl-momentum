import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PredictionsPage, predictionsMetadata } from '@/components/predictions/predictions-route';
import { parsePredictionDate } from '@/lib/seo';

// Today's page changes through the evening; older days barely change.
export const revalidate = 600;

// Render on first visit, then serve from the ISR cache for `revalidate` seconds.
// Without this, a dynamic-segment page is rendered on every request.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ date: string }> }): Promise<Metadata> {
  const date = parsePredictionDate((await params).date);
  return date ? predictionsMetadata(date) : { title: 'Not found' };
}

export default async function Page({ params }: { params: Promise<{ date: string }> }) {
  const date = parsePredictionDate((await params).date);
  if (!date) notFound();
  return <PredictionsPage date={date} />;
}
