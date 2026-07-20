import { type WataEvent } from './schemas';

/**
 * Pure read-model helpers for "today at a glance". No React, no Supabase —
 * given a list of events they compute the dashboard summary. The UI binds
 * to these via a hook later.
 */

export interface TodaySummary {
  feeds: number;
  diapers: number;
  sleeps: number;
  lastFeedAt: string | null;
  totalSleepMs: number;
  runningSleep: WataEvent | null;
}

/** Events for one child on one calendar day, newest first, tombstones dropped. */
export function eventsForDay(events: WataEvent[], day: Date): WataEvent[] {
  const start = new Date(day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return events
    .filter((e) => !e.deleted_at)
    .filter((e) => {
      const t = new Date(e.started_at);
      return t >= start && t < end;
    })
    .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
}

/** A currently-running sleep timer (ended_at null), if any. */
export function findRunningSleep(events: WataEvent[]): WataEvent | null {
  return events.find((e) => e.kind === 'sleep' && !e.deleted_at && e.ended_at === null) ?? null;
}

export function summarizeDay(events: WataEvent[], day: Date, now: Date = new Date()): TodaySummary {
  const todays = eventsForDay(events, day);
  const feeds = todays.filter((e) => e.kind === 'feed');
  const diapers = todays.filter((e) => e.kind === 'diaper');
  const sleeps = todays.filter((e) => e.kind === 'sleep');

  const running = findRunningSleep(events);

  let totalSleepMs = 0;
  for (const s of sleeps) {
    const startedMs = new Date(s.started_at).getTime();
    // A running timer counts up to "now"; a finished one to its ended_at.
    const endMs = s.ended_at ? new Date(s.ended_at).getTime() : now.getTime();
    totalSleepMs += Math.max(0, endMs - startedMs);
  }

  return {
    feeds: feeds.length,
    diapers: diapers.length,
    sleeps: sleeps.length,
    lastFeedAt: feeds[0]?.started_at ?? null, // sorted newest-first
    totalSleepMs,
    runningSleep: running,
  };
}
