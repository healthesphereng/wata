import { type DBSchema, type IDBPDatabase, openDB } from 'idb';
import { type WataEvent } from '@/lib/events/schemas';
import { type EventStore } from './types';

interface WataDB extends DBSchema {
  events: { key: string; value: WataEvent };
  outbox: { key: string; value: { eventId: string; queuedAt: string } };
  meta: { key: string; value: string };
}

const DB_NAME = 'wata';
const DB_VERSION = 1;
const WATERMARK_KEY = 'sync_watermark';

/**
 * IndexedDB-backed EventStore — the browser's durable local copy. The UI
 * reads from here first; the SyncEngine keeps it in step with Supabase.
 */
export class IdbEventStore implements EventStore {
  private dbPromise: Promise<IDBPDatabase<WataDB>>;

  constructor() {
    this.dbPromise = openDB<WataDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore('events', { keyPath: 'id' });
        db.createObjectStore('outbox', { keyPath: 'eventId' });
        db.createObjectStore('meta');
      },
    });
  }

  async putEvent(event: WataEvent): Promise<void> {
    const db = await this.dbPromise;
    await db.put('events', event);
  }
  async putEvents(events: WataEvent[]): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction('events', 'readwrite');
    await Promise.all([...events.map((e) => tx.store.put(e)), tx.done]);
  }
  async getEvent(id: string): Promise<WataEvent | undefined> {
    const db = await this.dbPromise;
    return db.get('events', id);
  }
  async allEvents(): Promise<WataEvent[]> {
    const db = await this.dbPromise;
    return db.getAll('events');
  }
  async enqueue(eventId: string): Promise<void> {
    const db = await this.dbPromise;
    await db.put('outbox', { eventId, queuedAt: new Date().toISOString() });
  }
  async outbox(): Promise<string[]> {
    const db = await this.dbPromise;
    return db.getAllKeys('outbox');
  }
  async dequeue(eventId: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete('outbox', eventId);
  }
  async getWatermark(): Promise<string | null> {
    const db = await this.dbPromise;
    return (await db.get('meta', WATERMARK_KEY)) ?? null;
  }
  async setWatermark(iso: string): Promise<void> {
    const db = await this.dbPromise;
    await db.put('meta', iso, WATERMARK_KEY);
  }

  /** Release the IndexedDB connection (tests; not needed in normal app use). */
  async close(): Promise<void> {
    const db = await this.dbPromise;
    db.close();
  }
}
