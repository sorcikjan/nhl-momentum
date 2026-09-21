import type { Metadata } from 'next';
import Link from 'next/link';
import HeatCircle from '@/components/ui/HeatCircle';
import HeatBadge from '@/components/ui/HeatBadge';
import { fetchRankings, fetchAccuracy, teamLogoUrl } from '@/lib/data';
import { ppmToHeat } from '@/lib/heat';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Hockey Intelligence, Daily',
  description: 'Momentum gives every NHL player a Heat score from 0 to 100, updated every game. AI-powered predictions, rankings, and stories for fans who want more than box scores.',
  openGraph: {
    title: 'momentum. — Hockey Intelligence, Daily',
    description: 'Every player, one number. See who’s burning, who’s cooling, and which games tonight are worth watching.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'momentum. — Hockey Intelligence, Daily',
    description: 'Every player, one number. AI-powered NHL predictions and momentum tracking.',
  },
};

export default async function WelcomePage() {
  const [rankings, accuracy] = await Promise.all([
    fetchRankings().catch(() => null),
    fetchAccuracy().catch(() => null),
  ]);

  const topSkaters = (rankings?.momentumLeaders?.skaters ?? []).slice(0, 5);
  const heroPlayer = topSkaters[0];
  const heroHeat = heroPlayer ? ppmToHeat(heroPlayer.momentum_ppm) : null;

  const activeModel = accuracy?.modelVersions?.find((v: { is_active: boolean }) => v.is_active)?.version
    ?? [...(accuracy?.modelStats ?? [])].sort((a: { version: string }, b: { version: string }) => b.version.localeCompare(a.version))[0]?.version;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const accuracyStat = (accuracy?.modelStats as any[])?.find((m) => m.version === activeModel);
  const accuracyPct = accuracyStat?.winnerAccuracyPct ?? null;

  return (
    <div className="max-w-5xl mx-auto pb-20 md:pb-0">

      {/* HERO */}
      <section className="pt-8 pb-12 md:pt-14 md:pb-16">
        <div className="max-w-2xl">
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--heat)' }}>
            AI hockey intelligence
          </span>
          <h1 className="mt-2" style={{
            fontFamily: 'var(--font-fraunces), Georgia, serif',
            fontWeight: 900,
            fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
            letterSpacing: '-0.03em',
            lineHeight: 1.02,
          }}>
            <span style={{ color: 'var(--text-bright)' }}>Every player. </span>
            <span style={{ color: 'var(--heat)' }}>One number.</span>
          </h1>
          <p className="mt-4 text-base md:text-lg" style={{ color: 'var(--text)' }}>
            Momentum gives every NHL player a <strong style={{ color: 'var(--heat)' }}>Heat score from 0 to 100</strong>, recalculated after every game. No spreadsheets, no jargon — just who&apos;s burning, who&apos;s cooling, and which games tonight are worth your time.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center px-5 py-3 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity"
              style={{ background: 'var(--heat)', color: '#0a0b0f' }}
            >
              See tonight&apos;s Heat &rarr;
            </Link>
            <Link href="/hot" className="text-sm font-semibold hover:underline" style={{ color: 'var(--text)' }}>
              Browse the rankings
            </Link>
          </div>
        </div>
      </section>

      {/* LIVE PROOF — real data, not a screenshot */}
      {heroPlayer && heroHeat !== null && (
        <section className="mb-14 rounded-2xl border p-6 md:p-8 flex flex-col md:flex-row items-center gap-8"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <HeatCircle heat={heroHeat} size={140} label="HEAT · L5" />
          <div>
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--heat)' }}>Live right now</span>
            <h2 className="mt-1 text-2xl md:text-3xl font-bold font-editorial" style={{ color: 'var(--text-bright)' }}>
              {heroPlayer.players?.first_name} {heroPlayer.players?.last_name}
            </h2>
            <p className="mt-2 text-sm" style={{ color: 'var(--text)' }}>
              This week&apos;s hottest skater — a Heat score this high means their last 5 games are running well above their own season average. That&apos;s the whole idea: not who&apos;s good on paper, but who&apos;s good <em>right now</em>.
            </p>
          </div>
        </section>
      )}

      {/* WHY IT'S DIFFERENT */}
      <section className="mb-14 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border p-6" style={{ borderColor: 'var(--border)' }}>
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--cold)' }}>For the casual fan</span>
          <h3 className="mt-2 text-lg font-bold" style={{ color: 'var(--text-bright)' }}>Know who&apos;s hot without the homework.</h3>
          <p className="mt-2 text-sm" style={{ color: 'var(--text)' }}>
            One number, framed in plain language. Check it during intermission, before you flip on a game, or when someone asks who&apos;s actually playing well right now.
          </p>
        </div>
        <div className="rounded-xl border p-6" style={{ borderColor: 'var(--border)' }}>
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--rise)' }}>For the data enthusiast</span>
          <h3 className="mt-2 text-lg font-bold" style={{ color: 'var(--text-bright)' }}>We show our work.</h3>
          <p className="mt-2 text-sm" style={{ color: 'var(--text)' }}>
            Public prediction accuracy tracking, model version history, and a momentum score benchmarked against each player&apos;s own season — not a league average that flattens everything.
          </p>
        </div>
      </section>

      {/* MINI LEADERBOARD */}
      {topSkaters.length > 0 && (
        <section className="mb-14">
          <h2 className="text-xl font-bold font-editorial mb-1" style={{ color: 'var(--text-bright)' }}>Who&apos;s burning right now.</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--text)' }}>Updated after every game — this is a live snapshot, not a mockup.</p>
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            {topSkaters.map((p, i: number) => (
              <div key={p.player_id} className="flex items-center gap-3 px-4 py-3 border-t first:border-t-0" style={{ borderColor: 'var(--border)', background: i % 2 === 0 ? 'var(--bg)' : 'var(--bg-card)' }}>
                <span className="text-sm font-mono w-5" style={{ color: 'var(--text)', opacity: 0.5 }}>{i + 1}</span>
                {p.players?.teams?.abbrev && (
                  <img src={teamLogoUrl(p.players.teams.abbrev)} alt="" className="w-6 h-6" />
                )}
                <span className="flex-1 text-sm font-semibold" style={{ color: 'var(--text-bright)' }}>
                  {p.players?.first_name} {p.players?.last_name}
                </span>
                <HeatBadge heat={ppmToHeat(p.momentum_ppm)} />
              </div>
            ))}
          </div>
          <div className="mt-3">
            <Link href="/hot" className="text-sm font-semibold hover:underline" style={{ color: 'var(--heat)' }}>See the full board &rarr;</Link>
          </div>
        </section>
      )}

      {/* TRUST */}
      {accuracyPct !== null && (
        <section className="mb-14 rounded-xl border p-6 md:p-8 text-center" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
          <span className="text-4xl md:text-5xl font-bold font-editorial" style={{ color: 'var(--heat)' }}>{accuracyPct}%</span>
          <p className="mt-2 text-sm" style={{ color: 'var(--text)' }}>
            Model {activeModel} win-prediction accuracy, tracked publicly, updated every day. We don&apos;t hide the misses.
          </p>
          <Link href="/accuracy" className="mt-3 inline-block text-sm font-semibold hover:underline" style={{ color: 'var(--heat)' }}>See the full accuracy history &rarr;</Link>
        </section>
      )}

      {/* FINAL CTA */}
      <section className="mb-8 text-center py-10 rounded-2xl" style={{ background: 'linear-gradient(180deg, rgba(255,90,36,0.08) 0%, transparent 100%)' }}>
        <h2 className="text-2xl md:text-3xl font-bold font-editorial" style={{ color: 'var(--text-bright)' }}>
          Every game. Every player. <span style={{ color: 'var(--heat)' }}>One number.</span>
        </h2>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity"
            style={{ background: 'var(--heat)', color: '#0a0b0f' }}
          >
            Open momentum. &rarr;
          </Link>
        </div>
      </section>

      <footer className="pt-6 pb-4 flex items-center justify-center gap-2 flex-wrap text-xs" style={{ borderTop: '1px solid var(--border)', color: 'var(--text)', opacity: 0.4 }}>
        <span>DATA</span>
        {['NHL Stats API', 'MoneyPuck', 'Natural Stat Trick'].map(s => (
          <span key={s}>&middot; {s}</span>
        ))}
      </footer>
    </div>
  );
}
