import {
  type DiaperDetails,
  type EventKind,
  type FeedDetails,
  type WataEvent,
  eventSchema,
} from './schemas';

/**
 * Builds new events client-side. The UUID is generated here (not by the DB)
 * so a write is idempotent across offline retries — see docs/ARCHITECTURE.md §1.
 */

interface NewEventBase {
  familyId: string;
  childId: string;
  createdBy: string;
  startedAt?: Date; // defaults to now
  note?: string;
}

function base(input: NewEventBase, now: Date) {
  const startedAt = input.startedAt ?? now;
  return {
    id: crypto.randomUUID(),
    family_id: input.familyId,
    child_id: input.childId,
    started_at: startedAt.toISOString(),
    note: input.note ?? null,
    created_by: input.createdBy,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    deleted_at: null,
  };
}

/** An instant feed/diaper (ended_at = started_at). */
export function createFeedEvent(
  input: NewEventBase & { details: FeedDetails },
  now: Date = new Date()
): WataEvent {
  const b = base(input, now);
  return eventSchema.parse({ ...b, kind: 'feed', ended_at: b.started_at, details: input.details });
}

export function createDiaperEvent(
  input: NewEventBase & { details: DiaperDetails },
  now: Date = new Date()
): WataEvent {
  const b = base(input, now);
  return eventSchema.parse({
    ...b,
    kind: 'diaper',
    ended_at: b.started_at,
    details: input.details,
  });
}

/** Starts a sleep timer: ended_at stays null until stopped. */
export function startSleepEvent(input: NewEventBase, now: Date = new Date()): WataEvent {
  const b = base(input, now);
  return eventSchema.parse({ ...b, kind: 'sleep', ended_at: null, details: {} });
}

/** Stops a running event by stamping ended_at. Returns a new object. */
export function stopEvent(event: WataEvent, endedAt: Date = new Date()): WataEvent {
  return eventSchema.parse({
    ...event,
    ended_at: endedAt.toISOString(),
    updated_at: endedAt.toISOString(),
  });
}

/** Soft-deletes an event (tombstone that syncs like any update). */
export function softDeleteEvent(event: WataEvent, now: Date = new Date()): WataEvent {
  return eventSchema.parse({
    ...event,
    deleted_at: now.toISOString(),
    updated_at: now.toISOString(),
  });
}

export const KIND_LABELS: Record<EventKind, string> = {
  feed: 'Feed',
  sleep: 'Sleep',
  diaper: 'Diaper',
};
