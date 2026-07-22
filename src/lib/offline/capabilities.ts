'use client';

import { createClient } from '@/lib/supabase/client';

/**
 * Detects whether the remote database accepts the newer event kinds
 * ('vaccine', 'measure' — added by migration 20260722000001). The sync engine
 * pushes the outbox as one batch, so writing those kinds before the enum
 * exists remotely would wedge sync for every event. Until the probe passes,
 * the guide keeps those features on-device.
 *
 * The probe is a read: `where kind = 'vaccine'` makes Postgres cast the
 * literal to the enum, which errors iff the value is missing. A pass is
 * cached forever (enum values can't be removed); a miss is re-probed on the
 * next call.
 */

const CACHE_KEY = 'wata:remote-guide-kinds';

let inFlight: Promise<boolean> | null = null;

export async function remoteSupportsGuideKinds(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (localStorage.getItem(CACHE_KEY) === 'ok') return true;

  inFlight ??= (async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.from('events').select('id').eq('kind', 'vaccine').limit(1);
      if (error) return false;
      localStorage.setItem(CACHE_KEY, 'ok');
      return true;
    } catch {
      return false; // offline — try again next time
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}
