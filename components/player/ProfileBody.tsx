import { HeatPill, SectionHeading, TeamChip } from '@/components/ds';
import type { Chip, GameRow, Tile, Tone, VsRow } from '@/lib/player-profile';
import { PlayerHero, type HeroProps } from './PlayerHero';

const MONO = { fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' } as const;
const tone = (t?: Tone) =>
  ({ heat: 'var(--heat)', rise: 'var(--rise)', gold: 'var(--gold)', red: 'var(--red)', cold: 'var(--cold)', text: 'var(--text-bright)' } as const)[t ?? 'text'];
const card = { background: 'var(--bg-card)', borderColor: 'var(--border)' } as const;

export type ProfileView = {
  hero: HeroProps;
  series: { date: string; heat: number }[];
  seasonAvgHeat: number | null;
  chips: Chip[];
  perfEval: React.ReactNode;
  last5: Tile[];
  gameLog: GameRow[];
  seasonLabel: string;
  seasonGames: number;
  seasonTiles: Tile[];
  radar: { label: string; value: number }[];
  vsRows: VsRow[];
};

// Heat over time (design FORM TRACKER): area + line, end dot, season-average guide.
function FormTracker({ series, seasonAvgHeat }: { series: ProfileView['series']; seasonAvgHeat: number | null }) {
  const W = 1280, H = 220, pad = 18;
  if (series.length < 2) {
    return <div className="rounded-xl border p-6 text-sm" style={{ ...card, color: 'var(--text-muted)' }}>Not enough games yet for a trend.</div>;
  }
  const x = (i: number) => (i / (series.length - 1)) * W;
  const y = (h: number) => H - pad - (h / 100) * (H - pad * 2);
  const line = series.map((p, i) => `${i ? 'L' : 'M'} ${x(i).toFixed(1)} ${y(p.heat).toFixed(1)}`).join(' ');
  const last = series[series.length - 1];
  const fmt = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  return (
    <div className="rounded-xl border p-4 lg:p-6" style={card}>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-[140px] w-full lg:h-[220px]" preserveAspectRatio="none" aria-label="Heat over time">
        {[0.2, 0.4, 0.6, 0.8].map(f => (
          <line key={f} x1="0" y1={H * f} x2={W} y2={H * f} stroke="var(--border-soft)" strokeWidth="1" strokeDasharray="3 5" />
        ))}
        {seasonAvgHeat != null && (
          <>
            <line x1="0" y1={y(seasonAvgHeat)} x2={W} y2={y(seasonAvgHeat)} stroke="var(--text-muted)" strokeWidth="1" strokeDasharray="6 6" />
            <text x={W - 10} y={y(seasonAvgHeat) - 6} fontSize="12" fill="var(--text-muted)" textAnchor="end" style={MONO}>season avg {seasonAvgHeat}</text>
          </>
        )}
        <path d={`${line} L ${W} ${H} L 0 ${H} Z`} fill="var(--heat)" opacity="0.12" />
        <path d={line} stroke="var(--heat)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <circle cx={x(series.length - 1)} cy={y(last.heat)} r="6" fill="var(--heat)" />
      </svg>
      <div className="mt-3 flex justify-between text-[10px] font-semibold" style={{ ...MONO, color: 'var(--text-muted)' }}>
        <span>{fmt(series[0].date)}</span>
        <span className="font-bold" style={{ color: 'var(--heat)' }}>NOW · {last.heat}</span>
      </div>
    </div>
  );
}

function Tiles({ tiles, cols }: { tiles: Tile[]; cols: string }) {
  return (
    <div className={`grid gap-2.5 ${cols}`}>
      {tiles.map(t => (
        <div key={t.label} className="rounded-[10px] border px-4 py-3.5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-soft)' }}>
          <div className="text-[22px] font-extrabold leading-none" style={{ ...MONO, color: tone(t.tone), letterSpacing: -0.6 }}>{t.value}</div>
          <div className="mt-1.5 text-[9px] font-semibold uppercase lg:text-[10px]" style={{ color: 'var(--text-muted)', letterSpacing: 0.5 }}>{t.label}</div>
        </div>
      ))}
    </div>
  );
}

function GameLog({ rows }: { rows: GameRow[] }) {
  const cols = 'grid grid-cols-[20px_52px_1fr_26px_26px_30px_44px_40px] items-center gap-2';
  const fmt = (d: string) => (d ? new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }) : '');
  return (
    <div className="overflow-hidden rounded-xl border" style={card}>
      <div className={`${cols} border-b px-3.5 py-2.5 text-[9px] font-bold`} style={{ ...MONO, color: 'var(--text-muted)', letterSpacing: 0.8, borderColor: 'var(--border-soft)' }}>
        <span>R</span><span>DATE</span><span>OPP</span><span className="text-right">G</span><span className="text-right">A</span><span className="text-right">+/-</span><span className="text-right">TOI</span><span className="text-right">HEAT</span>
      </div>
      {rows.map((g, i) => (
        <div key={`${g.date}-${i}`} className={`${cols} px-3.5 py-[11px] text-xs`} style={{ borderTop: i ? '1px solid var(--border-soft)' : undefined }}>
          <span className="flex h-[18px] w-[18px] items-center justify-center rounded-[3px] text-[9px] font-extrabold text-white" style={{ background: g.result === 'W' ? 'var(--rise)' : g.result === 'L' ? 'var(--red)' : 'var(--border)' }}>{g.result ?? '–'}</span>
          <span className="text-[11px]" style={{ ...MONO, color: 'var(--text)' }}>{fmt(g.date)}</span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 text-[10px]" style={{ ...MONO, color: 'var(--text-muted)' }}>{g.home ? 'vs' : '@'}</span>
            <TeamChip abbrev={g.opponent} size={22} />
          </span>
          <span className="text-right font-semibold" style={{ ...MONO, color: 'var(--text-bright)' }}>{g.goals}</span>
          <span className="text-right font-semibold" style={{ ...MONO, color: 'var(--text-bright)' }}>{g.assists}</span>
          <span className="text-right font-semibold" style={{ ...MONO, color: g.plusMinus >= 0 ? 'var(--rise)' : 'var(--red)' }}>{g.plusMinus > 0 ? `+${g.plusMinus}` : g.plusMinus}</span>
          <span className="text-right" style={{ ...MONO, color: 'var(--text)' }}>{g.toi}</span>
          <span className="text-right"><HeatPill heat={g.heat} size="sm" /></span>
        </div>
      ))}
    </div>
  );
}

