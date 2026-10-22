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

function Frame({ children, kicker }: { children: React.ReactNode; kicker: string }) {
  return (
    <div style={{ width: 1200, height: 630, background: BG, display: 'flex', flexDirection: 'column', padding: '44px 56px', fontFamily: 'Inter, sans-serif', color: TEXT }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 22, letterSpacing: 3, color: HEAT, fontWeight: 700 }}>
        <div style={{ display: 'flex' }}>{kicker}</div>
        <div style={{ display: 'flex', fontSize: 30, letterSpacing: -1, color: TEXT, fontWeight: 800 }}>momentum<span style={{ color: HEAT }}>.</span></div>
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

export { heatColor };
