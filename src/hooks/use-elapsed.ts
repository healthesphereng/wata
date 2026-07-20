'use client';

import { useEffect, useState } from 'react';

/**
 * Milliseconds elapsed since `startISO`, re-rendered once a second while
 * `active`. Used to drive a running sleep timer's live display. Ticks only
 * when active, so an idle screen does no per-second work.
 */
export function useElapsed(startISO: string | null, active: boolean): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;
    setNow(Date.now()); // resync on (re)activation
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active, startISO]);

  if (!startISO) return 0;
  return Math.max(0, now - new Date(startISO).getTime());
}
