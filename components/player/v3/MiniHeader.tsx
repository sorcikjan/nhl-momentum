// The compact header: who this is, his status or next game, and his number
// (Heat for skaters, save % for goalies). Shown above every tab but Now and
// pinned to the top once the tab bar scrolls away.
import { TEAMS } from '@/lib/team-colors';

export type MiniHeaderProps = {
  photo: string | null; name: string; line: string; team: string;
  status: { text: string; tone: 'ok' | 'amber' | 'red' } | null;
  next: string | null;
  metric: { value: string; label: 'HEAT' | 'SAVE %' };
};

const TONE = { ok: 'var(--rise)', amber: '#ffd060', red: '#ff8a8a' } as const;

export function MiniHeader({ photo, name, line, team, status, next, metric }: MiniHeaderProps) {
  const bg = TEAMS[team]?.bg ?? '#252a38';
  const muted = metric.value === '–';
  return (
    <div className="flex h-16 items-center gap-2.5 px-3.5" style={{ background: `linear-gradient(135deg, ${bg} 0%, color-mix(in srgb, ${bg} 55%, #000) 60%, #0d0f14 100%)` }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {photo ? <img src={photo} alt="" className="h-11 w-11 rounded-full" style={{ background: 'rgba(0,0,0,.25)' }} /> : <span className="h-11 w-11 rounded-full" style={{ background: 'rgba(0,0,0,.25)' }} />}
      <div className="min-w-0">
        <b className="block truncate text-base font-black leading-tight text-white">{name}</b>
        <span className="block truncate text-[11px]" style={{ color: 'rgba(255,255,255,.85)' }}>
          {line}
          {status ? <> · <b style={{ color: TONE[status.tone] }}>{status.text}</b></> : next ? <> · <b className="text-white">{next}</b></> : null}
        </span>
      </div>
      <div className="ml-auto text-right text-[22px] font-black leading-none" style={{ color: muted ? 'rgba(255,255,255,.45)' : '#fff' }}>
        {metric.value}
        <small className="block text-[8px] font-bold tracking-[1px]" style={{ color: 'rgba(255,255,255,.75)', fontFamily: 'ui-monospace,monospace' }}>{metric.label}</small>
      </div>
    </div>
  );
}
