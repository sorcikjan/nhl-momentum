interface LayerData {
  gamesPlayed: number;
  goals: number;
  assists: number;
  points: number;
  ppm: number;
  shootingPct: number;
  hits: number;
  blockedShots: number;
  plusMinus: number;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs" style={{ color: 'var(--text)' }}>{label}</span>
      <span className="text-sm font-mono font-semibold" style={{ color: 'var(--text-bright)' }}>{value}</span>
    </div>
  );
}

function Layer({
  title, color, data, weight,
}: {
  title: string; color: string; data: LayerData; weight: string;
}) {
  return (
    <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold" style={{ color }}>{title}</h3>
        <span className="text-xs px-2 py-0.5 rounded font-mono"
          style={{ background: `${color}22`, color }}>
          {weight} weight
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Games" value={data.gamesPlayed} />
        <Stat label="G" value={data.goals} />
        <Stat label="A" value={data.assists} />
        <Stat label="PPM" value={data.ppm.toFixed(4)} />
        <Stat label="S%" value={`${(data.shootingPct * 100).toFixed(1)}%`} />
        <Stat label="+/-" value={data.plusMinus > 0 ? `+${data.plusMinus}` : data.plusMinus} />
        <Stat label="Hits" value={data.hits} />
        <Stat label="Blocks" value={data.blockedShots} />
        <Stat label="Pts" value={data.points} />
      </div>
    </div>
  );
}

export default function MetricLayers({
  momentum, season, career,
}: {
  momentum: LayerData; season: LayerData; career: LayerData;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <Layer title="Momentum" color="var(--neon)"   data={momentum} weight="50%" />
      <Layer title="Season"   color="var(--silver)" data={season}   weight="35%" />
      <Layer title="Career"   color="var(--amber)"  data={career}   weight="15%" />
    </div>
  );
}
