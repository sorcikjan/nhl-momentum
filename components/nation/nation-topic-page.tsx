import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { NationTopicBody } from '@/components/nation/NationTopicBody';
import { JsonLd } from '@/components/seo/JsonLd';
import { fetchNationData } from '@/lib/nation-data';
import { nationTopics } from '@/lib/nation-topics';
import type { Nation } from '@/lib/nations';
import { currentSeason } from '@/lib/nhl-api';
import { SHARE_IMAGE } from '@/lib/seo';
import { SITE_URL } from '@/lib/site';

// The topic pages of one nation (app/cesi-v-nhl/[topic]): metadata, static
// params and the page. Same data as the nation page, one fetch per render.
export function nationTopicPage(n: Nation) {
  const topics = () => nationTopics(n, currentSeason());
  const topicOf = (slug: string) => topics().find(t => t.slug === slug);
  const nationData = cache(() => fetchNationData(n));

  // Empty, as on player and game pages: each topic page renders on its first
  // request and is cached from then on. Prerendered at build time (with or
  // without dynamicParams = false) they all answered 404 on Netlify while
  // working locally (27 Nov 2026). Unknown slugs get notFound() below.
  function generateStaticParams() {
    return [];
  }

  async function generateMetadata({ params }: { params: Promise<{ topic: string }> }): Promise<Metadata> {
    const t = topicOf((await params).topic);
    if (!t) return {};
    const url = `${SITE_URL}${n.path}/${t.slug}`;
    return {
      title: { absolute: `${t.title} | momentum.` },
      description: t.description,
      alternates: { canonical: url },
      openGraph: { title: t.title, description: t.description, locale: n.locale.replace('-', '_'), images: [SHARE_IMAGE], url },
      twitter: { card: 'summary_large_image', title: t.title, description: t.description, images: [SHARE_IMAGE.url] },
    };
  }

  async function Page({ params }: { params: Promise<{ topic: string }> }) {
    const t = topicOf((await params).topic);
    if (!t) notFound();
    let data = await nationData();
    // As on the nation page: one more try before caching a partial load.
    if (data.partial) {
      await new Promise(r => setTimeout(r, 3000));
      data = await fetchNationData(n).catch(() => data);
    }
    const updated = new Date().toLocaleDateString(n.locale, { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: n.timeZone });
    const url = `${SITE_URL}${n.path}/${t.slug}`;
    return (
      <>
        <JsonLd data={{
          '@context': 'https://schema.org', '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: n.t.ui.name, item: `${SITE_URL}${n.path}` },
            { '@type': 'ListItem', position: 2, name: t.nav, item: url },
          ],
        }} />
        <JsonLd data={{ '@context': 'https://schema.org', '@type': 'FAQPage', inLanguage: n.lang, mainEntity: t.faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }} />
        <NationTopicBody n={n} topic={t} topics={topics()} data={data} updated={updated} />
      </>
    );
  }

  return { generateStaticParams, generateMetadata, Page };
}
