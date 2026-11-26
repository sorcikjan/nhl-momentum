import { nationTopicPage } from '@/components/nation/nation-topic-page';
import { FIN } from '@/lib/nations';

// Topic pages under /suomalaiset-nhl-ssa (lib/nation-topics.ts): NHL API data only.
export const revalidate = 86400; // backstop: pages change on /api/revalidate (lib/cache-policy.ts)
export const dynamicParams = false;

const page = nationTopicPage(FIN);
export const generateStaticParams = page.generateStaticParams;
export const generateMetadata = page.generateMetadata;
export default page.Page;
