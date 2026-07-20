'use client';

import { createClient } from '@/lib/supabase/client';
import { type WataEvent } from '@/lib/events/schemas';
import { IdbEventStore } from './idb-store';
import { SupabaseRemote } from './remote';
import { SyncEngine } from './sync';

/**
 * The app-facing offline repository: one IndexedDB store + one SyncEngine for
 * the browser session. The UI writes here (instant, local), and sync to
 * Supabase happens in the background. See docs/ARCHITECTURE.md §1.
 */

let store: IdbEventStore | null = null;
let engine: SyncEngine | null = null;
const listeners = new Set<() => void>();

function ensure() {
  if (!store || !engine) {
    store = new IdbEventStore();
    engine = new SyncEngine(store, new SupabaseRemote(createClient()));
  }
  return { store, engine };
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  for (const fn of listeners) fn();
}

export async function loadEvents(): Promise<WataEvent[]> {
  return ensure().store.allEvents();
}

/**
 * Optimistic write: land it in IndexedDB and the outbox immediately (so the UI
 * updates and it survives offline), then fire a background sync.
 */
export async function logEvent(event: WataEvent): Promise<void> {
  const { store } = ensure();
  await store.putEvent(event);
  await store.enqueue(event.id);
  notify();
  void syncNow();
}

export async function syncNow(): Promise<void> {
  const { engine } = ensure();
  try {
    const result = await engine.sync();
    if (result.pushed > 0 || result.pulled > 0) notify();
  } catch {
    // Offline or transient — the outbox holds the writes; a later trigger
    // (reconnect, visibility, next log) will retry.
  }
}
