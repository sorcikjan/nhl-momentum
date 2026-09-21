import { ImageResponse } from 'next/og';
import { fetchPlayer } from '@/lib/data';
import { ppmToHeat } from '@/lib/heat';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Player Heat card';

// Dark team background colors — mirrors TEAM_BG_COLORS in the player page and
// TEAM_COLORS in TonightSection. Duplicated here so this server route file
// does not import from a 'use client' component.
const TEAM_BG_COLORS: Record<string, string> = {
  ANA: '#945a2a', ARI: '#8c2633', UTA: '#1a5276',
  BOS: '#8b6914', BUF: '#003087', CGY: '#8c1c1c',
  CAR: '#7a0000', CHI: '#7a0618', COL: '#4a1726',
  CBJ: '#002654', DAL: '#004a30', DET: '#7a0a14',
  EDM: '#1a3060', FLA: '#041e42', LAK: '#333333',
  MIN: '#0f3022', MTL: '#6e1220', NSH: '#1a2a5c',
  NJD: '#7a0a14', NYI: '#003a6b', NYR: '#00277a',
  OTT: '#7a5c1a', PHI: '#8b2e00', PIT: '#1a1a1a',
  SEA: '#001628', SJS: '#004a50', STL: '#001e6b',
  TBL: '#001a5c', TOR: '#001845', VAN: '#00421e',
  VGK: '#252f34', WSH: '#041e42', WPG: '#041e42',
};

// Hardcoded brand palette — CSS variables are unavailable in ImageResponse.
const BG_CARD   = '#111318';
const HEAT      = '#ff5a24';
const TEXT_DIM  = '#a0aec0';
const TEXT      = '#e2e8f0';
const BORDER    = '#1d2235';
const AMBER     = '#f59e0b';
const RISE      = '#00e5a0';
const RED       = '#ef4444';

function heatNumColor(heat: number): string {
  if (heat >= 80) return '#ffffff';
  if (heat >= 60) return HEAT;
  if (heat >= 35) return AMBER;
  return TEXT_DIM;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function heatBgHex(heat: number): string {
  const stops = [
    { h: 0,   r: 10,  g: 11,  b: 15 },
    { h: 20,  r: 28,  g: 14,  b: 6  },
    { h: 40,  r: 52,  g: 22,  b: 10 },
    { h: 60,  r: 100, g: 36,  b: 14 },
    { h: 80,  r: 170, g: 62,  b: 20 },
    { h: 100, r: 255, g: 90,  b: 36 },
  ];
  const clamped = Math.max(0, Math.min(100, heat));
  let lo = stops[0], hi = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (clamped >= stops[i].h && clamped <= stops[i + 1].h) {
      lo = stops[i]; hi = stops[i + 1]; break;
    }
  }
  const t = lo.h === hi.h ? 0 : (clamped - lo.h) / (hi.h - lo.h);
  const r = Math.round(lo.r + (hi.r - lo.r) * t);
  const g = Math.round(lo.g + (hi.g - lo.g) * t);
  const b = Math.round(lo.b + (hi.b - lo.b) * t);
  return `rgb(${r},${g},${b})`;
}

