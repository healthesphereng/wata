import { type WataEvent } from '@/lib/events/schemas';
import { isNewer } from './merge';
import { type EventStore, type RemoteAdapter } from './types';

/**
 * Reconciles the local store with the remote. Push first (get local writes
 * durable), then pull (fold in anything newer from other devices). Pure
 * orchestration over the two interfaces — unit-tested with fakes.
 */
export class SyncEngine {
  constructor(
    private readonly store: EventStore,
    private readonly remote: RemoteAdapter
  ) {}

  /** Send queued local events; drop them from the outbox once accepted. */
  async push(): Promise<number> {
    const ids = await this.store.outbox();
    if (ids.length === 0) return 0;

    const events = (await Promise.all(ids.map((id) => this.store.getEvent(id)))).filter(
      (e): e is WataEvent => Boolean(e)
    );

    // A queued id with no event is stale — clear it so the outbox drains.
    const missing = ids.filter((id) => !events.some((e) => e.id === id));
    await Promise.all(missing.map((id) => this.store.dequeue(id)));

    if (events.length === 0) return 0;

    await this.remote.push(events);
    await Promise.all(events.map((e) => this.store.dequeue(e.id)));
    return events.length;
  }

  /** Fetch remote changes since the watermark and merge them in (LWW). */
  async pull(): Promise<number> {
    const since = await this.store.getWatermark();
    const incoming = await this.remote.pull(since);

    let applied = 0;
    let maxUpdated = since;
    for (const remote of incoming) {
      const existing = await this.store.getEvent(remote.id);
      if (isNewer(remote, existing)) {
        await this.store.putEvent(remote);
        applied += 1;
      }
      if (!maxUpdated || new Date(remote.updated_at) > new Date(maxUpdated)) {
        maxUpdated = remote.updated_at;
      }
    }

    if (maxUpdated && maxUpdated !== since) {
      await this.store.setWatermark(maxUpdated);
    }
    return applied;
  }

  async sync(): Promise<{ pushed: number; pulled: number }> {
    const pushed = await this.push();
    const pulled = await this.pull();
    return { pushed, pulled };
  }
}
