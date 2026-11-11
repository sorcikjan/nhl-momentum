import type { Metadata } from 'next';
import { SectionHeading } from '@/components/ds';
import { RedditDesk } from '@/components/share/RedditDesk';
import { todayET } from '@/lib/home';
import { nextPostingDay, redditPlans, PAST_POSTS } from '@/lib/reddit-desk';
import { verifyLast5 } from '@/lib/reddit-verify';
import { fetchShareData } from '@/lib/share-data';

// Not for search: this is the posting desk.
export const metadata: Metadata = { title: 'Reddit desk', robots: { index: false, follow: false } };
// Fresh on every visit: the numbers get checked against NHL.com right before posting.
export const dynamic = 'force-dynamic';

const DAY = { mon: 1, wed: 3, fri: 5 } as const;

// Today's Reddit post, ready to go: open the filled-in form, paste the card, post, paste the comment.
// ?day=mon|wed|fri previews another posting day.
export default async function RedditDeskPage({ searchParams }: { searchParams: Promise<{ day?: string }> }) {
  const { day } = await searchParams;
  const date = todayET();
  const weekday = DAY[day as keyof typeof DAY] ?? new Date(`${date}T12:00:00Z`).getUTCDay();
  const plans = redditPlans(weekday, date, await fetchShareData());
  const players = [...new Map(plans.flatMap(p => p.players).map(p => [p.playerId, p])).values()];
  const checks = Object.fromEntries((await verifyLast5(players)).map((c, i) => [players[i].playerId, c]));
  return (
    <div className="flex flex-col gap-8 pb-20 lg:pb-0">
      <SectionHeading as="h1" size="page" kicker={`REDDIT DESK · ${date}`} title="Today's Reddit post."
        sub="Three posts a week: Monday r/fantasyhockey, Wednesday a team subreddit, Friday r/hockey. Everything is prepared; you only click Post." />
      {plans.length
        ? <RedditDesk date={date} plans={plans} checks={checks} past={PAST_POSTS} />
        : <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No post today. Next one: <b>{nextPostingDay(weekday)}</b>.</p>}
    </div>
  );
}
