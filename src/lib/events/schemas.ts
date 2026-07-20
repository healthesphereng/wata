import { z } from 'zod';

/**
 * The domain model for tracker events. Pure TypeScript — no React, no
 * Supabase. Each event `kind` has a zod schema for its `details` payload;
 * adding a tracker later (milestone, vaccine) means adding a kind here and a
 * migration enum value, nothing else. See docs/ARCHITECTURE.md §2.
 */

export const EVENT_KINDS = ['feed', 'sleep', 'diaper'] as const;
export type EventKind = (typeof EVENT_KINDS)[number];

// ---------- per-kind details ----------

export const feedMethods = ['breast', 'bottle', 'pump'] as const;
export const breastSides = ['left', 'right', 'both'] as const;

export const feedDetailsSchema = z.object({
  method: z.enum(feedMethods),
  side: z.enum(breastSides).optional(), // breast/pump only
  amount_ml: z.number().positive().max(2000).optional(), // bottle/pump
  duration_s: z
    .number()
    .int()
    .nonnegative()
    .max(60 * 60 * 6)
    .optional(),
});
export type FeedDetails = z.infer<typeof feedDetailsSchema>;

export const diaperContents = ['wet', 'dirty', 'mixed', 'dry'] as const;

export const diaperDetailsSchema = z.object({
  contents: z.enum(diaperContents),
});
export type DiaperDetails = z.infer<typeof diaperDetailsSchema>;

// Sleep carries no payload — it's entirely in started_at/ended_at.
export const sleepDetailsSchema = z.object({}).strict();
export type SleepDetails = z.infer<typeof sleepDetailsSchema>;

export const detailsSchemaFor = {
  feed: feedDetailsSchema,
  sleep: sleepDetailsSchema,
  diaper: diaperDetailsSchema,
} satisfies Record<EventKind, z.ZodTypeAny>;

// ---------- the event row ----------

const baseEventSchema = z.object({
  id: z.string().uuid(),
  family_id: z.string().uuid(),
  child_id: z.string().uuid(),
  started_at: z.string().datetime({ offset: true }),
  ended_at: z.string().datetime({ offset: true }).nullable(),
  note: z.string().max(1000).nullable(),
  created_by: z.string().uuid().nullable(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
  deleted_at: z.string().datetime({ offset: true }).nullable(),
});

/**
 * A fully-typed event, discriminated by kind so `details` narrows correctly:
 * a `feed` event's details is FeedDetails, a `diaper` event's is DiaperDetails.
 */
export const eventSchema = z.discriminatedUnion('kind', [
  baseEventSchema.extend({ kind: z.literal('feed'), details: feedDetailsSchema }),
  baseEventSchema.extend({ kind: z.literal('sleep'), details: sleepDetailsSchema }),
  baseEventSchema.extend({ kind: z.literal('diaper'), details: diaperDetailsSchema }),
]);
export type WataEvent = z.infer<typeof eventSchema>;

/** Validate a details payload against its kind. Throws on mismatch. */
export function parseDetails(kind: EventKind, details: unknown) {
  return detailsSchemaFor[kind].parse(details);
}
