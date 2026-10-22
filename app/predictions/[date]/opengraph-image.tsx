import { predictionsImage } from '@/components/predictions/predictions-image';
import { fallbackImage, OG_SIZE } from '@/lib/og';
import { parsePredictionDate } from '@/lib/seo';

export const size = OG_SIZE;
export const contentType = 'image/png';
export const alt = 'Our pick for every NHL game that day';

export default async function Image({ params }: { params: Promise<{ date: string }> }) {
  const date = parsePredictionDate((await params).date);
  return date ? predictionsImage(date) : fallbackImage('PREDICTIONS', 'Hockey Intelligence, Daily.');
}
