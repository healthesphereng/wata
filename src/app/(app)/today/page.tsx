'use client';

import { useMemo, useState } from 'react';
import { Milk, Moon, Baby, Plus } from 'lucide-react';
import { useAppData } from '@/providers/app-data';
import { useEvents } from '@/hooks/use-events';
import { eventsForDay, summarizeDay } from '@/lib/events/today';
import { type WataEvent } from '@/lib/events/schemas';
import { AddChildDialog } from '@/components/app/add-child-dialog';
import { VaccineDueBanner } from '@/components/guide/vaccine-due-banner';
import { EventRow } from '@/components/timeline/event-row';
import { RunningSleepCard } from '@/components/timeline/running-sleep-card';
import { EditEventSheet } from '@/components/log/edit-event-sheet';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PastelBlobs } from '@/components/ui/pastel-blobs';

function StatTile({
  icon: Icon,
  value,
  label,
  tint,
}: {
  icon: typeof Milk;
  value: string | number;
  label: string;
  tint: string;
}) {
  return (
    <div className="shadow-soft flex flex-col items-center gap-1.5 rounded-2xl bg-card p-4">
      <span className={`flex size-9 items-center justify-center rounded-xl ${tint}`}>
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="text-2xl font-bold tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export default function TodayPage() {
  const { children, selectedChild, loading } = useAppData();
  const { events } = useEvents();
  const today = useMemo(() => new Date(), []);
  const [editing, setEditing] = useState<WataEvent | null>(null);

  const childEvents = useMemo(
    () => (selectedChild ? events.filter((e) => e.child_id === selectedChild.id) : []),
    [events, selectedChild]
  );
  const summary = useMemo(() => summarizeDay(childEvents, today), [childEvents, today]);
  const timeline = useMemo(() => eventsForDay(childEvents, today), [childEvents, today]);

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  // First-run onboarding: no baby yet.
  if (children.length === 0) {
    return (
      <div className="relative flex flex-1 flex-col items-center justify-center p-8 text-center">
        <PastelBlobs />
        <div className="relative flex flex-col items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary text-3xl font-bold text-primary-foreground">
            w
          </div>
          <h1 className="text-xl font-semibold">Welcome to wata</h1>
          <p className="max-w-xs text-sm text-muted-foreground">
            Add your baby to start logging feeds, sleep, and diapers.
          </p>
          <AddChildDialog
            trigger={
              <Button className="h-12 gap-2 text-base">
                <Plus className="size-5" />
                Add your baby
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  const sleepHours = Math.floor(summary.totalSleepMs / 3_600_000);
  const sleepMins = Math.round((summary.totalSleepMs % 3_600_000) / 60_000);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      {summary.runningSleep && <RunningSleepCard event={summary.runningSleep} />}

      {selectedChild?.birth_date && (
        <VaccineDueBanner childId={selectedChild.id} birthDate={selectedChild.birth_date} />
      )}

      <section aria-label="Today at a glance" className="grid grid-cols-3 gap-3">
        <StatTile icon={Milk} value={summary.feeds} label="feeds" tint="bg-primary/15 text-primary" />
        <StatTile
          icon={Moon}
          value={`${sleepHours}h ${sleepMins}m`}
          label="sleep"
          tint="bg-blue-soft/40 text-foreground"
        />
        <StatTile icon={Baby} value={summary.diapers} label="diapers" tint="bg-mint-soft/60 text-foreground" />
      </section>

      <section aria-label="Today's log" className="flex flex-col gap-2">
        <h2 className="flex items-center gap-1.5 px-1 text-sm font-semibold text-foreground">
          <span aria-hidden className="text-mint">
            ♥
          </span>
          Today
        </h2>
        {timeline.length === 0 ? (
          <p className="shadow-soft rounded-xl bg-card p-6 text-center text-sm text-muted-foreground">
            Nothing logged yet. Tap <span className="font-medium text-foreground">Feed</span> below
            to start.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {timeline.map((e) => (
              <EventRow key={e.id} event={e} onSelect={setEditing} />
            ))}
          </ul>
        )}
      </section>

      <EditEventSheet event={editing} onOpenChange={(open) => !open && setEditing(null)} />
    </div>
  );
}
