import { describe, expect, it } from 'vitest';
import { createDiaperEvent, createFeedEvent, startSleepEvent, stopEvent } from './factories';
import { summarizeWeek } from './history';

const ctx = {
  familyId: 'a1111111-1111-4111-8111-111111111111',
  childId: 'a2222222-2222-4222-8222-222222222222',
  createdBy: 'a3333333-3333-4333-8333-333333333333',
};

const at = (iso: string) => new Date(iso);

describe('summarizeWeek', () => {
  const today = at('2026-07-22T12:00:00Z');

  it('returns one row per day, oldest first, ending today', () => {
    const week = summarizeWeek([], today);
    expect(week).toHaveLength(7);
    expect(week[0].date.getDate()).toBe(16);
    expect(week[6].date.getDate()).toBe(22);
  });

  it('buckets events into their calendar day', () => {
    const events = [
      createFeedEvent({
        ...ctx,
        startedAt: at('2026-07-20T08:00:00'),
        details: { method: 'bottle', amount_ml: 120 },
      }),
      createFeedEvent({
        ...ctx,
        startedAt: at('2026-07-20T12:00:00'),
        details: { method: 'breast', side: 'left' },
      }),
      createDiaperEvent({ ...ctx, startedAt: at('2026-07-21T09:00:00'), details: { contents: 'wet' } }),
    ];
    const week = summarizeWeek(events, today);
    const day20 = week.find((d) => d.date.getDate() === 20)!;
    const day21 = week.find((d) => d.date.getDate() === 21)!;
    expect(day20.feeds).toBe(2);
    expect(day20.diapers).toBe(0);
    expect(day21.diapers).toBe(1);
  });

  it('totals finished sleep per day in ms', () => {
    const sleep = stopEvent(
      startSleepEvent({ ...ctx, startedAt: at('2026-07-19T13:00:00') }, at('2026-07-19T13:00:00')),
      at('2026-07-19T15:30:00')
    );
    const week = summarizeWeek([sleep], today);
    const day19 = week.find((d) => d.date.getDate() === 19)!;
    expect(day19.sleepMs).toBe(2.5 * 60 * 60 * 1000);
  });
});
