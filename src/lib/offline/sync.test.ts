import { describe, expect, it } from 'vitest';
import { createFeedEvent, stopEvent } from '@/lib/events/factories';
import { startSleepEvent } from '@/lib/events/factories';
import { type WataEvent } from '@/lib/events/schemas';
import { InMemoryEventStore } from './memory-store';
import { SyncEngine } from './sync';
import { type RemoteAdapter } from './types';

const ctx = {
  familyId: 'a1111111-1111-4111-8111-111111111111',
  childId: 'a2222222-2222-4222-8222-222222222222',
  createdBy: 'a3333333-3333-4333-8333-333333333333',
};

/** A fake remote that records pushes and serves a scripted server state. */
class FakeRemote implements RemoteAdapter {
  server = new Map<string, WataEvent>();
  pushCount = 0;
  failNextPush = false;

  async push(events: WataEvent[]): Promise<void> {
    if (this.failNextPush) {
      this.failNextPush = false;
      throw new Error('network down');
    }
    this.pushCount += 1;
    for (const e of events) this.server.set(e.id, e);
  }
  async pull(since: string | null): Promise<WataEvent[]> {
    return [...this.server.values()]
      .filter((e) => !since || new Date(e.updated_at) > new Date(since))
      .sort((a, b) => a.updated_at.localeCompare(b.updated_at));
  }
}

describe('SyncEngine.push', () => {
  it('flushes the outbox to the remote and clears it', async () => {
    const store = new InMemoryEventStore();
    const remote = new FakeRemote();
    const engine = new SyncEngine(store, remote);

    const e = createFeedEvent({ ...ctx, details: { method: 'bottle', amount_ml: 90 } });
    await store.putEvent(e);
    await store.enqueue(e.id);

    expect(await engine.push()).toBe(1);
    expect(remote.server.has(e.id)).toBe(true);
    expect(await store.outbox()).toHaveLength(0);
  });

  it('keeps the outbox intact when a push fails, then succeeds on retry', async () => {
    const store = new InMemoryEventStore();
    const remote = new FakeRemote();
    const engine = new SyncEngine(store, remote);

    const e = createFeedEvent({ ...ctx, details: { method: 'breast', side: 'left' } });
    await store.putEvent(e);
    await store.enqueue(e.id);

    remote.failNextPush = true;
    await expect(engine.push()).rejects.toThrow('network down');
    expect(await store.outbox()).toEqual([e.id]); // still queued

    expect(await engine.push()).toBe(1); // retry drains it
    expect(await store.outbox()).toHaveLength(0);
  });

  it('is idempotent: re-pushing the same event does not duplicate it', async () => {
    const store = new InMemoryEventStore();
    const remote = new FakeRemote();
    const engine = new SyncEngine(store, remote);

    const e = createFeedEvent({ ...ctx, details: { method: 'bottle', amount_ml: 60 } });
    await store.putEvent(e);
    await store.enqueue(e.id);
    await engine.push();

    // simulate a duplicate enqueue (double-tap / replay)
    await store.enqueue(e.id);
    await engine.push();

    expect(remote.server.size).toBe(1);
  });
});

describe('SyncEngine.pull', () => {
  it('merges remote events newer than the watermark and advances it', async () => {
    const store = new InMemoryEventStore();
    const remote = new FakeRemote();
    const engine = new SyncEngine(store, remote);

    const remoteEvent = createFeedEvent(
      { ...ctx, details: { method: 'bottle', amount_ml: 100 } },
      new Date('2026-07-20T10:00:00Z')
    );
    remote.server.set(remoteEvent.id, remoteEvent);

    expect(await engine.pull()).toBe(1);
    expect(await store.getEvent(remoteEvent.id)).toMatchObject({ id: remoteEvent.id });
    expect(await store.getWatermark()).toBe(remoteEvent.updated_at);

    // second pull sees nothing new
    expect(await engine.pull()).toBe(0);
  });

  it('applies last-write-wins on conflicting versions', async () => {
    const store = new InMemoryEventStore();
    const remote = new FakeRemote();
    const engine = new SyncEngine(store, remote);

    const running = startSleepEvent(ctx, new Date('2026-07-20T01:00:00Z'));
    await store.putEvent(running);

    // remote has a newer (stopped) version of the same event
    const stopped = stopEvent(running, new Date('2026-07-20T03:00:00Z'));
    remote.server.set(stopped.id, stopped);

    await engine.pull();
    const merged = await store.getEvent(running.id);
    expect(merged?.ended_at).toBe(stopped.ended_at); // newer version won
  });

  it('does not overwrite a newer local version with a stale remote one', async () => {
    const store = new InMemoryEventStore();
    const remote = new FakeRemote();
    const engine = new SyncEngine(store, remote);

    const local = stopEvent(
      startSleepEvent(ctx, new Date('2026-07-20T01:00:00Z')),
      new Date('2026-07-20T05:00:00Z')
    );
    await store.putEvent(local);

    const stale = startSleepEvent(ctx, new Date('2026-07-20T01:00:00Z')); // older updated_at
    const staleSameId = { ...stale, id: local.id };
    remote.server.set(local.id, staleSameId as WataEvent);

    await engine.pull();
    const kept = await store.getEvent(local.id);
    expect(kept?.ended_at).toBe(local.ended_at); // local (newer) preserved
  });
});

describe('SyncEngine.sync', () => {
  it('pushes then pulls in one call', async () => {
    const store = new InMemoryEventStore();
    const remote = new FakeRemote();
    const engine = new SyncEngine(store, remote);

    const mine = createFeedEvent({ ...ctx, details: { method: 'bottle', amount_ml: 80 } });
    await store.putEvent(mine);
    await store.enqueue(mine.id);

    const theirs = createFeedEvent(
      { ...ctx, details: { method: 'breast', side: 'right' } },
      new Date('2026-07-20T09:00:00Z')
    );
    remote.server.set(theirs.id, theirs);

    const result = await engine.sync();
    expect(result.pushed).toBe(1);
    // A first pull (null watermark) also echoes back our just-pushed event —
    // a harmless LWW no-op — so pulled covers theirs plus our own.
    expect(result.pulled).toBeGreaterThanOrEqual(1);
    expect(remote.server.has(mine.id)).toBe(true);
    expect(await store.getEvent(theirs.id)).toBeDefined();
  });
});
