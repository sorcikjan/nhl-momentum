import { nationTopicPage } from '@/components/nation/nation-topic-page';
import { LVA } from '@/lib/nations';

// Topic pages under /latviesi-nhl (lib/nation-topics.ts): NHL API data only.
export const revalidate = 86400; // backstop: pages change on /api/revalidate (lib/cache-policy.ts)

// No `dynamicParams = false` and no prerendering: on Netlify both left every
// topic page a 404 (27 Nov 2026). Unknown slugs get notFound() from the page.
const page = nationTopicPage(LVA);
export const generateStaticParams = page.generateStaticParams;
export const generateMetadata = page.generateMetadata;
export default page.Page;
