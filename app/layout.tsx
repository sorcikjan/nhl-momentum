import type { Metadata } from 'next';
import { Geist, Geist_Mono, Fraunces } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import BrandHeader from '@/components/layout/BrandHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
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
        <BrandHeader />
        <div className="flex min-h-screen flex-col">
          {/* Offsets: fixed header 48px mobile / 72px desktop; design gutters 16 / 48px. */}
          <main className="flex-1 overflow-x-hidden px-4 pb-6 pt-16 lg:px-12 lg:pb-10 lg:pt-[104px]">
            {children}
          </main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
