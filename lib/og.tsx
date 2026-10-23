// Share images (1200×630) for social posts. Satori rules: every element with
// more than one child needs display:flex, and no CSS variables — hence literals.
import { ImageResponse } from 'next/og';
import { gameView } from '@/lib/game-state';
import { lastName, type CardSide, type GameCardData } from '@/lib/game-card';
import { heatColor } from '@/lib/heat';
import { teamColor, teamLogo } from '@/lib/team-colors';

export const OG_SIZE = { width: 1200, height: 630 };
const BG = '#0a0b0f', CARD = '#111318', BORDER = '#1d2235', TEXT = '#e2e8f0', DIM = '#8a94a6', HEAT = '#ff5a24', RISE = '#00e5a0', COLD = '#3a88ff';

// Social crawlers re-fetch often; the CDN serves the image for 30 min.
const CACHE = { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=86400' };

// Inter (regular/bold/extra-bold) for real weights; the default font has none
// and no ✓/✗ glyphs. Loaded once per server instance; if the CDN is unreachable
// the image still renders with the default font.
type OgFont = { name: string; data: ArrayBuffer; weight: 400 | 700 | 800; style: 'normal' };
let fontsPromise: Promise<OgFont[]> | null = null;
function loadFonts(): Promise<OgFont[]> {
  fontsPromise ??= Promise.all(([400, 700, 800] as const).map(async weight => {
    const res = await fetch(`https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-${weight}-normal.woff`);
    if (!res.ok) throw new Error(`font ${res.status}`);
    return { name: 'Inter', data: await res.arrayBuffer(), weight, style: 'normal' as const };
  })).catch(() => { fontsPromise = null; return []; });
  return fontsPromise;
}
async function opts() {
  const fonts = await loadFonts();
  return { ...OG_SIZE, headers: CACHE, ...(fonts.length ? { fonts } : {}) };
}

// components/ds/HeatPulseMark.tsx, with literal colours for Satori.
function Mark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M4 30 L12 30 L15 22 L19 36 L23 14 L27 28 L30 24 C32 22 35 22 36 26 C37 30 35 34 30 36 C28 37 26 37 24 36"
        stroke={HEAT} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="36" cy="26" r="2.5" fill={HEAT} />
    </svg>
  );
}

function Wordmark({ size }: { size: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', fontSize: size, letterSpacing: -size / 30, color: TEXT, fontWeight: 800 }}>
      <Mark size={size * 1.25} />
      <div style={{ display: 'flex', marginLeft: size / 4 }}>momentum<span style={{ color: HEAT }}>.</span></div>
    </div>
  );
}

function Frame({ children, kicker }: { children: React.ReactNode; kicker: string }) {
  return (
    <div style={{ width: 1200, height: 630, background: BG, display: 'flex', flexDirection: 'column', padding: '44px 56px', fontFamily: 'Inter, sans-serif', color: TEXT }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 22, letterSpacing: 3, color: HEAT, fontWeight: 700 }}>
        <div style={{ display: 'flex' }}>{kicker}</div>
        <Wordmark size={30} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, marginTop: 28 }}>{children}</div>
    </div>
  );
}

function Face({ src, team, size }: { src: string | null; team: string; size: number }) {
  return src
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={src} width={size} height={size} style={{ borderRadius: size / 2, background: teamColor(team).bg }} alt="" />
    : <div style={{ display: 'flex', width: size, height: size, borderRadius: size / 2, background: teamColor(team).bg }} />;
}

