import { predictionsImage } from '@/components/predictions/predictions-image';
import { todayET } from '@/lib/home';
import { OG_SIZE } from '@/lib/og';

export const size = OG_SIZE;
export const contentType = 'image/png';
export const alt = 'Our pick for every NHL game tonight';
export const revalidate = 600;

export default async function Image() {
  return predictionsImage(todayET());
}
