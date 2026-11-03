import type { Metadata } from 'next';
import { NationBody } from '@/components/nation/NationBody';
import { JsonLd } from '@/components/seo/JsonLd';
import { fetchNationData } from '@/lib/nation-data';
import { CZE } from '@/lib/nations';
import { SHARE_IMAGE } from '@/lib/seo';
import { SITE_URL } from '@/lib/site';

// NHL API data with its own caches (game logs 30 min, rosters a day); pipeline
// runs revalidate it too. No database reads beyond the shared rankings.
export const revalidate = 900;

const TITLE = 'Češi v NHL – výsledky, góly a forma českých hráčů';
const DESC = 'Jak hráli Češi v NHL v noci: body, čas na ledě, góly s videem, forma podle Heat, čeští brankáři a kdo hraje dnes. Aktualizováno po každém zápase.';

export const metadata: Metadata = {
  title: { absolute: `${TITLE} | momentum.` },
  description: DESC,
  alternates: { canonical: `${SITE_URL}${CZE.path}` },
  openGraph: { title: TITLE, description: DESC, locale: 'cs_CZ', images: [SHARE_IMAGE] },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESC, images: [SHARE_IMAGE.url] },
};

export default async function CzechsPage() {
  const data = await fetchNationData(CZE);
  const updated = new Date().toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'Europe/Prague' });
  return (
    <>
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Češi v NHL', url: `${SITE_URL}${CZE.path}`,
        inLanguage: 'cs', description: DESC,
        mainEntity: { '@type': 'ItemList', itemListElement: data.skaters.slice(0, 20).map((r, i) => ({ '@type': 'ListItem', position: i + 1, name: r.name, url: `${SITE_URL}${r.href}` })) },
      }} />
      <NationBody data={data} updated={updated} />
    </>
  );
}
