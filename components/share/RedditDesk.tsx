'use client';

import { useEffect, useState } from 'react';
import { CopyText } from '@/components/share/CopyText';
import { submitUrl, type RedditPlan } from '@/lib/reddit-desk';
import type { Check } from '@/lib/reddit-verify';

const MONO = { fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' } as const;
const LOG_KEY = 'reddit-desk-log';
const REPEAT_DAYS = 14;

type Logged = { date: string; subreddit: string };

// The log of what was posted lives in this browser only: it's a convenience
// for the one person posting, so the desk doesn't pick the same subreddit twice.
function readLog(): Logged[] {
  try { return JSON.parse(localStorage.getItem(LOG_KEY) ?? '[]'); } catch { return []; }
}

export function RedditDesk({ date, plans, checks, past }: {
  date: string; plans: RedditPlan[]; checks: Record<number, Check>; past: Logged[];
}) {
  const [log, setLog] = useState<Logged[]>(past);
  const [step, setStep] = useState<Record<string, boolean>>({});
  useEffect(() => { setLog([...past, ...readLog()]); }, [past]);

  const cutoff = new Date(Date.parse(`${date}T12:00:00Z`) - REPEAT_DAYS * 86_400_000).toISOString().slice(0, 10);
  const recent = new Set(log.filter(l => l.date >= cutoff && l.date < date).map(l => l.subreddit.toLowerCase()));
  const plan = plans.find(p => !recent.has(p.subreddit.toLowerCase())) ?? plans[0];
  const postedToday = log.some(l => l.date === date && l.subreddit === plan.subreddit);
  const bad = plan.players.map(p => checks[p.playerId]).filter(c => c && !c.ok);
  const card = `/share/card/${plan.card}`;

  const done = (k: string) => setStep(s => ({ ...s, [k]: true }));
  const copyCard = async () => {
    try {
      // A promise inside ClipboardItem keeps Safari's user-gesture rule happy.
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': fetch(card).then(r => r.blob()) })]);
      done('card');
    } catch { window.open(card, '_blank'); }
  };
  const copyComment = async () => {
    try { await navigator.clipboard.writeText(plan.comment); done('comment'); } catch { /* copy from the box below */ }
  };
  const markPosted = () => {
    const next = [...readLog(), { date, subreddit: plan.subreddit }];
    try { localStorage.setItem(LOG_KEY, JSON.stringify(next)); } catch { /* private window: nothing to remember */ }
    setLog([...past, ...next]);
  };

  const btn = (k: string, n: number, label: string, onClick: () => void) => (
    <button type="button" onClick={onClick} className="flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-bold"
      style={{ borderColor: step[k] ? 'var(--rise)' : 'var(--border)', background: 'var(--bg-card)', color: 'var(--text-bright)' }}>
      <span className="text-xs" style={{ ...MONO, color: step[k] ? 'var(--rise)' : 'var(--heat)' }}>{step[k] ? '✓' : n}</span>
      {label}
    </button>
  );

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[360px_minmax(0,1fr)]">
      <div className="flex flex-col gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={card} alt="Today's card" width={1080} height={1350} className="h-auto w-full rounded-xl border" style={{ borderColor: 'var(--border)' }} />
      </div>
      <div className="flex min-w-0 flex-col gap-5">
        <div className="text-lg font-extrabold" style={{ color: 'var(--text-bright)' }}>r/{plan.subreddit}</div>

        {bad.length > 0 ? (
          <div className="rounded-xl border p-3 text-sm" style={{ borderColor: 'var(--cold)', color: 'var(--text)' }}>
            <b>Don&apos;t post yet — numbers differ from NHL.com:</b>
            <ul className="mt-1">{bad.map(c => <li key={c.name}>{c.name}: ours {c.ours}, NHL {c.nhl ?? 'unavailable'}</li>)}</ul>
          </div>
        ) : (
          <div className="text-xs font-bold" style={{ ...MONO, color: 'var(--rise)' }}>✓ EVERY NUMBER MATCHES NHL.COM</div>
        )}

        {postedToday ? (
          <div className="text-sm font-bold" style={{ color: 'var(--rise)' }}>✓ Posted today. Next one on the next posting day.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {btn('open', 1, 'Open Reddit — title and text are filled in', () => { window.open(submitUrl(plan), '_blank'); done('open'); })}
            {btn('card', 2, 'Copy the card → click under the last paragraph, ⌘V', copyCard)}
            <div className="px-1 text-xs" style={{ color: 'var(--text-muted)' }}>3 · Pick a flair if the subreddit asks for one, then Post.</div>
            {btn('comment', 4, 'Copy the comment → paste it under your post', copyComment)}
            {btn('posted', 5, 'Done — mark as posted', () => { markPosted(); done('posted'); })}
          </div>
        )}

        <CopyText label="TITLE" text={plan.title} />
        <CopyText label="POST" text={plan.body} />
        <CopyText label="FIRST COMMENT · THE LINK" text={plan.comment} />
      </div>
    </div>
  );
}
