import Link from 'next/link';
import { TeamChip } from '@/components/ds';
import { heatColor } from '@/lib/heat';
import { fmtToi, teamTotals, type BoxGoalie, type BoxSkater, type BoxTeam } from '@/lib/box-score';
import { playerUrl } from '@/lib/urls';

const MONO = { fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' } as const;
const TH = 'px-2 py-2 text-right text-[10px] font-bold';
const TD = 'px-2 py-[7px] text-right tabular-nums';
// Zeros recede so the numbers that happened stand out.
const num = (v: number, strong = false) => (
  <span style={{ color: v === 0 ? 'var(--text-muted)' : strong ? 'var(--text-bright)' : 'var(--text)', fontWeight: strong && v ? 800 : undefined }}>{v}</span>
);
const pm = (v: number) => <span style={{ color: v > 0 ? 'var(--rise)' : v < 0 ? 'var(--red)' : 'var(--text-muted)' }}>{v > 0 ? `+${v}` : v}</span>;
const split = (name: string) => { const i = name.indexOf(' '); return i > 0 ? [name.slice(0, i), name.slice(i + 1)] as const : ['', name] as const; };

function PlayerCell({ id, number, name, pos, badge }: { id: number; number: number | null; name: string; pos?: string; badge?: string }) {
  return (
    <td className="sticky left-0 z-[1] py-[7px] pl-4 pr-2" style={{ background: 'var(--bg-card)' }}>
      <Link href={playerUrl(id, ...split(name))} className="flex items-center gap-2 hover:underline">
        <span className="w-5 shrink-0 text-right text-[11px]" style={{ ...MONO, color: 'var(--text-muted)' }}>{number ?? ''}</span>
        <span className="whitespace-nowrap font-semibold" style={{ color: 'var(--text-bright)' }}>{name}</span>
        {pos && <span className="text-[10px]" style={{ ...MONO, color: 'var(--text-muted)' }}>{pos}</span>}
        {badge && <span className="rounded px-1 text-[9px] font-bold" style={{ ...MONO, color: 'var(--heat)', background: 'rgba(255,90,36,0.12)' }}>{badge}</span>}
      </Link>
    </td>
  );
}

function SkaterTable({ title, rows, heat, faceoffs }: { title: string; rows: BoxSkater[]; heat: Map<number, number>; faceoffs: boolean }) {
  if (!rows.length) return null;
  return (
    <table className="w-full min-w-[720px] border-collapse text-[13px]">
      <thead>
        <tr className="border-t" style={{ ...MONO, color: 'var(--text-muted)', borderColor: 'var(--border-soft)', letterSpacing: 0.6 }}>
          <th scope="col" className="sticky left-0 z-[1] py-2 pl-4 pr-2 text-left text-[10px] font-bold" style={{ background: 'var(--bg-card)' }}>{title}</th>
          <th scope="col" className={TH} title="Goals">G</th>
          <th scope="col" className={TH} title="Assists">A</th>
          <th scope="col" className={TH} title="Points" style={{ color: 'var(--text-bright)' }}>PTS</th>
          <th scope="col" className={TH} title="Plus/minus">+/-</th>
          <th scope="col" className={TH} title="Shots on goal">SOG</th>
          <th scope="col" className={TH} title="Hits">HIT</th>
          <th scope="col" className={TH} title="Blocked shots">BLK</th>
          <th scope="col" className={TH} title="Penalty minutes">PIM</th>
          {faceoffs && <th scope="col" className={TH} title="Faceoffs won">FO%</th>}
          <th scope="col" className={TH} title="Time on ice">TOI</th>
          <th scope="col" className={`${TH} pr-4`} title="Heat: form over the last five games, 0–100" style={{ color: 'var(--heat)' }}>HEAT</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(p => {
          const h = heat.get(p.id);
          return (
            <tr key={p.id} className="border-t" style={{ borderColor: 'var(--border-soft)' }}>
              <PlayerCell id={p.id} number={p.number} name={p.name} pos={p.pos} badge={p.gwg ? 'GWG' : p.ppg ? `${p.ppg} PPG` : undefined} />
              <td className={TD}>{num(p.g, true)}</td>
              <td className={TD}>{num(p.a, true)}</td>
              <td className={TD}>{num(p.pts, true)}</td>
              <td className={TD}>{pm(p.pm)}</td>
              <td className={TD}>{num(p.sog)}</td>
              <td className={TD}>{num(p.hits)}</td>
              <td className={TD}>{num(p.blk)}</td>
              <td className={TD}>{num(p.pim)}</td>
              {faceoffs && <td className={TD} style={{ color: p.foPct == null ? 'var(--text-muted)' : 'var(--text)' }}>{p.foPct == null ? '–' : `${Math.round(p.foPct * 100)}`}</td>}
              <td className={TD} style={{ color: 'var(--text)' }}>{fmtToi(p.toi)}</td>
              <td className={`${TD} pr-4 font-extrabold`} style={{ color: h == null ? 'var(--text-muted)' : heatColor(h) }}>{h ?? '–'}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function GoalieTable({ rows }: { rows: BoxGoalie[] }) {
  if (!rows.length) return null;
  return (
    <table className="w-full min-w-[720px] border-collapse text-[13px]">
      <thead>
        <tr className="border-t" style={{ ...MONO, color: 'var(--text-muted)', borderColor: 'var(--border-soft)', letterSpacing: 0.6 }}>
          <th scope="col" className="sticky left-0 z-[1] py-2 pl-4 pr-2 text-left text-[10px] font-bold" style={{ background: 'var(--bg-card)' }}>GOALIES</th>
          <th scope="col" className={TH} title="Decision">DEC</th>
          <th scope="col" className={TH} title="Shots against">SA</th>
          <th scope="col" className={TH} title="Goals against">GA</th>
          <th scope="col" className={TH} title="Saves">SV</th>
          <th scope="col" className={TH} title="Save percentage" style={{ color: 'var(--text-bright)' }}>SV%</th>
          <th scope="col" className={`${TH} pr-4`} title="Time on ice">TOI</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(g => (
          <tr key={g.id} className="border-t" style={{ borderColor: 'var(--border-soft)' }}>
            <PlayerCell id={g.id} number={g.number} name={g.name} />
            <td className={TD} style={{ ...MONO, fontWeight: 700, color: g.decision === 'W' ? 'var(--rise)' : g.decision ? 'var(--text)' : 'var(--text-muted)' }}>{g.decision ?? '–'}</td>
            <td className={TD} style={{ color: 'var(--text)' }}>{g.sa}</td>
            <td className={TD}>{num(g.ga, true)}</td>
            <td className={TD} style={{ color: 'var(--text)' }}>{g.sa - g.ga}</td>
            <td className={`${TD} font-extrabold`} style={{ color: 'var(--text-bright)' }}>{g.svPct == null ? '–' : g.svPct.toFixed(3).replace(/^0/, '')}</td>
            <td className={`${TD} pr-4`} style={{ color: 'var(--text)' }}>{fmtToi(g.toi)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// One team's box score: everyone who played, forwards, defense, goalies.
// Scrolls sideways on a phone with the player column pinned.
export function BoxScore({ abbrev, name, href, team, heat }: { abbrev: string; name: string; href: string | null; team: BoxTeam; heat: Map<number, number> }) {
  const t = teamTotals(team);
  return (
    <div className="overflow-hidden rounded-[14px] border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3">
        <span className="flex items-center gap-2.5">
          <TeamChip abbrev={abbrev} size={26} />
          {href
            ? <Link href={href} className="text-[15px] font-extrabold hover:underline" style={{ color: 'var(--text-bright)' }}>{name}</Link>
            : <span className="text-[15px] font-extrabold" style={{ color: 'var(--text-bright)' }}>{name}</span>}
        </span>
        <span className="text-[11px]" style={{ ...MONO, color: 'var(--text)' }}>
          {t.sog} SOG · {t.hits} HIT · {t.blk} BLK · {t.pim} PIM{t.ppg ? ` · ${t.ppg} PPG` : ''}
        </span>
      </div>
      <div className="overflow-x-auto">
        <SkaterTable title="FORWARDS" rows={team.forwards} heat={heat} faceoffs={team.forwards.some(p => p.foPct != null)} />
        <SkaterTable title="DEFENSE" rows={team.defense} heat={heat} faceoffs={team.forwards.some(p => p.foPct != null)} />
        <GoalieTable rows={team.goalies} />
      </div>
    </div>
  );
}
