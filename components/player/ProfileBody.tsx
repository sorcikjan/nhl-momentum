import { SectionHeading, TeamChip } from '@/components/ds';
import { heatColor } from '@/lib/heat';
import type { Tile, Tone } from '@/lib/player-profile';
import { ordinal, type GameLine, type L5, type L5Key, type RadarAxis, type SeasonRow, type Standing } from '@/lib/profile-context';
import { PlayerHero, type HeroProps } from './PlayerHero';
import { TrendChart, type TrendData } from './TrendChart';

const MONO = { fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' } as const;
const tone = (t?: Tone) =>
  ({ heat: 'var(--heat)', rise: 'var(--rise)', gold: 'var(--gold)', red: 'var(--red)', cold: 'var(--cold)', text: 'var(--text-bright)' } as const)[t ?? 'text'];
const card = { background: 'var(--bg-card)', borderColor: 'var(--border)' } as const;
const TH = 'px-2 py-2.5 text-[10px] font-bold';

const mmss = (min: number) => { const s = Math.round(min * 60); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const signed = (v: number, d = 0) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(d)}`;
const fmtDate = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

export type ProfileView = {
  hero: HeroProps;
  last: string; // surname, for legends
  peers: { one: string; many: string } | null; // skaters only
  scouting: { bio: React.ReactNode; now: React.ReactNode };
  trend: TrendData;
  trendLine: string | null;
  last5: { table: L5 | null; line: string | null; games: GameLine[] }; // skaters
  goalieLast5: Tile[];
  seasonLabel: string;
  seasonGames: number;
  goalieSeason: Tile[];
  stands: Standing[];
  radar: { axes: RadarAxis[]; strong: string[]; weak: string[] } | null;
  seasons: { rows: SeasonRow[]; current: string; pace: string | null; goalie: boolean };
};

function Section({ id, kicker, title, sub, right, children }: { id: string; kicker: string; title: string; sub?: React.ReactNode; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex min-w-0 flex-col">
      <SectionHeading id={id} kicker={kicker} title={title} sub={sub} right={right} size="feature" />
      {children}
    </section>
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

function Scouting({ bio, now }: ProfileView['scouting']) {
  const box = (label: string, body: React.ReactNode) => (
    <div className="rounded-xl border px-5 py-4 lg:px-[22px] lg:py-[18px]" style={card}>
      <div className="mb-2 text-[10px] font-bold" style={{ ...MONO, color: 'var(--text-muted)', letterSpacing: 1.2 }}>{label}</div>
      {body}
    </div>
  );
  return (
    <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
      {box('WHO HE IS · LONG TERM', bio)}
      {box('RIGHT NOW · LAST 5 GAMES', now)}
    </div>
  );
}

// ── Last 5 against his usual and the average at his position ────────────────
const L5_FMT: Record<L5Key, { him: (v: number) => string; base: (v: number) => string }> = {
  g: { him: v => String(v), base: v => v.toFixed(1) },
  a: { him: v => String(v), base: v => v.toFixed(1) },
  pts: { him: v => String(v), base: v => v.toFixed(1) },
  sog: { him: v => String(v), base: v => v.toFixed(0) },
  shPct: { him: v => `${(v * 100).toFixed(1)}%`, base: v => `${(v * 100).toFixed(1)}%` },
  pm: { him: v => signed(v), base: v => signed(v, 1) },
  toi: { him: mmss, base: mmss },
};
const VERDICT = { rise: 'var(--rise)', red: 'var(--red)', muted: 'var(--text-muted)' } as const;

function Last5Table({ t, one }: { t: L5; one: string }) {
  return (
    <div className="overflow-x-auto rounded-xl border" style={card}>
      <table className="w-full min-w-[600px] border-collapse text-sm">
        <thead>
          <tr style={{ ...MONO, color: 'var(--text-muted)', letterSpacing: 0.8 }}>
            <th scope="col" className={`${TH} pl-[18px] text-left`}>LAST {t.n} GAMES</th>
            <th scope="col" className={`${TH} text-right`} style={{ color: 'var(--text-bright)' }}>HIM</th>
            <th scope="col" className={`${TH} text-right`}>HIS USUAL · PER {t.n} GAMES</th>
            <th scope="col" className={`${TH} text-right`}>AVERAGE {one.toUpperCase()}</th>
            <th scope="col" className={`${TH} pr-[18px] text-right`}>VERDICT</th>
          </tr>
        </thead>
        <tbody>
          {t.rows.map(r => (
            <tr key={r.key} className="border-t" style={{ borderColor: 'var(--border-soft)' }}>
              <th scope="row" className="px-[18px] py-2.5 text-left font-semibold" style={{ color: 'var(--text-bright)' }}>{r.label}</th>
              <td className="px-2 py-2.5 text-right text-xl font-extrabold tabular-nums" style={{ color: 'var(--text-bright)' }}>{L5_FMT[r.key].him(r.l5)}</td>
              <td className="px-2 py-2.5 text-right tabular-nums" style={{ color: 'var(--text)' }}>{L5_FMT[r.key].base(r.own)}</td>
              <td className="px-2 py-2.5 text-right tabular-nums" style={{ color: 'var(--text-muted)' }}>{L5_FMT[r.key].base(r.pos)}</td>
              <td className="py-2.5 pr-[18px] text-right">
                <span className="inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ color: VERDICT[r.verdict.tone], background: `color-mix(in srgb, ${VERDICT[r.verdict.tone]} 14%, transparent)` }}>{r.verdict.text}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GameLog({ games }: { games: GameLine[] }) {
  const maxPts = Math.max(3, ...games.map(g => g.g + g.a));
  return (
    <div className="overflow-x-auto rounded-xl border" style={card}>
      <table className="w-full min-w-[660px] border-collapse text-sm">
        <thead>
          <tr style={{ ...MONO, color: 'var(--text-muted)', letterSpacing: 0.8 }}>
            <th scope="col" className={`${TH} pl-[18px] text-left`}>DATE</th>
            <th scope="col" className={`${TH} text-left`}>OPPONENT</th>
            <th scope="col" className={`${TH} text-left`}>RESULT</th>
            <th scope="col" className={`${TH} text-right`}>G</th>
            <th scope="col" className={`${TH} text-right`}>A</th>
            <th scope="col" className={`${TH} text-left`}>POINTS</th>
            <th scope="col" className={`${TH} text-right`}>SOG</th>
            <th scope="col" className={`${TH} text-right`}>+/-</th>
            <th scope="col" className={`${TH} text-right`}>TOI</th>
            <th scope="col" className={`${TH} pr-[18px] text-right`}>HEAT AFTER</th>
          </tr>
        </thead>
        <tbody>
          {games.map(g => {
            const pts = g.g + g.a;
            return (
              <tr key={`${g.date}-${g.id}`} className="border-t" style={{ borderColor: 'var(--border-soft)' }}>
                <td className="py-2 pl-[18px] pr-2 text-xs" style={{ ...MONO, color: 'var(--text)' }}>{fmtDate(g.date)}</td>
                <td className="px-2 py-2"><span className="inline-flex items-center gap-2"><span className="w-4 text-[11px]" style={{ ...MONO, color: 'var(--text-muted)' }}>{g.home ? 'vs' : '@'}</span><TeamChip abbrev={g.opp} size={22} /><span className="text-xs font-semibold" style={{ color: 'var(--text-bright)' }}>{g.opp}</span></span></td>
                <td className="px-2 py-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-md text-xs font-extrabold" style={{ ...MONO, color: 'var(--bg)', background: g.result === 'W' ? 'var(--rise)' : g.result === 'L' ? 'var(--red)' : 'var(--border)' }}>{g.result ?? '–'}</span>
                </td>
                <td className="px-2 py-2 text-right font-extrabold" style={{ color: g.g ? 'var(--text-bright)' : 'var(--text-muted)' }}>{g.g}</td>
                <td className="px-2 py-2 text-right font-extrabold" style={{ color: g.a ? 'var(--text-bright)' : 'var(--text-muted)' }}>{g.a}</td>
                <td className="px-2 py-2">
                  <span className="flex items-center gap-2">
                    <span className="block h-2 rounded" style={{ width: `${Math.max(2, (pts / maxPts) * 64)}px`, background: pts ? 'var(--heat)' : 'var(--border)' }} />
                    <span className="font-extrabold" style={{ color: pts ? 'var(--heat)' : 'var(--text-muted)' }}>{pts}</span>
                  </span>
                </td>
                <td className="px-2 py-2 text-right" style={{ color: 'var(--text)' }}>{g.sog}</td>
                <td className="px-2 py-2 text-right" style={{ color: g.pm > 0 ? 'var(--rise)' : g.pm < 0 ? 'var(--red)' : 'var(--text-muted)' }}>{signed(g.pm)}</td>
                <td className="px-2 py-2 text-right text-xs" style={{ ...MONO, color: 'var(--text)' }}>{mmss(g.toi / 60)}</td>
                <td className="py-2 pl-2 pr-[18px] text-right font-extrabold" style={{ color: g.heat == null ? 'var(--text-muted)' : heatColor(g.heat) }}>{g.heat ?? '–'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Where he stands: season totals, bar from zero to the leader ─────────────
// Totals are whole numbers; the average needs its decimal (an average +/- of −0.2 is not "−0").
const STAND_FMT = (s: Standing, v: number) => (s.key === 'toiMin' ? mmss(v) : s.key === 'pm' ? signed(v, Number.isInteger(v) ? 0 : 1) : Number.isInteger(v) ? String(v) : v.toFixed(1));

function Stands({ rows, many }: { rows: Standing[]; many: string }) {
  return (
    <div className="rounded-xl border py-1" style={card}>
      {rows.map((s, i) => {
        const lo = s.key === 'pm' ? Math.min(0, s.me, s.avg) : 0;
        const span = s.leader.value - lo || 1;
        const w = (v: number) => Math.max(0, Math.min(100, ((v - lo) / span) * 100));
        return (
          <div key={s.key} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-4 py-3 lg:grid-cols-[minmax(150px,1fr)_minmax(200px,3fr)_minmax(170px,1fr)] lg:gap-[18px] lg:px-[18px]" style={{ borderTop: i ? '1px solid var(--border-soft)' : undefined }}>
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold" style={{ color: 'var(--text-bright)' }}>{s.label}</span>
              <span className="text-[11px]" style={{ ...MONO, color: s.rank <= 10 ? 'var(--heat)' : 'var(--text-muted)' }}>{ordinal(s.rank)} of {s.n} {many}</span>
            </span>
            <span className="relative col-span-2 row-start-2 block h-[30px] lg:col-span-1 lg:row-start-auto" aria-hidden>
              <span className="absolute inset-x-0 top-3 h-2 rounded" style={{ background: 'var(--border-soft)' }} />
              <span className="absolute left-0 top-3 h-2 rounded" style={{ width: `${w(s.me)}%`, background: 'var(--heat)' }} />
              <span className="absolute top-1.5 h-5 w-0.5" style={{ left: `${w(s.avg)}%`, background: 'var(--text-bright)' }} />
              <span className="absolute -top-1.5 whitespace-nowrap text-[10px]" style={{ ...MONO, left: `calc(${w(s.avg)}% + 5px)`, color: 'var(--text)' }}>avg {STAND_FMT(s, s.avg)}</span>
            </span>
            <span className="flex flex-col items-end gap-0.5 lg:col-start-3">
              <span className="text-xl font-extrabold" style={{ color: 'var(--text-bright)' }}>{STAND_FMT(s, s.me)}</span>
              <span className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                {s.leader.isMe ? 'leads the league' : <>leader <TeamChip abbrev={s.leader.team} size={14} /> {s.leader.name} {STAND_FMT(s, s.leader.value)}</>}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Radar: percentile of his position on each per-game rate ─────────────────
const pctColor = (p: number) => (p >= 90 ? 'var(--heat)' : p >= 50 ? 'var(--text-bright)' : 'var(--text-muted)');

function Radar({ axes, one }: { axes: RadarAxis[]; one: string }) {
  const cx = 200, cy = 190, R = 140, n = axes.length;
  const pt = (i: number, r: number) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / n; return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const; };
  const poly = (f: (i: number) => number) => axes.map((_, i) => pt(i, R * f(i)).map(v => v.toFixed(1)).join(',')).join(' ');
  return (
    <svg viewBox="0 0 400 380" className="h-auto w-full max-w-[400px] shrink-0" role="img" aria-label={`Percentiles against the average ${one}: ${axes.map(a => `${a.label} ${ordinal(a.pct)}`).join(', ')}`}>
      {[0.25, 0.75, 1].map(f => <polygon key={f} points={poly(() => f)} fill="none" stroke="var(--border-soft)" />)}
      {axes.map((_, i) => { const [x, y] = pt(i, R); return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--border-soft)" />; })}
      <polygon points={poly(() => 0.5)} fill="none" stroke="var(--text-bright)" strokeWidth="1.5" strokeDasharray="6 5" opacity="0.7" />
      <polygon points={poly(() => 0.95)} fill="none" stroke="var(--text-muted)" strokeDasharray="2 4" />
      <polygon points={poly(i => Math.max(0.04, axes[i].pct / 100))} fill="var(--heat)" fillOpacity="0.22" stroke="var(--heat)" strokeWidth="2.5" strokeLinejoin="round" />
      {axes.map((a, i) => {
        const [x, y] = pt(i, R + 26);
        const anchor = Math.abs(x - cx) < 10 ? 'middle' : x > cx ? 'start' : 'end';
        return (
          <text key={a.label} x={x} y={y + 4} fontSize="12" fill="var(--text)" textAnchor={anchor}>
            {a.label} <tspan fill={pctColor(a.pct)} fontWeight="700">{ordinal(a.pct)}</tspan>
          </text>
        );
      })}
    </svg>
  );
}

// ── Season by season ────────────────────────────────────────────────────────
function Seasons({ rows, current, goalie }: ProfileView['seasons']) {
  const rate = (r: SeasonRow) => (goalie ? r.svPct ?? 0 : r.gp ? r.pts / r.gp : 0);
  const max = Math.max(...rows.map(rate), goalie ? 0.001 : 0.01);
  const lo = goalie ? Math.min(0.85, ...rows.map(r => r.svPct ?? 1)) : 0;
  const past = rows.filter(r => r.season !== current && r.gp >= 20);
  const best = past.length ? past.reduce((b, r) => (rate(r) > rate(b) ? r : b)) : null;
  return (
    <div className="overflow-x-auto rounded-xl border" style={card}>
      <table className="w-full min-w-[620px] border-collapse text-sm">
        <thead>
          <tr style={{ ...MONO, color: 'var(--text-muted)', letterSpacing: 0.8 }}>
            <th scope="col" className={`${TH} pl-[18px] text-left`}>SEASON</th>
            <th scope="col" className={`${TH} text-left`}>TEAM</th>
            <th scope="col" className={`${TH} text-right`}>GP</th>
            {goalie ? <>
              <th scope="col" className={`${TH} text-right`}>W</th><th scope="col" className={`${TH} text-right`}>L</th><th scope="col" className={`${TH} text-right`}>GAA</th>
              <th scope="col" className={`${TH} pl-[18px] text-left`}>SAVE %</th>
            </> : <>
              <th scope="col" className={`${TH} text-right`}>G</th><th scope="col" className={`${TH} text-right`}>A</th><th scope="col" className={`${TH} text-right`}>PTS</th>
              <th scope="col" className={`${TH} pl-[18px] text-left`}>POINTS PER GAME</th><th scope="col" className={`${TH} pr-[18px] text-right`}>+/-</th>
            </>}
          </tr>
        </thead>
        <tbody>
          {[...rows].reverse().map((r, i) => {
            const isCur = r.season === current, isBest = r === best;
            const v = rate(r);
            return (
              <tr key={`${r.season}-${r.teamName}-${i}`} className="border-t" style={{ borderColor: 'var(--border-soft)', background: isCur ? 'rgba(255,90,36,0.06)' : undefined }}>
                <td className="py-2 pl-[18px] pr-2 text-xs" style={{ ...MONO, color: 'var(--text-bright)' }}>
                  {r.season}{isCur && <span style={{ color: 'var(--heat)' }}> · now</span>}{isBest && <span style={{ color: 'var(--gold)' }}> · best</span>}
                </td>
                <td className="px-2 py-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--text-bright)' }}>
                    {r.team ? <><TeamChip abbrev={r.team} size={18} />{r.team}</> : r.teamName}
                  </span>
                </td>
                <td className="px-2 py-2 text-right" style={{ color: 'var(--text)' }}>{r.gp}</td>
                {goalie ? <>
                  <td className="px-2 py-2 text-right" style={{ color: 'var(--text-bright)' }}>{r.w ?? '–'}</td>
                  <td className="px-2 py-2 text-right" style={{ color: 'var(--text-bright)' }}>{r.l ?? '–'}</td>
                  <td className="px-2 py-2 text-right" style={{ color: 'var(--text-bright)' }}>{r.gaa != null ? r.gaa.toFixed(2) : '–'}</td>
                </> : <>
                  <td className="px-2 py-2 text-right" style={{ color: 'var(--text-bright)' }}>{r.g}</td>
                  <td className="px-2 py-2 text-right" style={{ color: 'var(--text-bright)' }}>{r.a}</td>
                  <td className="px-2 py-2 text-right font-extrabold" style={{ color: 'var(--text-bright)' }}>{r.pts}</td>
                </>}
                <td className="py-2 pl-[18px] pr-2">
                  <span className="flex items-center gap-2.5">
                    <span className="block h-2 rounded" style={{ width: `${Math.max(2, ((v - lo) / (max - lo || 1)) * 140)}px`, background: isCur ? 'var(--heat)' : 'var(--text-muted)' }} />
                    <span className="text-xs" style={{ ...MONO, color: isCur ? 'var(--heat)' : 'var(--text)' }}>{goalie ? (r.svPct != null ? r.svPct.toFixed(3).replace(/^0/, '') : '–') : v.toFixed(2)}</span>
                  </span>
                </td>
                {!goalie && <td className="py-2 pl-2 pr-[18px] text-right" style={{ color: r.pm > 0 ? 'var(--rise)' : r.pm < 0 ? 'var(--red)' : 'var(--text-muted)' }}>{signed(r.pm)}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const Lead = ({ children }: { children: React.ReactNode }) => <p className="text-[15px] leading-relaxed" style={{ color: 'var(--text-bright)', textWrap: 'pretty' }}>{children}</p>;

// Profile: every number with its comparison — his position, his own season,
// the league leader (design round 3, "context over values").
export function ProfileBody({ view }: { view: ProfileView }) {
  const p = view.peers;
  return (
    <div className="flex flex-col gap-10 lg:gap-12">
      <PlayerHero {...view.hero} />

      <Section id="scouting" kicker="SCOUTING REPORT · AI, FROM THE NUMBERS" title="The player.">
        <Scouting {...view.scouting} />
      </Section>

      <Section id="trend" kicker="FORM OVER TIME · GAME BY GAME" title={view.trend.kind === 'goalie' ? 'Form over time.' : 'Heat over time.'}>
        <div className="flex flex-col gap-3">
          {view.trendLine && <Lead>{view.trendLine}</Lead>}
          <TrendChart data={view.trend} />
        </div>
      </Section>

      {p && view.last5.table ? (
        <Section id="last5" kicker={`LAST ${view.last5.table.n} GAMES`} title="The last stretch." sub={view.last5.line}>
          <div className="flex flex-col gap-3.5">
            <Last5Table t={view.last5.table} one={p.one} />
            <GameLog games={[...view.last5.games].reverse()} />
          </div>
        </Section>
      ) : view.goalieLast5.length > 0 && (
        <Section id="last5" kicker="LAST 5 GAMES" title="The last stretch.">
          <Tiles tiles={view.goalieLast5} cols="grid-cols-3 lg:grid-cols-6" />
        </Section>
      )}

      {p && view.stands.length > 0 && (
        <Section id="stands" kicker={`THIS SEASON · ${view.seasonLabel} · AMONG ${view.stands[0].n} ${p.many.toUpperCase()}`} title="Where he stands."
          sub={`The bar runs from zero to the league's best ${p.one}; the white tick is the average ${p.one}.`}
          right={<span className="text-[11px]" style={{ ...MONO, color: 'var(--text-muted)' }}>{view.seasonGames} games played</span>}>
          <Stands rows={view.stands} many={p.many} />
        </Section>
      )}

      {!p && view.goalieSeason.length > 0 && (
        <Section id="stands" kicker={`SEASON STATS · ${view.seasonLabel}`} title="The full picture."
          right={<span className="text-[11px]" style={{ ...MONO, color: 'var(--text-muted)' }}>{view.seasonGames} games played</span>}>
          <Tiles tiles={view.goalieSeason} cols="grid-cols-3 lg:grid-cols-6" />
        </Section>
      )}

      {p && view.radar && (
        <Section id="radar" kicker={`PERFORMANCE RADAR · PER GAME, PERCENTILE VS ${p.many.toUpperCase()}`} title="Shape of his game.">
          <div className="flex flex-col items-center gap-7 rounded-xl border px-5 py-5 lg:flex-row lg:px-6" style={card}>
            <Radar axes={view.radar.axes} one={p.one} />
            <div className="flex flex-1 flex-col gap-3.5">
              <p className="text-base leading-relaxed" style={{ color: 'var(--text)' }}>
                {view.radar.strong.length > 0
                  ? <><b style={{ color: 'var(--text-bright)' }}>Separates in:</b> {view.radar.strong.join(', ')}.</>
                  : <><b style={{ color: 'var(--text-bright)' }}>No category in the top quarter yet.</b></>}
                {' '}
                {view.radar.weak.length > 0
                  ? <><b style={{ color: 'var(--text-bright)' }}>Below the middle:</b> {view.radar.weak.join(', ')}.</>
                  : <b style={{ color: 'var(--text-bright)' }}>Nothing below the middle of the league.</b>}
              </p>
              <div className="flex flex-col gap-1.5 text-[11px]" style={{ ...MONO, color: 'var(--text-muted)' }}>
                <span><span style={{ color: 'var(--heat)' }}>■</span> {view.last} this season</span>
                <span><span style={{ color: 'var(--text-bright)' }}>╍</span> the average {p.one}</span>
                <span>┈ top 5% of {p.many}</span>
              </div>
            </div>
          </div>
        </Section>
      )}

      {view.seasons.rows.length > 0 && (
        <Section id="seasons" kicker="CAREER · NHL REGULAR SEASON · SOURCE: NHL.COM" title="Season by season."
          sub={view.seasons.pace ?? (view.seasons.goalie ? 'Bars show save percentage.' : 'Bars show points per game, so short seasons compare fairly.')}>
          <Seasons {...view.seasons} />
        </Section>
      )}
    </div>
  );
}
