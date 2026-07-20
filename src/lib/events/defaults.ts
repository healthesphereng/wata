import { type FeedDetails, type WataEvent } from './schemas';

/**
 * Smart defaults for a new feed, derived from the child's last one — so the
 * common case is a single confirming tap (docs/BRIEF.md: minimal typing).
 * Breast feeds alternate sides; bottle/pump prefill the last amount.
 */
export function nextFeedDefaults(events: WataEvent[], childId: string): FeedDetails {
  const lastFeed = events
    .filter((e) => e.kind === 'feed' && e.child_id === childId && !e.deleted_at)
    .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())[0];

  if (!lastFeed || lastFeed.kind !== 'feed') {
    return { method: 'breast', side: 'left' };
  }

  const d = lastFeed.details;
  if (d.method === 'breast') {
    // Alternate from the last side; 'both' → start left next time.
    const side = d.side === 'left' ? 'right' : 'left';
    return { method: 'breast', side };
  }
  if (d.method === 'bottle') {
    return { method: 'bottle', amount_ml: d.amount_ml ?? 60 };
  }
  return { method: 'pump', side: d.side ?? 'both', amount_ml: d.amount_ml };
}
