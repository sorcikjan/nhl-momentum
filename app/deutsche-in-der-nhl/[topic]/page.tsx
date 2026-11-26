import { nationTopicPage } from '@/components/nation/nation-topic-page';
import { DEU } from '@/lib/nations';

// Topic pages under /deutsche-in-der-nhl (lib/nation-topics.ts): NHL API data only.
export const revalidate = 86400; // backstop: pages change on /api/revalidate (lib/cache-policy.ts)
export const dynamicParams = false;

const page = nationTopicPage(DEU);
export const generateStaticParams = page.generateStaticParams;
export const generateMetadata = page.generateMetadata;
export default page.Page;
