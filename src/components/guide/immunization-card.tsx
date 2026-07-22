'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Syringe } from 'lucide-react';
import { createVaccineEvent, softDeleteEvent } from '@/lib/events/factories';
import { logEvent } from '@/lib/offline/local-repo';
import { useEvents } from '@/hooks/use-events';
import {
  IMMUNIZATION_SCHEDULE,
  visitDueDate,
  visitStatus,
  type VaccineVisit,
  type VisitStatus,
} from '@/lib/guide/immunization';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const STATUS_CHIP: Record<VisitStatus, { label: string; className: string }> = {
  due: { label: 'Due now', className: 'bg-mint-soft/70 text-foreground' },
  next: { label: 'Up next', className: 'bg-primary/15 text-primary' },
  past: { label: 'Check card', className: 'bg-secondary text-subtle' },
  later: { label: 'Later', className: 'bg-secondary text-muted-foreground' },
};

/**
 * The routine immunization schedule (Nigeria NPI, WHO-aligned) as a timeline
 * of clinic visits with concrete due dates from the birth date. Visits can be
 * marked done (a synced vaccine event) once the remote supports the kind;
 * until then the card is read-only and the clinic card is the record.
 */
export function ImmunizationCard({
  birthDate,
  ageDays,
  childId,
  familyId,
  userId,
  syncEnabled,
}: {
  birthDate: string;
  ageDays: number;
  childId: string;
  familyId: string;
  userId: string;
  syncEnabled: boolean;
}) {
  const { events } = useEvents();

  const doneByVisit = useMemo(() => {
    const map = new Map<string, string>(); // visit_id -> done date (started_at)
    for (const e of events) {
      if (e.kind !== 'vaccine' || e.child_id !== childId || e.deleted_at) continue;
      const existing = map.get(e.details.visit_id);
      if (!existing || e.started_at < existing) map.set(e.details.visit_id, e.started_at);
    }
    return map;
  }, [events, childId]);

  async function markDone(visit: VaccineVisit) {
    const event = createVaccineEvent({
      familyId,
      childId,
      createdBy: userId,
      details: { visit_id: visit.id },
    });
    await logEvent(event);
    toast.success(`${visit.ageLabel} visit recorded`, {
      action: { label: 'Undo', onClick: () => void logEvent(softDeleteEvent(event)) },
    });
  }

  return (
    <section
      aria-label="Immunization schedule"
      className="shadow-soft flex flex-col gap-4 rounded-2xl bg-card p-4"
    >
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-soft/40 text-foreground">
          <Syringe className="size-5" aria-hidden />
        </span>
        <div>
          <h3 className="font-semibold">Immunization visits</h3>
          <p className="text-sm text-muted-foreground">
            Nigeria routine schedule (WHO-aligned) — dates from the birth date.
          </p>
        </div>
      </div>

      <ol className="flex flex-col gap-2">
        {IMMUNIZATION_SCHEDULE.map((visit) => {
          const doneAt = doneByVisit.get(visit.id);
          const status = visitStatus(visit, ageDays);
          const chip = STATUS_CHIP[status];
          const highlight = !doneAt && (status === 'due' || status === 'next');
          const canMark = syncEnabled && !doneAt && status !== 'later';
          return (
            <li
              key={visit.id}
              className={cn(
                'flex flex-col gap-2 rounded-xl border border-transparent p-3',
                highlight ? 'border-primary/30 bg-primary/5' : 'bg-secondary/60',
                !doneAt && status === 'past' && 'opacity-70'
              )}
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-semibold">{visit.ageLabel}</p>
                <p className="text-sm tabular-nums text-muted-foreground">
                  {format(visitDueDate(birthDate, visit), 'd MMM yyyy')}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {doneAt ? (
                  <span className="rounded-full bg-mint-soft px-2 py-0.5 text-xs font-semibold text-foreground">
                    ✓ Done · {format(new Date(doneAt), 'd MMM')}
                  </span>
                ) : (
                  <span
                    className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', chip.className)}
                  >
                    {chip.label}
                  </span>
                )}
                {visit.vaccines.map((v) => (
                  <span
                    key={v.name}
                    title={`Protects against ${v.protects}`}
                    className="rounded-full bg-card px-2 py-0.5 text-xs text-foreground/90 ring-1 ring-border"
                  >
                    {v.name}
                  </span>
                ))}
                {canMark && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-auto h-8"
                    onClick={() => void markDone(visit)}
                  >
                    Mark done
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {!syncEnabled && (
        <p className="text-xs text-subtle">
          Recording visits in wata arrives with the next update — for now the clinic card is the
          record.
        </p>
      )}
    </section>
  );
}
