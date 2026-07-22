import { type WataEvent } from './schemas';
import { summarizeDay } from './today';

/**
 * Read-model for the week view: one row per calendar day, oldest first,
 * ending today. Pure — same contract as today.ts.
 */

export interface DaySummary {
  date: Date;
  feeds: number;
  diapers: number;
  sleepMs: number;
}

export function summarizeWeek(
  events: WataEvent[],
  today: Date = new Date(),
  days = 7
): DaySummary[] {
  const out: DaySummary[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const s = summarizeDay(events, date, today);
    out.push({ date, feeds: s.feeds, diapers: s.diapers, sleepMs: s.totalSleepMs });
  }
  return out;
}
