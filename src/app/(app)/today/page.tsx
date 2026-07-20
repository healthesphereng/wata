'use client';

import { useMemo } from 'react';
import { Milk, Moon, Baby, Plus } from 'lucide-react';
import { useAppData } from '@/providers/app-data';
import { useEvents } from '@/hooks/use-events';
import { eventsForDay, summarizeDay } from '@/lib/events/today';
import { AddChildDialog } from '@/components/app/add-child-dialog';
import { EventRow } from '@/components/timeline/event-row';
import { RunningSleepCard } from '@/components/timeline/running-sleep-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

function StatTile({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Milk;
  value: string | number;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl bg-card p-4">
      <Icon className="size-5 text-muted-foreground" aria-hidden />
      <span className="text-2xl font-bold tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export default function TodayPage() {
  const { children, selectedChild, loading } = useAppData();
  const { events } = useEvents();
  const today = useMemo(() => new Date(), []);

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
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
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
    );
  }

  const sleepHours = Math.floor(summary.totalSleepMs / 3_600_000);
  const sleepMins = Math.round((summary.totalSleepMs % 3_600_000) / 60_000);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      {summary.runningSleep && <RunningSleepCard event={summary.runningSleep} />}

      <section aria-label="Today at a glance" className="grid grid-cols-3 gap-3">
        <StatTile icon={Milk} value={summary.feeds} label="feeds" />
        <StatTile icon={Moon} value={`${sleepHours}h ${sleepMins}m`} label="sleep" />
        <StatTile icon={Baby} value={summary.diapers} label="diapers" />
      </section>

      <section aria-label="Today's log" className="flex flex-col gap-2">
        <h2 className="px-1 text-sm font-semibold text-muted-foreground">Today</h2>
        {timeline.length === 0 ? (
          <p className="rounded-xl bg-card p-6 text-center text-sm text-muted-foreground">
            Nothing logged yet. Tap <span className="font-medium text-foreground">Feed</span> below
            to start.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {timeline.map((e) => (
              <EventRow key={e.id} event={e} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
