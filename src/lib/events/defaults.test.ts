import { describe, expect, it } from 'vitest';
import { createFeedEvent } from './factories';
import { nextFeedDefaults } from './defaults';

const ctx = {
  familyId: 'a1111111-1111-4111-8111-111111111111',
  childId: 'a2222222-2222-4222-8222-222222222222',
  createdBy: 'a3333333-3333-4333-8333-333333333333',
};

describe('nextFeedDefaults', () => {
  it('defaults to left breast with no history', () => {
    expect(nextFeedDefaults([], ctx.childId)).toEqual({ method: 'breast', side: 'left' });
  });

  it('alternates breast side from the last feed', () => {
    const last = createFeedEvent({ ...ctx, details: { method: 'breast', side: 'left' } });
    expect(nextFeedDefaults([last], ctx.childId)).toEqual({ method: 'breast', side: 'right' });
  });

  it('prefills the last bottle amount', () => {
    const last = createFeedEvent({ ...ctx, details: { method: 'bottle', amount_ml: 120 } });
    expect(nextFeedDefaults([last], ctx.childId)).toEqual({ method: 'bottle', amount_ml: 120 });
  });

  it("ignores another child's feeds", () => {
    const other = createFeedEvent({
      ...ctx,
      childId: 'a9999999-9999-4999-8999-999999999999',
      details: { method: 'bottle', amount_ml: 200 },
    });
    expect(nextFeedDefaults([other], ctx.childId)).toEqual({ method: 'breast', side: 'left' });
  });

  it('uses the most recent feed among several', () => {
    const older = createFeedEvent(
      { ...ctx, details: { method: 'bottle', amount_ml: 90 } },
      new Date('2026-07-20T08:00:00Z')
    );
    const newer = createFeedEvent(
      { ...ctx, details: { method: 'breast', side: 'right' } },
      new Date('2026-07-20T12:00:00Z')
    );
    expect(nextFeedDefaults([older, newer], ctx.childId)).toEqual({
      method: 'breast',
      side: 'left',
    });
  });
});
