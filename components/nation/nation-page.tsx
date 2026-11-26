import type { Metadata } from 'next';
import { cache } from 'react';
import { NationBody } from '@/components/nation/NationBody';
import { JsonLd } from '@/components/seo/JsonLd';
import { fetchNationData } from '@/lib/nation-data';
import type { Nation } from '@/lib/nations';
import { SHARE_IMAGE } from '@/lib/seo';
import { SITE_URL } from '@/lib/site';

// One nation page (app/cesi-v-nhl, app/svenskar-i-nhl…): its metadata and
// body, in the nation's language. Each route keeps its own `revalidate`,
// which Next reads from the route file.
export function nationPage(n: Nation) {
  const { title, description } = n.t.ui;
  const metadata: Metadata = {
    title: { absolute: `${title} | momentum.` },
    description,
    alternates: { canonical: `${SITE_URL}${n.path}` },
    openGraph: { title, description, locale: n.locale.replace('-', '_'), images: [SHARE_IMAGE] },
    twitter: { card: 'summary_large_image', title, description, images: [SHARE_IMAGE.url] },
  };

  // Metadata and the page share one fetch per render.
  const nationData = cache(() => fetchNationData(n));

  // The snippet changes with every night: its summary first, then what's on the page.
  async function generateMetadata(): Promise<Metadata> {
    const summary = (await nationData().catch(() => null))?.night?.summary;
    return { ...metadata, description: summary ? `${summary}${n.t.ui.snippetTail}` : description };
  }

  async function Page() {
    let data = await nationData();
    // Some NHL calls failed (usually a burst of 429s): try once more after a
    // pause before rendering. A partial page is cached until the next
    // revalidation (a day), so it's worth the wait. Answers that did arrive are
    // in the fetch cache: the second try only repeats the failed calls.
    if (data.partial) {
      await new Promise(r => setTimeout(r, 3000));
      data = await fetchNationData(n).catch(() => data);
    }
    const updated = new Date().toLocaleDateString(n.locale, { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: n.timeZone });
    return (
      <>
        <JsonLd data={{
          '@context': 'https://schema.org', '@type': 'CollectionPage', name: n.label, url: `${SITE_URL}${n.path}`,
          inLanguage: n.lang, description,
          mainEntity: { '@type': 'ItemList', itemListElement: data.skaters.slice(0, 20).map((r, i) => ({ '@type': 'ListItem', position: i + 1, name: r.name, url: `${SITE_URL}${r.href}` })) },
        }} />
        {/* The site is English (<html lang="en">): the nation's language is set on its content. */}
        <div lang={n.lang}>
          <NationBody n={n} data={data} updated={updated} />
        </div>
      </>
    );
  }

  return { generateMetadata, Page };
}