export default async function Image({
  params,
}: {
  params: Promise<{ id: string; slug: string }>;
}) {
  const { id } = await params;

  let data: Awaited<ReturnType<typeof fetchPlayer>> | null = null;
  try {
    data = await fetchPlayer(id);
  } catch {
    // Fallback below
  }

  if (!data?.player) {
    return new ImageResponse(
      <div
        style={{
          width: 1200, height: 630, background: '#0a0b0f',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <span style={{ color: TEXT_DIM, fontSize: 32 }}>momentum.</span>
      </div>,
      { width: 1200, height: 630 },
    );
  }

  const { player, metricTimeline } = data;
  const firstName  = player.first_name ?? '';
  const lastName   = player.last_name ?? '';
  const teamAbbrev = player.teams?.abbrev ?? '';
  const position   = player.position_code ?? '';
  const sweaterNum = player.sweater_number ?? null;

  // Latest snapshot for Heat/energy
  const latestSnap = (metricTimeline?.[metricTimeline.length - 1] ?? {}) as Record<string, unknown>;
  const momPpm     = Number(latestSnap.momentum_ppm ?? 0);
  const heat       = ppmToHeat(momPpm);
  const energyBar  = Number(latestSnap.energy_bar ?? 100);
  const breakoutDelta = Number(latestSnap.breakout_delta ?? 0);

  const energyColor   = energyBar >= 70 ? RISE : energyBar >= 40 ? AMBER : RED;
  const teamBg        = TEAM_BG_COLORS[teamAbbrev] ?? '#111318';
  const heatColor     = heatNumColor(heat);
  const heatCircleBg  = heatBgHex(heat);

  // Season stats
  const seaGoals   = Number(latestSnap.season_goals   ?? 0);
  const seaAssists = Number(latestSnap.season_assists ?? 0);
  const seaGames   = Number(latestSnap.season_games   ?? 0);

  // Derived labels
  const metaLabel = [teamAbbrev, position, sweaterNum !== null ? `#${sweaterNum}` : null]
    .filter(Boolean).join(' · ');
  const seasonLine  = seaGames > 0 ? `${seaGoals}G · ${seaAssists}A · ${seaGoals + seaAssists} pts` : '';
  const deltaLabel  = breakoutDelta !== 0 ? `${breakoutDelta > 0 ? '+' : '-'}${Math.abs(breakoutDelta * 1000).toFixed(1)} PPM trend` : '';

  return new ImageResponse(
    <div
      style={{
        width: 1200,
        height: 630,
        background: teamBg,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Top HEAT accent bar */}
      <div style={{ display: 'flex', width: '100%', height: 5, background: HEAT, flexShrink: 0 }} />

      {/* Main content row */}
      <div
        style={{
          display: 'flex',
          flex: 1,
          padding: '48px 64px 0 64px',
          gap: 64,
          alignItems: 'flex-start',
        }}
      >
        {/* ── Left column: nameplate + stats ── */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 20 }}>

          {/* Team · position · number meta */}
          {metaLabel ? (
            <div
              style={{
                display: 'flex',
                fontSize: 17,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: HEAT,
              }}
            >
              {metaLabel}
            </div>
          ) : null}

          {/* Player name — two lines matching player page convention */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', fontSize: 102, fontWeight: 900, lineHeight: 0.95, letterSpacing: '-0.03em', color: TEXT }}>
              {firstName}
            </div>
            <div style={{ display: 'flex', fontSize: 102, fontWeight: 900, lineHeight: 0.95, letterSpacing: '-0.03em', color: HEAT }}>
              {lastName}.
            </div>
          </div>

          {/* Season stats row */}
          {seasonLine ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 16px',
                  borderRadius: 8,
                  background: 'rgba(0,0,0,0.35)',
                  border: `1px solid ${BORDER}`,
                }}
              >
                <div style={{ display: 'flex', color: TEXT_DIM, fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Season
                </div>
                <div style={{ display: 'flex', color: TEXT, fontSize: 17, fontWeight: 800, letterSpacing: '-0.01em' }}>
                  {seasonLine}
                </div>
              </div>

              {/* Breakout delta badge — only when non-zero */}
              {breakoutDelta !== 0 ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: 8,
                    background: breakoutDelta > 0 ? 'rgba(0,229,160,0.12)' : 'rgba(239,68,68,0.1)',
                    border: `1px solid ${breakoutDelta > 0 ? 'rgba(0,229,160,0.3)' : 'rgba(239,68,68,0.28)'}`,
                  }}
                >
                  <div style={{ display: 'flex', color: breakoutDelta > 0 ? RISE : RED, fontSize: 14, fontWeight: 700 }}>
                    {deltaLabel}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* ── Right column: Heat + Energy ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center', flexShrink: 0 }}>

          {/* Heat circle */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: heatCircleBg,
              border: `4px solid ${hexToRgba(HEAT, Math.max(0.2, heat / 100))}`,
            }}
          >
            <div style={{ display: 'flex', color: heatColor, fontSize: 80, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.04em' }}>
              {String(heat)}
            </div>
            <div style={{ display: 'flex', color: heatColor, fontSize: 14, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.8, paddingTop: 4 }}>
              HEAT
            </div>
          </div>

          {/* Energy card */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              padding: '16px 20px',
              borderRadius: 12,
              background: BG_CARD,
              border: `1px solid ${BORDER}`,
              width: 200,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', color: TEXT_DIM, fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Energy
              </div>
              <div style={{ display: 'flex', color: energyColor, fontSize: 22, fontWeight: 900 }}>
                {String(energyBar)}
              </div>
            </div>
            {/* Track */}
            <div style={{ display: 'flex', width: '100%', height: 6, borderRadius: 3, background: BORDER }}>
              <div style={{ display: 'flex', width: `${energyBar}%`, height: '100%', background: energyColor, borderRadius: 3 }} />
            </div>
          </div>
        </div>
      </div>

      {/* Flex spacer to push bottom bar down */}
      <div style={{ display: 'flex', flex: 1 }} />

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          <div style={{ display: 'flex', color: TEXT_DIM, fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', opacity: 0.55 }}>
            momentum
          </div>
          <div style={{ display: 'flex', color: HEAT, fontSize: 22, fontWeight: 800, opacity: 0.55 }}>
            .
          </div>
        </div>
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}
