// Kicker + title + optional right slot — the design's PageTitle (size "page"),
// GameSection (size "section") and PpSection (size "feature") pattern.
const SIZES = {
  page: { title: 44, tracking: -1.5, gap: 8, mb: 24 },
  feature: { title: 28, tracking: -0.8, gap: 6, mb: 18 },
  section: { title: 24, tracking: -0.6, gap: 6, mb: 16 },
} as const;

export function SectionHeading({
  kicker,
  title,
  sub,
  right,
  as: Tag = 'h2',
  size = 'section',
  kickerColor = 'var(--heat)',
  id,
}: {
  kicker: React.ReactNode;
  title: React.ReactNode;
  sub?: React.ReactNode;
  right?: React.ReactNode;
  as?: 'h1' | 'h2' | 'h3';
  size?: keyof typeof SIZES;
  kickerColor?: string;
  id?: string; // for aria-labelledby on the section
}) {
  const s = SIZES[size];
  return (
    <div className="flex flex-wrap items-end justify-between gap-4" style={{ marginBottom: s.mb }}>
      <div className="min-w-0">
        <div
          className="font-bold"
          style={{
            fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
            fontSize: 11,
            letterSpacing: 1.4,
            color: kickerColor,
            marginBottom: s.gap,
          }}
        >
          {kicker}
        </div>
        <Tag
          id={id}
          className="font-extrabold leading-none"
          style={{
            fontSize: `clamp(${Math.round(s.title * 0.7)}px, 6vw, ${s.title}px)`,
            letterSpacing: s.tracking,
            color: 'var(--text-bright)',
          }}
        >
          {title}
        </Tag>
        {sub && (
          <p className="mt-2 text-sm" style={{ color: 'var(--text)' }}>
            {sub}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}
