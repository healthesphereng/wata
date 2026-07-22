'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Scale } from 'lucide-react';
import { createMeasureEvent } from '@/lib/events/factories';
import { logEvent } from '@/lib/offline/local-repo';
import { estimateWeightKg, saveWeight, type WeightEntry } from '@/lib/guide/weight';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * The weight the whole coach runs on. Shows the latest entered (clinic)
 * weight, or a WHO median estimate until one is entered. Entries always land
 * on-device; once the remote supports the 'measure' kind (syncEnabled) they
 * are also logged as synced events.
 */
export function WeightCard({
  childId,
  familyId,
  userId,
  syncEnabled,
  ageDays,
  entry,
  onSaved,
}: {
  childId: string;
  familyId: string;
  userId: string;
  syncEnabled: boolean;
  ageDays: number;
  entry: WeightEntry | null;
  onSaved: (entry: WeightEntry) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const estimate = estimateWeightKg(ageDays);
  const kg = entry?.kg ?? estimate;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const parsed = Number(value.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed < 0.5 || parsed > 30) {
      toast.error('Enter a weight between 0.5 and 30 kg.');
      return;
    }
    const kg = Math.round(parsed * 10) / 10;
    const saved = saveWeight(childId, kg);
    if (syncEnabled) {
      await logEvent(
        createMeasureEvent({ familyId, childId, createdBy: userId, details: { weight_kg: kg } })
      );
    }
    onSaved(saved);
    setEditing(false);
    setValue('');
    toast.success(`Weight updated — ${saved.kg} kg`);
  }

  return (
    <section aria-label="Weight" className="shadow-soft flex flex-col gap-3 rounded-2xl bg-card p-4">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-pink/45 text-pink-deep">
          <Scale className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground">Current weight</p>
          <p className="text-2xl font-bold tabular-nums">
            {kg.toFixed(1)} <span className="text-base font-semibold">kg</span>
          </p>
          <p className="text-xs text-subtle">
            {entry
              ? `entered ${format(new Date(entry.recordedAt), 'd MMM')}`
              : 'estimated from age — enter the last clinic weight for tighter numbers'}
          </p>
        </div>
        {!editing && (
          <Button variant="outline" className="h-10 shrink-0" onClick={() => setEditing(true)}>
            Update
          </Button>
        )}
      </div>
      {editing && (
        <form onSubmit={save} className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="decimal"
            step="0.1"
            min="0.5"
            max="30"
            autoFocus
            placeholder={kg.toFixed(1)}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-label="Weight in kilograms"
            className="h-12 text-base"
          />
          <Button type="submit" className="h-12 shrink-0">
            Save
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-12 shrink-0"
            onClick={() => setEditing(false)}
          >
            Cancel
          </Button>
        </form>
      )}
    </section>
  );
}
