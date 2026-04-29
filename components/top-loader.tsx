'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

export function TopLoader() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const completing = useRef(false);

  function startLoad() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    completing.current = false;
    setVisible(true);
    setProgress(0);
    const t1 = setTimeout(() => setProgress(30), 20);
    const t2 = setTimeout(() => setProgress(60), 300);
    const t3 = setTimeout(() => setProgress(80), 800);
    timers.current.push(t1, t2, t3);
  }

  function completeLoad() {
    if (completing.current) return;
    completing.current = true;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setProgress(100);
    const t = setTimeout(() => setVisible(false), 300);
    timers.current.push(t);
  }

  // Fire immediately on any internal link click — before the server responds
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as Element).closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('mailto') || href.startsWith('#')) return;
      startLoad();
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Complete when the new pathname is committed
  useEffect(() => {
    completeLoad();
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 9999,
        height: 3,
        width: `${progress}%`,
        background: 'var(--heat)',
        opacity: progress === 100 ? 0 : 1,
        transition: 'width 0.4s ease, opacity 0.3s ease',
        pointerEvents: 'none',
      }}
    />
  );
}
