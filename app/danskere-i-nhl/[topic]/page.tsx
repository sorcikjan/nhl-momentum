import { nationTopicPage } from '@/components/nation/nation-topic-page';
import { DNK } from '@/lib/nations';

// Topic pages under /danskere-i-nhl (lib/nation-topics.ts): NHL API data only.
export const revalidate = 86400; // backstop: pages change on /api/revalidate (lib/cache-policy.ts)
export const dynamicParams = false;

const page = nationTopicPage(DNK);
export const generateStaticParams = page.generateStaticParams;
export const generateMetadata = page.generateMetadata;
export default page.Page;
