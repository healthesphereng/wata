import { describe, expect, it } from 'vitest';
import {
  createDiaperEvent,
  createFeedEvent,
  reviseEvent,
  softDeleteEvent,
  startSleepEvent,
  stopEvent,
} from './factories';
import { parseDetails } from './schemas';
import { eventsForDay, findRunningSleep, summarizeDay } from './today';

const ctx = {
  familyId: 'a1111111-1111-4111-8111-111111111111',
  childId: 'a2222222-2222-4222-8222-222222222222',
  createdBy: 'a3333333-3333-4333-8333-333333333333',
};

describe('event factories', () => {
  it('creates a valid bottle feed with a fresh uuid and instant end', () => {
    const now = new Date('2026-07-20T08:00:00Z');
    const e = createFeedEvent({ ...ctx, details: { method: 'bottle', amount_ml: 90 } }, now);
    expect(e.kind).toBe('feed');
    expect(e.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(e.ended_at).toBe(e.started_at); // instant
    if (e.kind === 'feed') expect(e.details.amount_ml).toBe(90);
  });

  it('rejects an out-of-range bottle amount', () => {
    expect(() =>
      createFeedEvent({ ...ctx, details: { method: 'bottle', amount_ml: 9999 } })
    ).toThrow();
  });

  it('starts a sleep timer with a null end, then stops it', () => {
    const start = new Date('2026-07-20T13:00:00Z');
    const running = startSleepEvent(ctx, start);
    expect(running.ended_at).toBeNull();

    const stopped = stopEvent(running, new Date('2026-07-20T14:30:00Z'));
    expect(stopped.ended_at).toBe('2026-07-20T14:30:00.000Z');
    expect(stopped.id).toBe(running.id); // same event, now closed
  });

  it('soft-deletes without dropping the row', () => {
    const e = createDiaperEvent({ ...ctx, details: { contents: 'wet' } });
    const gone = softDeleteEvent(e);
    expect(gone.deleted_at).not.toBeNull();
    expect(gone.id).toBe(e.id);
  });

  it('revises an event and bumps updated_at', () => {
    const e = createFeedEvent(
      { ...ctx, details: { method: 'bottle', amount_ml: 60 } },
      new Date('2026-07-20T08:00:00Z')
    );
    const revised = reviseEvent(
      e,
      { details: { method: 'bottle', amount_ml: 120 } },
      new Date('2026-07-20T08:05:00Z')
    );
    expect(revised.id).toBe(e.id);
    if (revised.kind === 'feed') expect(revised.details.amount_ml).toBe(120);
    expect(revised.updated_at).toBe('2026-07-20T08:05:00.000Z');
  });

  it('rejects a revision whose details do not match the kind', () => {
    const e = createFeedEvent({ ...ctx, details: { method: 'bottle', amount_ml: 60 } });
    expect(() => reviseEvent(e, { details: { contents: 'wet' } })).toThrow();
  });
});

describe('parseDetails', () => {
  it('accepts a valid diaper payload and rejects a bad one', () => {
    expect(parseDetails('diaper', { contents: 'mixed' })).toEqual({ contents: 'mixed' });
    expect(() => parseDetails('diaper', { contents: 'explosive' })).toThrow();
  });
});

describe('today selectors', () => {
  const day = new Date('2026-07-20T12:00:00Z');

  it('keeps only the given day and drops tombstones', () => {
    const today = createFeedEvent(
      { ...ctx, details: { method: 'bottle', amount_ml: 100 } },
      new Date('2026-07-20T09:00:00Z')
    );
    const yesterday = createFeedEvent(
      { ...ctx, details: { method: 'bottle', amount_ml: 100 } },
      new Date('2026-07-19T09:00:00Z')
    );
    const deleted = softDeleteEvent(
      createDiaperEvent({ ...ctx, details: { contents: 'wet' } }, new Date('2026-07-20T10:00:00Z'))
    );

    const result = eventsForDay([today, yesterday, deleted], day);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(today.id);
  });

  it('summarizes counts, last feed, and running sleep', () => {
    const now = new Date('2026-07-20T15:00:00Z');
    const feed1 = createFeedEvent(
      { ...ctx, details: { method: 'breast', side: 'left' } },
      new Date('2026-07-20T08:00:00Z')
    );
    const feed2 = createFeedEvent(
      { ...ctx, details: { method: 'bottle', amount_ml: 120 } },
      new Date('2026-07-20T12:00:00Z')
    );
    const diaper = createDiaperEvent(
      { ...ctx, details: { contents: 'dirty' } },
      new Date('2026-07-20T09:30:00Z')
    );
    const sleep = startSleepEvent(ctx, new Date('2026-07-20T14:00:00Z')); // running

    const s = summarizeDay([feed1, feed2, diaper, sleep], day, now);
    expect(s.feeds).toBe(2);
    expect(s.diapers).toBe(1);
    expect(s.lastFeedAt).toBe(feed2.started_at); // newest
    expect(s.runningSleep?.id).toBe(sleep.id);
    expect(s.totalSleepMs).toBe(60 * 60 * 1000); // 14:00 → now 15:00 = 1h
  });

  it('finds a running sleep among mixed events', () => {
    const finished = stopEvent(
      startSleepEvent(ctx, new Date('2026-07-20T01:00:00Z')),
      new Date('2026-07-20T03:00:00Z')
    );
    const running = startSleepEvent(ctx, new Date('2026-07-20T14:00:00Z'));
    expect(findRunningSleep([finished, running])?.id).toBe(running.id);
    expect(findRunningSleep([finished])).toBeNull();
  });
});
