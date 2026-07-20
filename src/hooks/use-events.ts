'use client';

import { useCallback, useEffect, useState } from 'react';
import { type WataEvent } from '@/lib/events/schemas';
import { loadEvents, subscribe, syncNow } from '@/lib/offline/local-repo';

/**
 * The local event stream for the UI. Reads from IndexedDB, re-reads whenever
 * the repository notifies (a log or a completed sync), and kicks a sync on
 * mount, on reconnect, and when the tab becomes visible again.
 */
export function useEvents() {
  const [events, setEvents] = useState<WataEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const rows = await loadEvents();
    setEvents(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
    const unsub = subscribe(reload);

    void syncNow();
    const onOnline = () => void syncNow();
    const onVisible = () => {
      if (document.visibilityState === 'visible') void syncNow();
    };
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      unsub();
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [reload]);

  return { events, loading };
}
