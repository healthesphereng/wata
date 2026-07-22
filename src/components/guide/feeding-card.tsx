import { Milk } from 'lucide-react';
import { type FeedingGuidance } from '@/lib/guide/feeding';

/** "What feeding looks like right now" — one stage of the feeding coach. */
export function FeedingCard({ guidance }: { guidance: FeedingGuidance }) {
  const { stage, rhythm, bottle, milk, solids, tips } = guidance;
  return (
    <section aria-label="Feeding" className="shadow-soft flex flex-col gap-4 rounded-2xl bg-card p-4">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Milk className="size-5" aria-hidden />
        </span>
        <div>
          <h3 className="font-semibold">{stage}</h3>
          <p className="text-sm text-muted-foreground">{rhythm}</p>
        </div>
      </div>

      {bottle && (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-secondary p-3">
          <div>
            <p className="text-sm text-muted-foreground">Bottle / expressed, per feed</p>
            <p className="text-xl font-bold tabular-nums">
              {bottle.perFeedMinMl}–{bottle.perFeedMaxMl} ml
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Across the day</p>
            <p className="text-xl font-bold tabular-nums">≈{bottle.dailyMl} ml</p>
          </div>
        </div>
      )}

      <p className="text-sm text-foreground/90">{milk}</p>
      {solids && <p className="text-sm text-foreground/90">{solids}</p>}

      <ul className="flex flex-col gap-1.5">
        {tips.map((tip) => (
          <li key={tip} className="flex gap-2 text-sm text-muted-foreground">
            <span aria-hidden className="text-mint">
              ♥
            </span>
            {tip}
          </li>
        ))}
      </ul>
    </section>
  );
}
