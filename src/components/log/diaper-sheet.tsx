'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Droplet, CircleDashed } from 'lucide-react';
import { useAppData } from '@/providers/app-data';
import { createDiaperEvent, softDeleteEvent } from '@/lib/events/factories';
import { type DiaperDetails, diaperContents } from '@/lib/events/schemas';
import { logEvent } from '@/lib/offline/local-repo';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type Contents = DiaperDetails['contents'];

// Each type is one tap. Colours are pastel tints, never the only signal —
// the label carries the meaning for accessibility.
const OPTIONS: { value: Contents; label: string; hint: string; className: string }[] = [
  {
    value: 'wet',
    label: 'Wet',
    hint: 'Pee only',
    className: 'border-transparent bg-blue-soft/35 text-sky-500',
  },
  {
    value: 'dirty',
    label: 'Dirty',
    hint: 'Poo only',
    className: 'border-transparent bg-pink/45 text-pink-deep',
  },
  {
    value: 'mixed',
    label: 'Mixed',
    hint: 'Both',
    className: 'border-transparent bg-mint-soft/60 text-mint',
  },
  {
    value: 'dry',
    label: 'Dry',
    hint: 'Clean',
    className: 'border-transparent bg-secondary text-subtle',
  },
];

export function DiaperSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { selectedChild, userId } = useAppData();
  const [pending, setPending] = useState<Contents | null>(null);

  async function log(contents: Contents) {
    if (!selectedChild) return;
    setPending(contents);

    const event = createDiaperEvent({
      familyId: selectedChild.family_id,
      childId: selectedChild.id,
      createdBy: userId,
      details: { contents },
    });
    await logEvent(event);

    setPending(null);
    onOpenChange(false);
    const label = OPTIONS.find((o) => o.value === contents)!.label;
    toast.success(`Diaper logged — ${label}`, {
      action: { label: 'Undo', onClick: () => void logEvent(softDeleteEvent(event)) },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-6">
        <DialogHeader>
          <DialogTitle>Log a diaper{selectedChild ? ` · ${selectedChild.name}` : ''}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          {OPTIONS.map((opt) => {
            const Icon = opt.value === 'dry' ? CircleDashed : Droplet;
            return (
              <button
                key={opt.value}
                type="button"
                disabled={pending !== null || !selectedChild}
                onClick={() => log(opt.value)}
                className={cn(
                  'flex h-24 flex-col items-center justify-center gap-1 rounded-2xl border bg-card font-semibold transition active:scale-[0.98] disabled:opacity-50',
                  opt.className
                )}
              >
                <Icon className="size-7" aria-hidden />
                <span className="text-lg text-foreground">{opt.label}</span>
                <span className="text-xs font-normal text-muted-foreground">{opt.hint}</span>
              </button>
            );
          })}
        </div>
        {/* schema safety: OPTIONS must stay in sync with the allowed values */}
        <span className="sr-only">{diaperContents.join(' ')}</span>
      </DialogContent>
    </Dialog>
  );
}
