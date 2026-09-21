'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { playerUrl } from '@/lib/urls';
import { teamLogoUrl } from '@/lib/data';

interface PlayerResult {
  id: number;
  first_name: string;
  last_name: string;
  position_code: string;
  headshot_url: string | null;
  teams: { id: number; abbrev: string } | null;
}

export default function PlayerSearch({ autoFocus }: { autoFocus?: boolean }) {
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState<PlayerResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen]       = useState(false);
  const router        = useRouter();
  const inputRef      = useRef<HTMLInputElement>(null);
  const containerRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res  = await fetch(`/api/players/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.players ?? []);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = useCallback((player: PlayerResult) => {
    router.push(playerUrl(player.id, player.first_name, player.last_name));
    setQuery('');
    setOpen(false);
  }, [router]);

  return (
    <div ref={containerRef} className="relative">
      {/* Input */}
      <div className="relative">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm select-none pointer-events-none"
          style={{ color: 'var(--text)' }}>
          {loading ? '⟳' : '⌕'}
        </span>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search players…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={e => {
            if (e.key === 'Escape') { setOpen(false); setQuery(''); }
          }}
          className="w-full text-sm pl-7 pr-3 py-2 rounded-lg outline-none"
          style={{
            background:   'var(--bg)',
            border:       '1px solid var(--border)',
            color:        'var(--text-bright)',
          }}
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 rounded-lg border overflow-hidden z-50 shadow-xl"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          {results.length > 0 ? results.map(player => (
            <button
              key={player.id}
              onMouseDown={e => { e.preventDefault(); handleSelect(player); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-opacity hover:opacity-80"
              style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
              {player.headshot_url
                ? <img src={player.headshot_url} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                : <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: 'var(--border)', color: 'var(--text)' }}>
                    {player.position_code}
                  </div>
              }
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate" style={{ color: 'var(--text-bright)' }}>
                  {player.first_name} {player.last_name}
                </div>
                <div className="text-xs" style={{ color: 'var(--text)' }}>
                  {player.position_code} · {player.teams?.abbrev ?? '—'}
                </div>
              </div>
              {player.teams?.abbrev && (
                <img src={teamLogoUrl(player.teams.abbrev)} alt="" className="w-5 h-5 object-contain flex-shrink-0 opacity-80" />
              )}
            </button>
          )) : (
            <div className="px-3 py-2 text-xs" style={{ color: 'var(--text)' }}>
              No players found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