function Radar({ stats, size = 280 }: { stats: ProfileView['radar']; size?: number }) {
  const c = size / 2, r = size / 2 - 52, n = stats.length; // room for axis labels
  const pt = (v: number, i: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [c + Math.cos(a) * r * v, c + Math.sin(a) * r * v] as const;
  };
  const poly = (v: (i: number) => number) => stats.map((_, i) => pt(v(i), i).join(',')).join(' ');
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="max-w-full shrink-0 overflow-visible" aria-label="Performance radar">
      {[0.25, 0.5, 0.75, 1].map(k => <polygon key={k} points={poly(() => k)} fill="none" stroke="var(--border-soft)" />)}
      {stats.map((_, i) => { const [x, y] = pt(1, i); return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke="var(--border-soft)" />; })}
      <polygon points={poly(i => stats[i].value)} fill="var(--heat)" fillOpacity="0.15" stroke="var(--heat)" strokeWidth="2" strokeLinejoin="round" />
      {stats.map((s, i) => { const [x, y] = pt(s.value, i); return <circle key={i} cx={x} cy={y} r="3" fill="var(--heat)" />; })}
      {stats.map((s, i) => {
        const [x, y] = pt(1.2, i);
        const anchor = Math.abs(x - c) < 5 ? 'middle' : x > c ? 'start' : 'end';
        return <text key={s.label} x={x} y={y} fontSize="10" fontWeight="700" fill="var(--text-bright)" textAnchor={anchor} dominantBaseline="middle" style={MONO}>{s.label}</text>;
      })}
    </svg>
  );
}

