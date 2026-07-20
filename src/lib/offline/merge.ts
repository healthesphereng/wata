import { type WataEvent } from '@/lib/events/schemas';

/**
 * Last-write-wins by updated_at. Ties resolve in favour of the incoming row
 * (a pulled server row is authoritative on equal timestamps). Safe because
 * events are append-mostly and two caregivers editing the *same* event at the
 * same millisecond is not a real scenario. See docs/ARCHITECTURE.md §1.
 */
export function isNewer(incoming: WataEvent, existing: WataEvent | undefined): boolean {
  if (!existing) return true;
  return new Date(incoming.updated_at).getTime() >= new Date(existing.updated_at).getTime();
}
