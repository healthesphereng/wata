import { describe, expect, it } from 'vitest';
import { ageInDays, formatAge } from './age';
import { estimateWeightKg, weightBand } from './weight';
import { feedingGuidance } from './feeding';
import { createMeasureEvent, createVaccineEvent } from '@/lib/events/factories';
import {
  IMMUNIZATION_SCHEDULE,
  visitDueDate,
  visitStatus,
  type VaccineVisit,
} from './immunization';

const visit = (id: string): VaccineVisit => {
  const v = IMMUNIZATION_SCHEDULE.find((x) => x.id === id);
  if (!v) throw new Error(`no visit ${id}`);
  return v;
};

describe('age', () => {
  it('counts whole days since birth', () => {
    expect(ageInDays('2026-07-01', new Date('2026-07-21'))).toBe(20);
  });

  it('never goes negative for a future birth date', () => {
    expect(ageInDays('2026-08-01', new Date('2026-07-21'))).toBe(0);
  });

  it('formats days, weeks, and months at the right boundaries', () => {
    expect(formatAge(1)).toBe('1 day old');
    expect(formatAge(13)).toBe('13 days old');
    expect(formatAge(14)).toBe('2 weeks old');
    expect(formatAge(83)).toBe('11 weeks old');
    expect(formatAge(84)).toBe('2 months old');
    expect(formatAge(366)).toBe('12 months old');
    expect(formatAge(750)).toBe('2 years old');
  });
});

describe('estimateWeightKg', () => {
  it('matches WHO medians at exact months', () => {
    expect(estimateWeightKg(0, 'male')).toBe(3.3);
    expect(estimateWeightKg(0, 'female')).toBe(3.2);
  });

  it('averages the sexes when unknown', () => {
    expect(estimateWeightKg(0)).toBe(3.3); // (3.3 + 3.2) / 2 = 3.25 → 3.3
  });

  it('interpolates between months and grows with age', () => {
    const oneMonth = estimateWeightKg(30, 'male');
    const twoMonths = estimateWeightKg(61, 'male');
    expect(oneMonth).toBeGreaterThan(3.3);
    expect(twoMonths).toBeGreaterThan(oneMonth);
  });

  it('clamps beyond the 24-month table', () => {
    expect(estimateWeightKg(3000, 'male')).toBe(12.2);
  });
});

describe('weightBand', () => {
  it('brackets the median at every age', () => {
    for (const days of [0, 45, 100, 200, 400, 700]) {
      for (const sex of ['male', 'female', null] as const) {
        const { low, high } = weightBand(days, sex);
        const median = estimateWeightKg(days, sex);
        expect(low).toBeLessThan(median);
        expect(high).toBeGreaterThan(median);
      }
    }
  });

  it('widens and rises with age', () => {
    const newborn = weightBand(0, 'male');
    const yearOld = weightBand(365, 'male');
    expect(yearOld.low).toBeGreaterThan(newborn.low);
    expect(yearOld.high - yearOld.low).toBeGreaterThan(newborn.high - newborn.low);
  });
});

describe('measure and vaccine factories', () => {
  const ctx = {
    familyId: 'a1111111-1111-4111-8111-111111111111',
    childId: 'a2222222-2222-4222-8222-222222222222',
    createdBy: 'a3333333-3333-4333-8333-333333333333',
  };

  it('builds a valid instant measure event', () => {
    const e = createMeasureEvent({ ...ctx, details: { weight_kg: 5.8 } });
    expect(e.kind).toBe('measure');
    expect(e.ended_at).toBe(e.started_at);
    if (e.kind === 'measure') expect(e.details.weight_kg).toBe(5.8);
  });

  it('rejects an implausible weight', () => {
    expect(() => createMeasureEvent({ ...ctx, details: { weight_kg: 45 } })).toThrow();
  });

  it('builds a vaccine event referencing a schedule visit', () => {
    const e = createVaccineEvent({ ...ctx, details: { visit_id: '14w' } });
    expect(e.kind).toBe('vaccine');
    if (e.kind === 'vaccine') expect(e.details.visit_id).toBe('14w');
  });
});

describe('feedingGuidance', () => {
  it('gives a newborn 8–12 feeds and weight-based bottle volumes', () => {
    const g = feedingGuidance(10, 3.5);
    expect(g.stage).toContain('Newborn');
    expect(g.solids).toBeNull();
    // 3.5 kg × 150 = 525 ml/day → 40–70 ml across 8–12 feeds
    expect(g.bottle).toEqual({ perFeedMinMl: 40, perFeedMaxMl: 70, dailyMl: 525 });
  });

  it('caps daily volume at 1 litre for heavier babies', () => {
    const g = feedingGuidance(150, 8);
    expect(g.bottle?.dailyMl).toBe(1000);
  });

  it('keeps solids off the menu before 6 months', () => {
    expect(feedingGuidance(89, 5).solids).toBeNull();
    expect(feedingGuidance(179, 7).solids).toBeNull();
  });

  it('switches to solids plus milk from 6 months, dropping per-kg bottle math', () => {
    const g = feedingGuidance(200, 8);
    expect(g.solids).toBeTruthy();
    expect(g.bottle).toBeNull();
  });

  it('reaches family meals at 12 months', () => {
    expect(feedingGuidance(400, 10).stage).toContain('Toddler');
  });
});

describe('immunization', () => {
  it('marks the birth visit due for a newborn and 6 weeks as next', () => {
    expect(visitStatus(visit('birth'), 5)).toBe('due');
    expect(visitStatus(visit('6w'), 5)).toBe('next');
    expect(visitStatus(visit('10w'), 5)).toBe('later');
  });

  it('moves a visit to past once the 4-week window closes', () => {
    expect(visitStatus(visit('birth'), 28)).toBe('due');
    expect(visitStatus(visit('birth'), 29)).toBe('past');
  });

  it('handles the 14-week visit for a 100-day-old', () => {
    expect(visitStatus(visit('14w'), 100)).toBe('due'); // 2 days into the window
    expect(visitStatus(visit('10w'), 100)).toBe('past'); // 30 days late — window closed
  });

  it('computes due dates from the birth date', () => {
    const due = visitDueDate('2026-07-01', visit('6w'));
    expect(due.toISOString().slice(0, 10)).toBe('2026-08-12');
  });

  it('keeps the schedule sorted by age', () => {
    const ages = IMMUNIZATION_SCHEDULE.map((v) => v.ageDays);
    expect([...ages].sort((a, b) => a - b)).toEqual(ages);
  });
});
