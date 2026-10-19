'use client';
import { Children, useState } from 'react';

// Mobile pill selector for the homepage rankings (design MobileHomeFinal).
// Panels are server-rendered children; only the selection is client state.
export function RankingsTabs({
  tabs,
  children,
}: {
  tabs: { key: string; label: string; color: string }[];
  children: React.ReactNode;
}) {
  const [active, setActive] = useState(0);
  const panels = Children.toArray(children);
  return (
    <div>
      <div className="mb-3 flex gap-1.5" role="tablist">
        {tabs.map((t, i) => {
          const on = i === active;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={on}
              onClick={() => setActive(i)}
              className="rounded-full px-3 py-1.5 text-[11px] font-bold"
              style={{
                color: on ? t.color : 'var(--text)',
                background: on ? 'var(--bg-raised)' : 'var(--bg-card)',
                border: `1px solid ${on ? t.color : 'var(--border)'}`,
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      {panels.map((p, i) => (
        <div key={i} hidden={i !== active} role="tabpanel">
          {p}
        </div>
      ))}
    </div>
  );
}
