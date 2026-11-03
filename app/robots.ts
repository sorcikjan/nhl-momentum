import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/api/', '/share'] },
      // Bing honours Crawl-delay (Google ignores it and paces itself by response
      // time). A full recrawl of ~1,200 pages drained the free database's Disk IO.
      { userAgent: 'bingbot', allow: '/', disallow: ['/api/', '/share'], crawlDelay: 10 },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
