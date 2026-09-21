import type { Metadata } from 'next';
import Link from 'next/link';
import HeatGrid from '@/components/dashboard/HeatGrid';
import BreakoutWatch from '@/components/dashboard/BreakoutWatch';
import CoolingOff from '@/components/dashboard/CoolingOff';
import HeatCircle from '@/components/ui/HeatCircle';
import { fetchRankings, fetchGoalieRankings, fetchNewcomerWatch, fetchSeasonPhase } from '@/lib/data';
import { ppmToHeat, heatBg, heatBorderColor, heatColor } from '@/lib/heat';
import { playerUrl } from '@/lib/urls';

export const revalidate = 120;

export const metadata: Metadata = {
  title: "Who's Hot",
  description: 'The hottest players in the NHL right now — skaters, goalies, and breakout newcomers ranked by 5-game momentum.',
  openGraph: {
    title: "Who's Hot — momentum.",
    description: 'Skaters, goalies and fresh faces ranked by 5-game momentum score.',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Who's Hot — momentum.",
    description: 'The hottest players in the NHL right now. Updated daily.',
  },
};

export default async function HotPage() {
  const [data, goalies, newcomers, seasonPhase] = await Promise.all([
    fetchRankings().catch(() => null),
    fetchGoalieRankings().catch(() => []),
    fetchNewcomerWatch().catch(() => []),
    fetchSeasonPhase().catch(() => ({ isPreseason: false })),
  ]);
  const seasonHasStarted = !seasonPhase.isPreseason;

  const skaters = data?.momentumLeaders?.skaters ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const breakoutPlayers: any[] = data?.breakoutWatch ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const coolingPlayers: any[] = data?.coolingWatch ?? [];

  const lastUpdated = breakoutPlayers[0]?.calculated_at ?? null;

  // Hero player — #1 by Heat
  const hero = skaters.length > 0 ? skaters[0] : null;
  const heroHeat = hero ? ppmToHeat(hero.momentum_ppm) : 0;
  const heroSurge =
    hero && hero.season_ppm > 0
      ? Math.round(((hero.momentum_ppm - hero.season_ppm) / hero.season_ppm) * 100)
      : null;
  const restSkaters = skaters.slice(1, 9);

  return (
    <div className="max-w-5xl mx-auto pb-20 md:pb-0">
      {/* Page header */}
      <div className="mb-6">
        <p style={{
          fontFamily: 'var(--font-geist-mono), monospace',
          fontSize: '0.69rem',
          color: 'var(--heat)',
          fontWeight: 700,
          letterSpacing: '0.12em',
          marginBottom: '0.5rem',
          textTransform: 'uppercase',
        }}>
          HEAT MAP · LIVE
        </p>
        <h1 style={{
          fontFamily: 'var(--font-geist-sans), sans-serif',
          fontWeight: 800,
          fontSize: 'clamp(1.875rem, 5vw, 2.75rem)',
          letterSpacing: '-0.04em',
          lineHeight: 1,
          color: 'var(--text-bright)',
        }}>
          <span style={{ color: 'var(--heat)' }}>Burning </span>
          <span>right now.</span>
        </h1>
        <p className="text-sm mt-2" style={{ color: 'var(--text)' }}>
          Players above their season pace. Updated every hour.
        </p>
      </div>

      {/* ── Hero section: #1 player featured + ranked 2-9 ── */}
      {hero && (
        <div className="mb-8">
          {/* Desktop: hero card left, compact ranked list right */}
          <div
            className="hidden md:grid gap-5"
            style={{ gridTemplateColumns: '1.4fr 1fr' }}
          >
            {/* #1 hero card */}
            <Link
              href={playerUrl(hero.player_id, hero.players.first_name, hero.players.last_name)}
              className="relative rounded-2xl block hover:opacity-95 transition-opacity overflow-hidden"
              style={{
                background: `linear-gradient(155deg, ${heatBg(heroHeat)}cc 0%, var(--bg-card) 50%)`,
                border: `1px solid ${heatBorderColor(heroHeat)}`,
                boxShadow: `0 0 40px rgba(255,90,36,0.18)`,
                padding: 32,
              }}
            >
              {/* #1 badge */}
              <div
                style={{
                  position: 'absolute', top: 24, right: 24,
                  fontFamily: 'var(--font-geist-mono), monospace',
                  fontSize: '0.625rem', color: 'var(--heat)', fontWeight: 700,
                  letterSpacing: '0.12em', padding: '4px 10px',
                  background: 'var(--bg)', borderRadius: 999,
                  border: '1px solid rgba(255,90,36,0.4)',
                }}
              >
                #1 · HOTTEST RIGHT NOW
              </div>

              {/* Team logo */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://assets.nhle.com/logos/nhl/svg/${hero.players.teams.abbrev}_light.svg`}
                alt={hero.players.teams.abbrev}
                style={{ width: 42, height: 42 }}
              />

              {/* Player name */}
              <div
                style={{
                  fontFamily: 'var(--font-geist-sans), sans-serif',
                  fontWeight: 800,
                  fontSize: 'clamp(2.5rem, 4vw, 3.5rem)',
                  letterSpacing: '-0.05em',
                  lineHeight: 1,
                  marginTop: 18,
                  marginBottom: 8,
                }}
              >
                <span style={{ color: 'var(--text-bright)' }}>
                  {hero.players.first_name}{' '}
                </span>
                <span style={{ color: 'var(--heat)' }}>
                  {hero.players.last_name}
                </span>
              </div>

              {/* Position + team */}
              <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 24 }}>
                {hero.players.position_code} · {hero.players.teams.abbrev}
              </div>

              {/* Heat circle + context sentence */}
              <div className="flex items-center gap-5">
                <HeatCircle heat={heroHeat} size={110} label="HEAT" />
                <p style={{ flex: 1, fontSize: 14, color: 'var(--text)', lineHeight: 1.55 }}>
                  {heroSurge !== null && heroSurge > 0
                    ? `Running ${heroSurge}% above their season pace over the last 5 games. Heat score ${heroHeat} — leading the league right now.`
                    : `Heat score ${heroHeat} — leading the league right now.`}
                </p>
              </div>
            </Link>

            {/* Ranked 2–9 compact list */}
            <div>
              <p
                style={{
                  fontFamily: 'var(--font-geist-mono), monospace',
                  fontSize: '0.69rem',
                  color: 'var(--text)',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  marginBottom: 10,
                  textTransform: 'uppercase',
                }}
              >
                RANKED 2–9
              </p>
              <div className="flex flex-col gap-2">
                {restSkaters.map((p, i) => {
                  const ph = ppmToHeat(p.momentum_ppm);
                  const bc = heatBorderColor(ph);
                  const recentSub = p.momentum_goals != null
                    ? `${p.momentum_goals}G · ${p.momentum_assists}A L5`
                    : null;
                  return (
                    <Link
                      key={p.player_id}
                      href={playerUrl(p.player_id, p.players.first_name, p.players.last_name)}
                      className="hover:opacity-80 transition-opacity"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '11px 14px',
                        background: 'var(--bg-card)',
                        borderRadius: 10,
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderLeft: `3px solid ${bc}`,
                        textDecoration: 'none',
                      }}
                    >
                      <span
                        style={{
                          width: 18, flexShrink: 0,
                          fontFamily: 'var(--font-geist-mono), monospace',
                          fontSize: 11,
                          color: 'var(--text)',
                          fontWeight: 700,
                        }}
                      >
                        {i + 2}
                      </span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://assets.nhle.com/logos/nhl/svg/${p.players.teams.abbrev}_light.svg`}
                        alt={p.players.teams.abbrev}
                        style={{ width: 26, height: 26, flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-bright)', lineHeight: 1.2 }}>
                          {p.players.first_name[0]}. {p.players.last_name}
                        </div>
                        {recentSub && (
                          <div style={{ fontSize: 11, color: 'var(--text)' }}>{recentSub}</div>
                        )}
                      </div>
                      <span
                        style={{
                          fontFamily: 'var(--font-geist-mono), monospace',
                          fontSize: 13, fontWeight: 800,
                          color: heatColor(ph),
                          padding: '3px 8px',
                          borderRadius: 4,
                          background: `${bc}18`,
                          border: `1px solid ${bc}55`,
                          flexShrink: 0,
                        }}
                      >
                        {ph}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Mobile: hero card only */}
          <div className="md:hidden">
            <Link
              href={playerUrl(hero.player_id, hero.players.first_name, hero.players.last_name)}
              className="relative rounded-2xl block hover:opacity-95 transition-opacity overflow-hidden"
              style={{
                background: `linear-gradient(155deg, ${heatBg(heroHeat)}cc 0%, var(--bg-card) 60%)`,
                border: `1px solid ${heatBorderColor(heroHeat)}`,
                boxShadow: `0 0 20px rgba(255,90,36,0.18)`,
                padding: 18,
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span
                  style={{
                    fontFamily: 'var(--font-geist-mono), monospace',
                    fontSize: 9,
                    color: 'var(--heat)',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    padding: '3px 8px',
                    background: 'var(--bg)',
                    borderRadius: 999,
                    border: '1px solid rgba(255,90,36,0.4)',
                  }}
                >
                  #1 HOTTEST
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://assets.nhle.com/logos/nhl/svg/${hero.players.teams.abbrev}_light.svg`}
                  alt={hero.players.teams.abbrev}
                  style={{ width: 24, height: 24 }}
                />
              </div>

              <div
                style={{
                  fontFamily: 'var(--font-geist-sans), sans-serif',
                  fontWeight: 800,
                  fontSize: 30,
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                  marginBottom: 4,
                }}
              >
                <span style={{ color: 'var(--text-bright)' }}>
                  {hero.players.first_name}{' '}
                </span>
                <span style={{ color: 'var(--heat)' }}>
                  {hero.players.last_name}
                </span>
              </div>

              <div style={{ fontSize: 11, color: 'var(--text)', marginBottom: 14 }}>
                {hero.players.position_code} · {hero.players.teams.abbrev}
              </div>

              <div className="flex items-center gap-4">
                <HeatCircle heat={heroHeat} size={70} label="HEAT" />
                <p style={{ flex: 1, fontSize: 12, color: 'var(--text)', lineHeight: 1.5 }}>
                  {heroSurge !== null && heroSurge > 0
                    ? `${heroSurge}% above season pace. Heat score ${heroHeat}.`
                    : `Heat score ${heroHeat} — top right now.`}
                </p>
              </div>
            </Link>
          </div>
        </div>
      )}

      <HeatGrid
        skaters={skaters}
        goalies={goalies}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        newcomers={newcomers as any[]}
        limit={16}
      />

      <div className="mt-8 flex flex-col gap-6">
        <BreakoutWatch
          players={breakoutPlayers}
          lastUpdated={lastUpdated}
          seasonHasStarted={seasonHasStarted}
        />
        <CoolingOff
          players={coolingPlayers}
          lastUpdated={lastUpdated}
          seasonHasStarted={seasonHasStarted}
        />
      </div>
    </div>
  );
}
