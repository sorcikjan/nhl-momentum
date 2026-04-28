import type { Metadata } from 'next';
import { Geist, Geist_Mono, Playfair_Display } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';
import { TopLoader } from '@/components/top-loader';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
const playfair = Playfair_Display({ variable: '--font-playfair', subsets: ['latin'], style: ['normal', 'italic'] });

const siteUrl = 'https://nhl-momentum.netlify.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Hockey Momentum — Hockey Intelligence, Daily',
    template: '%s — Hockey Momentum',
  },
  description: 'Hockey intelligence powered by AI. Daily stories, predictions and player rankings for every NHL game — updated live.',
  openGraph: {
    siteName: 'Hockey Momentum',
    type: 'website',
    url: siteUrl,
    title: 'Hockey Momentum — Hockey Intelligence, Daily',
    description: 'Hockey intelligence powered by AI. Daily stories, predictions and player rankings for every NHL game — updated live.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hockey Momentum — Hockey Intelligence, Daily',
    description: 'Hockey intelligence powered by AI. Daily stories, predictions and player rankings — updated live.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-Z7EWZE1NGP" strategy="afterInteractive" />
        <Script id="gtag-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-Z7EWZE1NGP');
        `}</Script>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} antialiased min-h-screen`}>
        <TopLoader />
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-0 md:ml-56 p-4 md:p-6 overflow-x-hidden">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
