import { nationPage } from '@/components/nation/nation-page';
import { CZE } from '@/lib/nations';

// NHL API data with its own caches (box scores and rosters a day, goalie logs
// 30 min); pipeline runs revalidate it too. No database reads beyond the
// shared rankings.
export const revalidate = 86400; // backstop: pages change on /api/revalidate (lib/cache-policy.ts)

const page = nationPage(CZE);
export const generateMetadata = page.generateMetadata;
export default page.Page;
