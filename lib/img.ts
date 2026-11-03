// Images through Netlify's image CDN: resized to what's shown and served as
// WebP. NHL mugshots are 100–170 kB PNGs drawn as 30-px circles, and our
// covers are full-size PNGs. Only on Netlify builds — elsewhere (dev, local
// `next start`) there is no /.netlify/images, so the original URL is used.
const CDN = process.env.NEXT_PUBLIC_IMAGE_CDN === '1';

// `width` is the CSS width the image is shown at; it's fetched at 2x.
export function img(src: string, width: number): string;
export function img(src: string | null | undefined, width: number): string | null | undefined;
export function img(src: string | null | undefined, width: number) {
  if (!CDN || !src) return src;
  const ours = src.startsWith('/');
  if (!ours && !src.startsWith('https://assets.nhle.com/')) return src;
  return `/.netlify/images?url=${encodeURIComponent(src)}&w=${Math.round(width * 2)}&fm=webp&q=75`;
}