function Side({ s, g, other }: { s: CardSide; g: GameCardData; other: CardSide }) {
  const scored = gameView(g.state) !== 'upcoming' && s.score != null && other.score != null;
  const lit = !scored || s.score! > other.score!;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, background: CARD, border: `2px solid ${BORDER}`, borderRadius: 24, padding: '28px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={teamLogo(s.abbrev)} width={84} height={84} alt="" />
        <div style={{ display: 'flex', flex: 1, marginLeft: 20, fontSize: 38, fontWeight: 800, color: lit ? TEXT : DIM }}>{teamColor(s.abbrev).name}</div>
        {scored && <div style={{ display: 'flex', fontSize: 84, fontWeight: 800, color: lit ? TEXT : DIM }}>{s.score}</div>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 22 }}>
        {s.players.slice(0, 3).map(p => (
          <div key={p.playerId} style={{ display: 'flex', alignItems: 'center', marginTop: 12 }}>
            <Face src={p.photo} team={s.abbrev} size={52} />
            <div style={{ display: 'flex', flex: 1, marginLeft: 16, fontSize: 28, fontWeight: 600, color: TEXT }}>
              {lastName(p.name)}{p.stat ? <span style={{ marginLeft: 12, color: DIM, fontSize: 22 }}>{p.stat}</span> : null}
            </div>
            {p.heat != null && <div style={{ display: 'flex', fontSize: 30, fontWeight: 800, color: heatColor(p.heat) }}>{p.heat}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

export async function gameImage(g: GameCardData, dateLabel: string): Promise<ImageResponse> {
  const view = gameView(g.state);
  const pickLine = !g.pick ? null
    : view === 'final' && g.pickResult
      ? { text: `${g.pickResult === 'hit' ? 'PICK HIT' : 'PICK MISS'} · ${g.pick.abbrev} ${g.pick.pct}%`, color: g.pickResult === 'hit' ? RISE : COLD }
      : { text: `OUR PICK · ${g.pick.abbrev} ${g.pick.pct}%`, color: HEAT };
  return new ImageResponse(
    <Frame kicker={`${view === 'final' ? 'FINAL' : view === 'live' ? 'LIVE' : 'TONIGHT'} · ${dateLabel.toUpperCase()}`}>
      <div style={{ display: 'flex', gap: 24, flex: 1 }}>
        <Side s={g.away} g={g} other={g.home} />
        <Side s={g.home} g={g} other={g.away} />
      </div>
      {pickLine && <div style={{ display: 'flex', marginTop: 22, fontSize: 28, fontWeight: 800, letterSpacing: 2, color: pickLine.color }}>{pickLine.text}</div>}
    </Frame>,
    await opts(),
  );
}

export type ListRow = { photo?: string | null; team: string; label: string; sub?: string; value: string; valueColor?: string };

export async function listImage(kicker: string, title: string, rows: ListRow[]): Promise<ImageResponse> {
  return new ImageResponse(
    <Frame kicker={kicker}>
      <div style={{ display: 'flex', fontSize: 48, fontWeight: 800, letterSpacing: -1.5 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 10 }}>
        {rows.slice(0, 6).map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', marginTop: 10, background: CARD, border: `2px solid ${BORDER}`, borderRadius: 16, padding: '7px 22px' }}>
            {r.photo !== undefined
              ? <Face src={r.photo} team={r.team} size={44} />
              // eslint-disable-next-line @next/next/no-img-element
              : <img src={teamLogo(r.team)} width={44} height={44} alt="" />}
            <div style={{ display: 'flex', flex: 1, marginLeft: 18, fontSize: 30, fontWeight: 700 }}>
              {r.label}{r.sub ? <span style={{ marginLeft: 14, color: DIM, fontSize: 24 }}>{r.sub}</span> : null}
            </div>
            <div style={{ display: 'flex', fontSize: 32, fontWeight: 800, color: r.valueColor ?? HEAT }}>{r.value}</div>
          </div>
        ))}
      </div>
    </Frame>,
    await opts(),
  );
}

export async function fallbackImage(kicker: string, title: string): Promise<ImageResponse> {
  return new ImageResponse(
    <Frame kicker={kicker}><div style={{ display: 'flex', fontSize: 64, fontWeight: 800 }}>{title}</div></Frame>,
    await opts(),
  );
}

export type BrandLeader = { name: string; team: string; photo: string | null; heat: number };

// The site's default share image (homepage and every page without its own):
// brand, the promise, and who is hottest right now. Brand-only without data.
export async function brandImage(leaders: BrandLeader[]): Promise<ImageResponse> {
  const [first, ...rest] = leaders;
  return new ImageResponse(
    <div style={{ width: 1200, height: 630, display: 'flex', background: `linear-gradient(105deg, ${BG} 0%, ${BG} 45%, #2a130c 100%)`, padding: '56px 64px', fontFamily: 'Inter, sans-serif', color: TEXT }}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
        <Wordmark size={40} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 22, letterSpacing: 3, color: HEAT, fontWeight: 700 }}>NHL · HEAT INDEX</div>
          <div style={{ display: 'flex', flexDirection: 'column', fontSize: first ? 64 : 80, fontWeight: 800, letterSpacing: -2.5, lineHeight: 1.02, marginTop: 14 }}>
            <div style={{ display: 'flex' }}>Who&apos;s hot in the</div>
            <div style={{ display: 'flex' }}>NHL right <span style={{ color: HEAT, marginLeft: 18 }}>now.</span></div>
          </div>
          <div style={{ display: 'flex', fontSize: 28, color: DIM, marginTop: 20 }}>Every player&apos;s form in one number, 0–100.</div>
        </div>
      </div>
      {!first && <div style={{ display: 'flex', alignItems: 'center', marginLeft: 40 }}><Mark size={340} /></div>}
      {first && (
        <div style={{ display: 'flex', flexDirection: 'column', width: 380, marginLeft: 40, justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: CARD, border: `2px solid rgba(255,90,36,0.45)`, borderRadius: 28, padding: '30px 24px 26px' }}>
            <div style={{ display: 'flex', fontSize: 18, letterSpacing: 2.5, color: HEAT, fontWeight: 700 }}>#1 RIGHT NOW</div>
            <div style={{ display: 'flex', marginTop: 18 }}><Face src={first.photo} team={first.team} size={132} /></div>
            <div style={{ display: 'flex', fontSize: 34, fontWeight: 800, marginTop: 16, letterSpacing: -1 }}>{first.name}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 4 }}>
              <div style={{ display: 'flex', fontSize: 22, color: DIM, marginRight: 14 }}>{first.team} · HEAT</div>
              <div style={{ display: 'flex', fontSize: 72, fontWeight: 800, color: heatColor(first.heat) }}>{first.heat}</div>
            </div>
          </div>
          {rest.slice(0, 2).map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', marginTop: 12, background: CARD, border: `2px solid ${BORDER}`, borderRadius: 18, padding: '8px 20px' }}>
              <Face src={r.photo} team={r.team} size={44} />
              <div style={{ display: 'flex', flex: 1, marginLeft: 14, fontSize: 24, fontWeight: 700 }}>{r.name}</div>
              <div style={{ display: 'flex', fontSize: 30, fontWeight: 800, color: heatColor(r.heat) }}>{r.heat}</div>
            </div>
          ))}
        </div>
      )}
    </div>,
    await opts(),
  );
}

export { heatColor };
