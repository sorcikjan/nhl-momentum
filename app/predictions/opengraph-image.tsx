import { predictionsImage } from '@/components/predictions/predictions-image';
import { todayET } from '@/lib/home';
import { OG_SIZE } from '@/lib/og';

export const size = OG_SIZE;
export const contentType = 'image/png';
export const alt = 'Our pick for every NHL game tonight';
export const revalidate = 86400; // backstop: pages change on /api/revalidate (lib/cache-policy.ts)

export default async function Image() {
  return predictionsImage(todayET());
}
