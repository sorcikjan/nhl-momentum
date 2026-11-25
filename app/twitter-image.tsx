import Image from './opengraph-image';
import { OG_SIZE } from '@/lib/og';

export const size = OG_SIZE;
export const contentType = 'image/png';
export const alt = "momentum. — who's hot in the NHL right now";
export const revalidate = 86400; // backstop: pages change on /api/revalidate (lib/cache-policy.ts)

export default Image;
