import { nationTopicPage } from '@/components/nation/nation-topic-page';
import { CZE } from '@/lib/nations';

// Topic pages under /cesi-v-nhl (lib/nation-topics.ts): NHL API data only.
export const revalidate = 86400; // backstop: pages change on /api/revalidate (lib/cache-policy.ts)

// No `dynamicParams = false`: on Netlify it turned every topic page into a 404
// (27 Nov 2026). Unknown slugs get notFound() from the page itself.
const page = nationTopicPage(CZE);
export const generateStaticParams = page.generateStaticParams;
export const generateMetadata = page.generateMetadata;
export default page.Page;
