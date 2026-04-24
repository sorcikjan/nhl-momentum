'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

export function TopLoader() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];

    setVisible(true);
    setProgress(0);

    const t1 = setTimeout(() => setProgress(85), 50);
    const t2 = setTimeout(() => {
      setProgress(100);
      const t3 = setTimeout(() => setVisible(false), 300);
      timers.current.push(t3);
    }, 450);
    timers.current.push(t1, t2);

    return () => timers.current.forEach(clearTimeout);
  }, [pathname]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 9999,
        height: 3,
        width: `${progress}%`,
        background: 'var(--neon)',
        opacity: progress === 100 ? 0 : 1,
        transition: 'width 0.35s ease, opacity 0.3s ease',
        pointerEvents: 'none',
      }}
    />
  );
}
