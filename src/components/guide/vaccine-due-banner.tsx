'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Syringe, ChevronRight } from 'lucide-react';
import { useEvents } from '@/hooks/use-events';
import { ageInDays } from '@/lib/guide/age';
import {
  IMMUNIZATION_SCHEDULE,
  visitDueDate,
  visitStatus,
} from '@/lib/guide/immunization';

/**
 * The coach reaching into Today: when an immunization visit is due (or lands
 * within the next 7 days), say so where parents actually look. Marking the
 * visit done on the Coach page clears it.
 */
export function VaccineDueBanner({
  childId,
  birthDate,
}: {
  childId: string;
  birthDate: string;
}) {
  const { events } = useEvents();

  const alert = useMemo(() => {
    const ageDays = ageInDays(birthDate);
    const done = new Set(
      events
        .filter((e) => e.kind === 'vaccine' && e.child_id === childId && !e.deleted_at)
        .map((e) => (e.kind === 'vaccine' ? e.details.visit_id : ''))
    );
    const open = IMMUNIZATION_SCHEDULE.filter((v) => !done.has(v.id));

    const dueNow = open.filter((v) => visitStatus(v, ageDays) === 'due');
    if (dueNow.length > 0) {
      const visit = dueNow[dueNow.length - 1]; // the most recent window
      return { visit, when: 'now' as const };
    }
    const soon = open.find(
      (v) => visitStatus(v, ageDays) === 'next' && v.ageDays - ageDays <= 7
    );
    return soon ? { visit: soon, when: 'soon' as const } : null;
  }, [events, childId, birthDate]);

  if (!alert) return null;

  const due = visitDueDate(birthDate, alert.visit);
  return (
    <Link
      href="/guide"
      className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-3 transition active:scale-[0.99]"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
        <Syringe className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">
          {alert.visit.ageLabel} vaccines {alert.when === 'now' ? 'are due' : 'coming up'}
        </span>
        <span className="block text-sm text-muted-foreground">
          {alert.when === 'now' ? 'due since' : 'due'} {format(due, 'EEEE d MMM')} · open the coach
        </span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
    </Link>
  );
}
