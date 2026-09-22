import type { Metadata } from 'next';
import { Geist, Geist_Mono, Fraunces } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';
import { TopLoader } from '@/components/top-loader';
import { SITE_URL } from '@/lib/site';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
const fraunces = Fraunces({ variable: '--font-fraunces', subsets: ['latin'], style: ['normal', 'italic'], weight: ['700', '900'] });

const siteUrl = SITE_URL;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'momentum. — Hockey Intelligence, Daily',
    template: '%s — momentum.',
  },
  description: 'Hockey intelligence powered by AI. Daily stories, predictions and player rankings for every NHL game — updated live.',
  openGraph: {
    siteName: 'momentum.',
    type: 'website',
    url: siteUrl,
    title: 'momentum. — Hockey Intelligence, Daily',
    description: 'Hockey intelligence powered by AI. Daily stories, predictions and player rankings for every NHL game — updated live.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'momentum. — Hockey Intelligence, Daily',
    description: 'Hockey intelligence powered by AI. Daily stories, predictions and player rankings — updated live.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <Script defer data-domain="hockeymomentum.com" src="https://plausible.io/js/script.js" strategy="afterInteractive" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} antialiased min-h-screen`}>
        <TopLoader />
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 pt-12 md:pt-16 p-4 md:p-6 overflow-x-hidden">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
