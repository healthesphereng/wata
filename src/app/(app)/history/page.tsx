'use client';

import { useMemo } from 'react';
import { Milk, Moon, Baby } from 'lucide-react';
import { useAppData } from '@/providers/app-data';
import { useEvents } from '@/hooks/use-events';
import { summarizeWeek } from '@/lib/events/history';
import { WeekBars } from '@/components/history/week-bars';
import { Skeleton } from '@/components/ui/skeleton';

const HOUR = 3_600_000;

function fmtHours(ms: number): string {
  const h = ms / HOUR;
  return h >= 10 ? `${Math.round(h)}h` : `${Math.round(h * 10) / 10}h`;
}

function WeekCard({
  icon: Icon,
  tint,
  title,
  subtitle,
  children,
}: {
  icon: typeof Milk;
  tint: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-label={title} className="shadow-soft flex flex-col gap-3 rounded-2xl bg-card p-4">
      <div className="flex items-center gap-3">
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${tint}`}>
          <Icon className="size-5" aria-hidden />
        </span>
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

/** The week view: what the last 7 days actually looked like, per tracker. */
export default function HistoryPage() {
  const { selectedChild, loading } = useAppData();
  const { events } = useEvents();

  const week = useMemo(() => {
    if (!selectedChild) return [];
    return summarizeWeek(events.filter((e) => e.child_id === selectedChild.id));
  }, [events, selectedChild]);

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (!selectedChild) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <h1 className="text-xl font-semibold">Nothing to look back on yet</h1>
        <p className="max-w-xs text-sm text-muted-foreground">
          Add your baby on the Today screen and the week fills in as you log.
        </p>
      </div>
    );
  }

  const totalFeeds = week.reduce((n, d) => n + d.feeds, 0);
  const totalDiapers = week.reduce((n, d) => n + d.diapers, 0);
  const totalSleepMs = week.reduce((n, d) => n + d.sleepMs, 0);
  const daysLogged = week.filter((d) => d.feeds + d.diapers > 0 || d.sleepMs > 0).length || 1;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pb-8">
      <header className="px-1">
        <h1 className="text-xl font-bold">This week</h1>
        <p className="text-sm text-muted-foreground">
          {selectedChild.name}&apos;s last 7 days, day by day.
        </p>
      </header>

      <WeekCard
        icon={Milk}
        tint="bg-primary/15 text-primary"
        title="Feeds"
        subtitle={`${totalFeeds} this week · about ${Math.round((totalFeeds / daysLogged) * 10) / 10} a day`}
      >
        <WeekBars
          points={week.map((d) => ({ date: d.date, value: d.feeds }))}
          formatValue={(v) => `${v}`}
        />
      </WeekCard>

      <WeekCard
        icon={Moon}
        tint="bg-blue-soft/40 text-foreground"
        title="Sleep"
        subtitle={`${fmtHours(totalSleepMs)} tracked · about ${fmtHours(totalSleepMs / daysLogged)} a day`}
      >
        <WeekBars
          points={week.map((d) => ({ date: d.date, value: d.sleepMs / HOUR }))}
          formatValue={(v) => `${Math.round(v * 10) / 10}h`}
        />
      </WeekCard>

      <WeekCard
        icon={Baby}
        tint="bg-mint-soft/60 text-foreground"
        title="Diapers"
        subtitle={`${totalDiapers} this week · about ${Math.round((totalDiapers / daysLogged) * 10) / 10} a day`}
      >
        <WeekBars
          points={week.map((d) => ({ date: d.date, value: d.diapers }))}
          formatValue={(v) => `${v}`}
        />
      </WeekCard>

      <p className="px-1 text-xs leading-relaxed text-subtle">
        Counts come from what you logged — a quiet chart usually means a busy day, not a problem.
      </p>
    </div>
  );
}
