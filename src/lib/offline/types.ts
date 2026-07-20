import { type WataEvent } from '@/lib/events/schemas';

/**
 * The offline layer's seams. The UI reads and writes through an EventStore
 * (IndexedDB in the browser, in-memory in tests); the SyncEngine reconciles
 * that store with a RemoteAdapter (Supabase). See docs/ARCHITECTURE.md §1.
 */

export interface EventStore {
  // events
  putEvent(event: WataEvent): Promise<void>;
  putEvents(events: WataEvent[]): Promise<void>;
  getEvent(id: string): Promise<WataEvent | undefined>;
  allEvents(): Promise<WataEvent[]>;
  // outbox — ids of locally-written events not yet confirmed by the remote
  enqueue(eventId: string): Promise<void>;
  outbox(): Promise<string[]>;
  dequeue(eventId: string): Promise<void>;
  // sync watermark — the newest remote updated_at we've already pulled
  getWatermark(): Promise<string | null>;
  setWatermark(iso: string): Promise<void>;
}

export interface RemoteAdapter {
  /** Idempotent upsert (client-generated ids make retries safe). */
  push(events: WataEvent[]): Promise<void>;
  /** Events with updated_at strictly greater than `since`, oldest first. */
  pull(since: string | null): Promise<WataEvent[]>;
}
