function Row({ label, away, home }: { label: string; away: number | null; home: number | null }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="font-mono font-bold w-14 text-right" style={{ color: 'var(--silver)' }}>
        {away != null ? `${(away * 100).toFixed(1)}%` : '—'}
      </span>
      <div className="flex-1 text-center text-xs" style={{ color: 'var(--text)' }}>{label}</div>
      <span className="font-mono font-bold w-14 text-left" style={{ color: 'var(--heat)' }}>
        {home != null ? `${(home * 100).toFixed(1)}%` : '—'}
      </span>
    </div>
  );
}

export default function SpecialTeamsCard({
  away, home,
}: {
  away: { powerPlayPct: number | null; penaltyKillPct: number | null };
  home: { powerPlayPct: number | null; penaltyKillPct: number | null };
}) {
  if (away.powerPlayPct == null && home.powerPlayPct == null) return null;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 24 }}>
      <div className="space-y-2">
        <Row label="Power play" away={away.powerPlayPct} home={home.powerPlayPct} />
        <Row label="Penalty kill" away={away.penaltyKillPct} home={home.penaltyKillPct} />
      </div>
    </div>
  );
}
