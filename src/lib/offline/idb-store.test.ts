import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { indexedDB } from 'fake-indexeddb';
import { createFeedEvent } from '@/lib/events/factories';
import { IdbEventStore } from './idb-store';

const ctx = {
  familyId: 'a1111111-1111-4111-8111-111111111111',
  childId: 'a2222222-2222-4222-8222-222222222222',
  createdBy: 'a3333333-3333-4333-8333-333333333333',
};

let store: IdbEventStore;

beforeEach(async () => {
  // Close any prior connection, then drop the DB so each test starts clean.
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase('wata');
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
    req.onblocked = () => resolve();
  });
  store = new IdbEventStore();
});

afterEach(async () => {
  await store.close(); // release the connection so the next delete isn't blocked
});

describe('IdbEventStore', () => {
  it('persists and reads back events', async () => {
    const e = createFeedEvent({ ...ctx, details: { method: 'bottle', amount_ml: 120 } });
    await store.putEvent(e);
    expect(await store.getEvent(e.id)).toMatchObject({ id: e.id });
    expect(await store.allEvents()).toHaveLength(1);
  });

  it('tracks the outbox', async () => {
    const e = createFeedEvent({ ...ctx, details: { method: 'breast', side: 'both' } });
    await store.putEvent(e);
    await store.enqueue(e.id);
    expect(await store.outbox()).toEqual([e.id]);
    await store.dequeue(e.id);
    expect(await store.outbox()).toHaveLength(0);
  });

  it('stores the sync watermark', async () => {
    expect(await store.getWatermark()).toBeNull();
    await store.setWatermark('2026-07-20T10:00:00.000Z');
    expect(await store.getWatermark()).toBe('2026-07-20T10:00:00.000Z');
  });
});