function VsLeague({ rows }: { rows: VsRow[] }) {
  return (
    <div className="rounded-xl border px-5 py-5 lg:px-7 lg:py-6" style={card}>
      {rows.map(r => {
        const max = Math.max(r.you, r.top ?? 0, r.league) * 1.1 || 1;
        return (
          <div key={r.label} className="mb-[18px]">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-[13px] font-semibold" style={{ color: 'var(--text-bright)' }}>{r.label}</span>
              <span className="text-[13px] font-bold" style={{ ...MONO, color: 'var(--heat)' }}>{r.you}{r.unit}</span>
            </div>
            <div className="relative h-1.5 rounded-[3px]" style={{ background: 'var(--border-soft)' }}>
              <div className="absolute left-0 top-0 h-full rounded-[3px]" style={{ width: `${(r.you / max) * 100}%`, background: 'var(--heat)', boxShadow: '0 0 8px rgba(255, 90, 36, 0.47)' }} />
              <div className="absolute -bottom-[3px] -top-[3px] w-0.5" style={{ left: `${(r.league / max) * 100}%`, background: 'var(--text-muted)' }} />
              {r.top != null && <div className="absolute -bottom-[3px] -top-[3px] w-0.5" style={{ left: `${(r.top / max) * 100}%`, background: 'var(--rise)' }} />}
            </div>
            <div className="mt-1.5 flex justify-between text-[10px]" style={{ ...MONO, color: 'var(--text-muted)' }}>
              <span>League avg <span style={{ color: 'var(--text)' }}>{r.league}{r.unit}</span></span>
              {r.top != null && <span>{r.topLabel} <span style={{ color: 'var(--rise)' }}>{r.top}{r.unit}</span></span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Profile content below the hero (design DesktopPlayerFinal / MobilePlayerFinal).
export function ProfileBody({ view }: { view: ProfileView }) {
  return (
    <div className="flex flex-col gap-8">
      <PlayerHero {...view.hero} />

      {view.hero.heatNote == null && (
        <section>
          <SectionHeading kicker="FORM TRACKER" title="Heat over time." size="feature" />
          <FormTracker series={view.series} seasonAvgHeat={view.seasonAvgHeat} />
        </section>
      )}

      <section>
        <SectionHeading kicker="RECENT FORM · AI" title="What the numbers say." size="feature" />
        <div className="grid grid-cols-1 gap-6 rounded-xl border px-5 py-5 lg:grid-cols-[1fr_280px] lg:gap-8 lg:px-7 lg:py-6" style={card}>
          <div className="min-w-0">{view.perfEval}</div>
          <div className="flex flex-col gap-2.5">
            {view.chips.map(c => (
              <div key={c.label} className="flex justify-between rounded-lg border px-3.5 py-2.5" style={{ background: 'var(--bg)', borderColor: 'var(--border-soft)' }}>
                <span className="text-xs font-semibold uppercase" style={{ ...MONO, color: 'var(--text-muted)', letterSpacing: 0.4 }}>{c.label}</span>
                <span className="text-[13px] font-bold" style={{ color: tone(c.tone) }}>{c.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {(view.last5.length > 0 || view.gameLog.length > 0) && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-6">
          <section>
            <SectionHeading kicker="LAST 5 STATS" title="The hot stretch." />
            <Tiles tiles={view.last5} cols="grid-cols-3" />
          </section>
          <section className="min-w-0">
            <SectionHeading kicker="LAST 5 GAME LOG" title="Game by game." />
            <GameLog rows={view.gameLog} />
          </section>
        </div>
      )}

      <section>
        <SectionHeading
          kicker={`SEASON STATS · ${view.seasonLabel}`}
          title="The full picture."
          size="feature"
          right={<span className="text-[11px]" style={{ ...MONO, color: 'var(--text-muted)' }}>{view.seasonGames} games played</span>}
        />
        <Tiles tiles={view.seasonTiles} cols="grid-cols-3 lg:grid-cols-6" />
      </section>

      {(view.radar.length > 0 || view.vsRows.length > 0) && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-6">
          {view.radar.length > 0 && (
            <section>
              <SectionHeading kicker="PERFORMANCE RADAR" title="Shape of his game." />
              <div className="flex flex-col items-center gap-6 rounded-xl border px-5 py-6 lg:flex-row lg:px-7" style={card}>
                <Radar stats={view.radar} />
                <p className="flex-1 text-xs leading-relaxed" style={{ color: 'var(--text)' }}>
                  Season rates scaled against the league: scoring and playmaking vs the top 5% of skaters, shooting vs a 25% ceiling, plus-minus between the league&apos;s 5th and 95th percentile.
                </p>
              </div>
            </section>
          )}
          {view.vsRows.length > 0 && (
            <section>
              <SectionHeading kicker="VS LEAGUE" title="Where he separates." />
              <VsLeague rows={view.vsRows} />
            </section>
          )}
        </div>
      )}
    </div>
  );
}
