'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { useAppData } from '@/providers/app-data';
import { useEvents } from '@/hooks/use-events';
import { remoteSupportsGuideKinds } from '@/lib/offline/capabilities';
import { ageInDays, formatAge } from '@/lib/guide/age';
import { feedingGuidance } from '@/lib/guide/feeding';
import {
  estimateWeightKg,
  loadWeight,
  loadWeightHistory,
  type Sex,
  type WeightEntry,
} from '@/lib/guide/weight';
import { BirthDateCard } from '@/components/guide/birth-date-card';
import { WeightCard } from '@/components/guide/weight-card';
import { FeedingCard } from '@/components/guide/feeding-card';
import { GrowthChart, type GrowthPoint } from '@/components/guide/growth-chart';
import { ImmunizationCard } from '@/components/guide/immunization-card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * The coach: age- and weight-aware guidance for the selected child — what
 * feeding looks like right now, growth against the WHO band, and which
 * immunization visit is due when. General guidance for healthy, term babies;
 * the disclaimer is part of the screen, not fine print.
 */
export default function GuidePage() {
  const { selectedChild, userId, loading } = useAppData();
  const { events } = useEvents();
  const [weightEntry, setWeightEntry] = useState<WeightEntry | null>(null);
  const [syncKinds, setSyncKinds] = useState(false);

  useEffect(() => {
    setWeightEntry(selectedChild ? loadWeight(selectedChild.id) : null);
  }, [selectedChild]);

  useEffect(() => {
    let active = true;
    void remoteSupportsGuideKinds().then((ok) => {
      if (active) setSyncKinds(ok);
    });
    return () => {
      active = false;
    };
  }, []);

  const ageDays = useMemo(
    () => (selectedChild?.birth_date ? ageInDays(selectedChild.birth_date) : null),
    [selectedChild]
  );

  // Growth series: synced measure events merged with on-device entries
  // (events win on the same day — they're the durable copy).
  const growthPoints = useMemo<GrowthPoint[]>(() => {
    if (!selectedChild) return [];
    const byDay = new Map<string, GrowthPoint>();
    // weightEntry in deps keeps this fresh after a local save
    void weightEntry;
    for (const e of loadWeightHistory(selectedChild.id)) {
      byDay.set(e.recordedAt.slice(0, 10), { recordedAt: e.recordedAt, kg: e.kg });
    }
    for (const e of events) {
      if (e.kind !== 'measure' || e.child_id !== selectedChild.id || e.deleted_at) continue;
      byDay.set(e.started_at.slice(0, 10), {
        recordedAt: e.started_at,
        kg: e.details.weight_kg,
      });
    }
    return [...byDay.values()].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
  }, [selectedChild, events, weightEntry]);

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!selectedChild) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <h1 className="text-xl font-semibold">The coach needs a baby first</h1>
        <p className="max-w-xs text-sm text-muted-foreground">
          Add your baby on the Today screen and the coach will take it from there.
        </p>
        <Link href="/today" className="font-semibold text-primary underline underline-offset-4">
          Go to Today
        </Link>
      </div>
    );
  }

  if (!selectedChild.birth_date || ageDays === null) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <BirthDateCard childId={selectedChild.id} childName={selectedChild.name} />
      </div>
    );
  }

  const sex: Sex = selectedChild.sex === 'male' || selectedChild.sex === 'female' ? selectedChild.sex : null;
  const latest = growthPoints[growthPoints.length - 1] ?? null;
  const kg = latest?.kg ?? weightEntry?.kg ?? estimateWeightKg(ageDays, sex);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pb-8">
      <header className="px-1">
        <h1 className="text-xl font-bold">
          {selectedChild.name} · {formatAge(ageDays)}
        </h1>
        <p className="text-sm text-muted-foreground">What to do now, based on age and weight.</p>
      </header>

      <WeightCard
        childId={selectedChild.id}
        familyId={selectedChild.family_id}
        userId={userId}
        syncEnabled={syncKinds}
        ageDays={ageDays}
        entry={weightEntry}
        onSaved={setWeightEntry}
      />

      <FeedingCard guidance={feedingGuidance(ageDays, kg)} />

      {growthPoints.length > 0 && (
        <section
          aria-label="Growth"
          className="shadow-soft flex flex-col gap-3 rounded-2xl bg-card p-4"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-mint-soft/60 text-foreground">
              <TrendingUp className="size-5" aria-hidden />
            </span>
            <div>
              <h3 className="font-semibold">Growth</h3>
              <p className="text-sm text-muted-foreground">
                {selectedChild.name}&apos;s weight against the WHO healthy range.
              </p>
            </div>
          </div>
          <GrowthChart birthDate={selectedChild.birth_date} sex={sex} points={growthPoints} />
          <ul className="flex flex-col gap-1">
            {[...growthPoints].reverse().map((p) => (
              <li
                key={p.recordedAt}
                className="flex justify-between text-sm text-muted-foreground"
              >
                <span>{format(new Date(p.recordedAt), 'd MMM yyyy')}</span>
                <span className="font-semibold tabular-nums text-foreground">{p.kg} kg</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ImmunizationCard
        birthDate={selectedChild.birth_date}
        ageDays={ageDays}
        childId={selectedChild.id}
        familyId={selectedChild.family_id}
        userId={userId}
        syncEnabled={syncKinds}
      />

      <p className="px-1 text-xs leading-relaxed text-subtle">
        The coach gives general guidance for healthy, full-term babies — feeding from WHO
        infant-feeding guidance, vaccines from Nigeria&apos;s routine immunization schedule
        (WHO-aligned), growth against approximate WHO reference ranges. It is not medical advice:
        your clinic&apos;s card and health workers always come first.
      </p>
    </div>
  );
}
