import { ImageResponse } from 'next/og';
import { fetchMatch } from '@/lib/data';
import { ppmToHeat } from '@/lib/heat';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Game matchup card';

// Dark split-background colors — mirrors TonightSection.TEAM_COLORS (not imported
// because that file has 'use client'; constants are safe to duplicate here).
const TEAM_COLORS: Record<string, string> = {
  ANA: '#b5895a', ARI: '#8c2633', UTA: '#1a5276',
  BOS: '#8b6914', BUF: '#003087', CGY: '#8c1c1c',
  CAR: '#7a0000', CHI: '#7a0618', COL: '#4a1726',
  CBJ: '#002654', DAL: '#004a30', DET: '#7a0a14',
  EDM: '#8b3000', FLA: '#041e42', LAK: '#111111',
  MIN: '#0f3022', MTL: '#6e1220', NSH: '#041e42',
  NJD: '#7a0a14', NYI: '#003a6b', NYR: '#00277a',
  OTT: '#7a5c1a', PHI: '#8b2e00', PIT: '#1a1a1a',
  SEA: '#001628', SJS: '#004a50', STL: '#001e6b',
  TBL: '#001a5c', TOR: '#001845', VAN: '#00421e',
  VGK: '#252f34', WSH: '#041e42', WPG: '#041e42',
};

