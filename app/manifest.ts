import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'momentum. — NHL Heat Index',
    short_name: 'momentum.',
    description: "Who's hot in the NHL right now: every player's form in one number.",
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0b0f',
    theme_color: '#0a0b0f',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
