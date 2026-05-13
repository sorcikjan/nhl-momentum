'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function LiveBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    async function fetch() {
      const { count: c } = await supabase
        .from('games')
        .select('id', { count: 'exact', head: true })
        .in('game_state', ['LIVE', 'CRIT']);
      setCount(c ?? 0);
    }
    fetch();
    const id = setInterval(fetch, 60_000);
    return () => clearInterval(id);
  }, []);

  if (!count) return null;

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
      style={{ background: 'rgba(255,90,36,0.15)', border: '1px solid rgba(255,90,36,0.4)', color: 'var(--heat)' }}>
      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--heat)' }} />
      LIVE · {count}
    </div>
  );
}