// Hardcoded brand palette — CSS variables are not available inside ImageResponse.
const BG        = '#0a0b0f';
const BG_CARD   = '#111318';
const HEAT      = '#ff5a24';
const TEXT_DIM  = '#a0aec0';
const TEXT      = '#e2e8f0';
const RISE      = '#00e5a0';
const RED       = '#ef4444';
const BORDER    = '#1d2235';

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default async function Image({
  params,
}: {
  params: Promise<{ id: string; slug: string }>;
}) {
  const { id } = await params;

  // Fetch game data — same fetcher the page uses.
  let game: ReturnType<typeof fetchMatch> extends Promise<infer T> ? T : never;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    game = await fetchMatch(id) as any;
  } catch {
    return new ImageResponse(
      <div
        style={{
          width: 1200, height: 630,
          background: BG,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <span style={{ color: TEXT_DIM, fontSize: 32 }}>momentum.</span>
      </div>,
      { width: 1200, height: 630 },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = game as any;
  const liveData = g.liveData as Record<string, unknown> | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const live = liveData as any;

  const homeAbbrev: string = live?.homeTeam?.abbrev ?? g.game?.home_team?.abbrev ?? '?';
  const awayAbbrev: string = live?.awayTeam?.abbrev ?? g.game?.away_team?.abbrev ?? '?';
  const homeName: string   = live?.homeTeam?.name?.default ?? g.game?.home_team?.name ?? homeAbbrev;
  const awayName: string   = live?.awayTeam?.name?.default ?? g.game?.away_team?.name ?? awayAbbrev;
  const homeScore          = live?.homeTeam?.score ?? g.game?.home_score ?? null;
  const awayScore          = live?.awayTeam?.score ?? g.game?.away_score ?? null;
  const gameState: string  = live?.gameState ?? g.game?.game_state ?? 'FUT';
  const isFinal            = gameState === 'FINAL' || gameState === 'OFF';
  const isLive             = gameState === 'LIVE' || gameState === 'CRIT';
  const gameDate: string   = g.game?.game_date ?? '';
  const dateLabel          = gameDate
    ? new Date(gameDate + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  // Prediction
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prediction = (g.predictions as any[])?.[0] ?? null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const outcome    = prediction?.prediction_outcomes?.[0] ?? null;
  const homeWinPct = prediction ? Math.round((prediction.home_win_probability ?? 0.5) * 100) : null;
  const awayWinPct = prediction ? Math.round((prediction.away_win_probability ?? 0.5) * 100) : null;
  const favoredAbbrev = (homeWinPct ?? 50) >= (awayWinPct ?? 50) ? homeAbbrev : awayAbbrev;
  const favoredPct    = Math.max(homeWinPct ?? 50, awayWinPct ?? 50);

  // Top heat player from skater snapshots
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const snapshots = (g.snapshots as any[]) ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const homeSnap  = snapshots.find((s: any) => s.is_home);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const awaySnap  = snapshots.find((s: any) => !s.is_home);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const homeSkaters: any[] = homeSnap?.skater_snapshots ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const awaySkaters: any[] = awaySnap?.skater_snapshots ?? [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allSkaters = [...awaySkaters.map((s: any) => ({ ...s, teamAbbrev: awayAbbrev })), ...homeSkaters.map((s: any) => ({ ...s, teamAbbrev: homeAbbrev }))];
  const topPlayer = allSkaters
    .map(s => ({ ...s, heat: ppmToHeat(s.momentumPpm ?? s.compositePpm) }))
    .sort((a, b) => b.heat - a.heat)[0] ?? null;

  // Team colors
  const awayColor = TEAM_COLORS[awayAbbrev] ?? '#1a1a2e';
  const homeColor = TEAM_COLORS[homeAbbrev] ?? '#1a2e1a';

  return new ImageResponse(
    <div
      style={{
        width: 1200,
        height: 630,
        background: BG,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Away team color wash — left side */}
      <div
        style={{
          position: 'absolute', top: 0, left: 0, width: 500, height: '100%',
          background: `linear-gradient(to right, ${hexToRgba(awayColor, 0.55)} 0%, ${hexToRgba(awayColor, 0)} 100%)`,
        }}
      />
      {/* Home team color wash — right side */}
      <div
        style={{
          position: 'absolute', top: 0, right: 0, width: 500, height: '100%',
          background: `linear-gradient(to left, ${hexToRgba(homeColor, 0.55)} 0%, ${hexToRgba(homeColor, 0)} 100%)`,
        }}
      />

      {/* Top accent bar — two-color split */}
      <div style={{ display: 'flex', width: '100%', height: 5, flexShrink: 0 }}>
        <div style={{ flex: 1, background: awayColor }} />
        <div style={{ flex: 1, background: homeColor }} />
      </div>

      {/* Main content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 80px',
          gap: 20,
        }}
      >
        {/* Date label */}
        {dateLabel ? (
          <div style={{ color: TEXT_DIM, fontSize: 18, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {dateLabel}
          </div>
        ) : null}

        {/* Matchup row: AWAY  @  HOME */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 32,
            width: '100%',
          }}
        >
          {/* Away team */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flex: 1 }}>
            <div style={{ color: TEXT, fontSize: 96, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.04em' }}>
              {awayAbbrev}
            </div>
            <div style={{ color: TEXT_DIM, fontSize: 20, fontWeight: 600, letterSpacing: '0.02em', textAlign: 'right' }}>
              {awayName}
            </div>
          </div>

          {/* Center divider */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              flexShrink: 0,
            }}
          >
            {isFinal && homeScore !== null && awayScore !== null ? (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                <span style={{ color: awayScore > homeScore ? TEXT : TEXT_DIM, fontSize: 80, fontWeight: 900, lineHeight: 1 }}>{awayScore}</span>
                <span style={{ color: BORDER, fontSize: 56, fontWeight: 300, lineHeight: 1 }}>–</span>
                <span style={{ color: homeScore > awayScore ? TEXT : TEXT_DIM, fontSize: 80, fontWeight: 900, lineHeight: 1 }}>{homeScore}</span>
              </div>
            ) : isLive && homeScore !== null && awayScore !== null ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ color: HEAT, fontSize: 16, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>LIVE</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                  <span style={{ color: TEXT, fontSize: 72, fontWeight: 900, lineHeight: 1 }}>{awayScore}</span>
                  <span style={{ color: TEXT_DIM, fontSize: 50, fontWeight: 300, lineHeight: 1 }}>–</span>
                  <span style={{ color: TEXT, fontSize: 72, fontWeight: 900, lineHeight: 1 }}>{homeScore}</span>
                </div>
              </div>
            ) : (
              <div style={{ color: TEXT_DIM, fontSize: 52, fontWeight: 300, lineHeight: 1 }}>@</div>
            )}
          </div>

          {/* Home team */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1 }}>
            <div style={{ color: TEXT, fontSize: 96, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.04em' }}>
              {homeAbbrev}
            </div>
            <div style={{ color: TEXT_DIM, fontSize: 20, fontWeight: 600, letterSpacing: '0.02em' }}>
              {homeName}
            </div>
          </div>
        </div>

        {/* Sub-content row: prediction result / probability / top player */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, flexWrap: 'nowrap' }}>
          {/* Prediction hit/miss badge (FINAL only) */}
          {isFinal && outcome !== null && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 18px',
                borderRadius: 8,
                background: outcome.correct_winner ? 'rgba(0,229,160,0.15)' : 'rgba(239,68,68,0.12)',
                border: `1px solid ${outcome.correct_winner ? 'rgba(0,229,160,0.4)' : 'rgba(239,68,68,0.35)'}`,
              }}
            >
              <span style={{ fontSize: 20, color: outcome.correct_winner ? RISE : RED }}>
                {outcome.correct_winner ? 'V' : 'X'}
              </span>
              <span style={{ color: outcome.correct_winner ? RISE : RED, fontSize: 15, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                PICK {outcome.correct_winner ? 'HIT' : 'MISS'}
              </span>
            </div>
          )}

          {/* Win probability (upcoming / pre-game) */}
          {!isFinal && !isLive && homeWinPct !== null && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 18px',
                borderRadius: 8,
                background: 'rgba(255,90,36,0.12)',
                border: '1px solid rgba(255,90,36,0.3)',
              }}
            >
              <span style={{ color: HEAT, fontSize: 26, fontWeight: 900 }}>{favoredPct}%</span>
              <span style={{ color: TEXT_DIM, fontSize: 15, fontWeight: 600 }}>{favoredAbbrev} favored</span>
            </div>
          )}

          {/* Top heat player badge */}
          {topPlayer && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '8px 18px',
                borderRadius: 8,
                background: BG_CARD,
                border: `1px solid ${BORDER}`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 44,
                  height: 44,
                  borderRadius: 6,
                  background: HEAT,
                  color: '#fff',
                  fontSize: 18,
                  fontWeight: 900,
                  flexShrink: 0,
                }}
              >
                {topPlayer.heat}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ color: TEXT, fontSize: 16, fontWeight: 700 }}>{topPlayer.playerName ?? ''}</span>
                <span style={{ color: TEXT_DIM, fontSize: 13, fontWeight: 500 }}>
                  {topPlayer.teamAbbrev} · Heat
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar — momentum. watermark */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '0 36px',
          height: 52,
          borderTop: `1px solid ${BORDER}`,
          flexShrink: 0,
        }}
      >
        <span style={{ color: TEXT_DIM, fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', opacity: 0.55 }}>
          momentum<span style={{ color: HEAT }}>.</span>
        </span>
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}
