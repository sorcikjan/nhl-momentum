'use client';
import { useMemo, useSyncExternalStore } from 'react';
import { CHEER_EVENT, parsePick, stored, type CheerPick } from '@/lib/cheer';

const subscribe = (cb: () => void) => {
  window.addEventListener(CHEER_EVENT, cb);
  window.addEventListener('storage', cb);   // another tab
  return () => { window.removeEventListener(CHEER_EVENT, cb); window.removeEventListener('storage', cb); };
};

// One localStorage key, live: null on the server and while hydrating (the
// server never knows it), then the stored string ('' when absent).
export function useStored(key: string): string | null {
  return useSyncExternalStore(subscribe, () => stored(key), () => null);
}

// The browser's pick: undefined until known, then the pick or null.
export function usePick(): CheerPick | null | undefined {
  const raw = useStored('momentum.cheer');
  return useMemo(() => raw === null ? undefined : parsePick(raw), [raw]);
}
