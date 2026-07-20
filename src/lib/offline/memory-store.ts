import { type WataEvent } from '@/lib/events/schemas';
import { type EventStore } from './types';

/**
 * In-memory EventStore. Used in tests and as an SSR-safe fallback where
 * IndexedDB doesn't exist (server render, then hydrate to the real store).
 */
export class InMemoryEventStore implements EventStore {
  private events = new Map<string, WataEvent>();
  private queue = new Set<string>();
  private watermark: string | null = null;

  async putEvent(event: WataEvent): Promise<void> {
    this.events.set(event.id, event);
  }
  async putEvents(events: WataEvent[]): Promise<void> {
    for (const e of events) this.events.set(e.id, e);
  }
  async getEvent(id: string): Promise<WataEvent | undefined> {
    return this.events.get(id);
  }
  async allEvents(): Promise<WataEvent[]> {
    return [...this.events.values()];
  }
  async enqueue(eventId: string): Promise<void> {
    this.queue.add(eventId);
  }
  async outbox(): Promise<string[]> {
    return [...this.queue];
  }
  async dequeue(eventId: string): Promise<void> {
    this.queue.delete(eventId);
  }
  async getWatermark(): Promise<string | null> {
    return this.watermark;
  }
  async setWatermark(iso: string): Promise<void> {
    this.watermark = iso;
  }
}
