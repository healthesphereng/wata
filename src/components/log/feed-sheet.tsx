'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Minus, Plus } from 'lucide-react';
import { useAppData } from '@/providers/app-data';
import { useEvents } from '@/hooks/use-events';
import { createFeedEvent, softDeleteEvent } from '@/lib/events/factories';
import { nextFeedDefaults } from '@/lib/events/defaults';
import { type FeedDetails, breastSides, feedMethods } from '@/lib/events/schemas';
import { logEvent } from '@/lib/offline/local-repo';
import { Button } from '@/components/ui/button';
import { Segmented } from '@/components/log/segmented';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const METHOD_LABEL = { breast: 'Breast', bottle: 'Bottle', pump: 'Pump' } as const;
const SIDE_LABEL = { left: 'Left', right: 'Right', both: 'Both' } as const;

/**
 * The feed controls. Mounted fresh each time the sheet opens, so the smart
 * defaults seed the initial state with no effect. Exported for testing.
 */
export function FeedForm({
  childId,
  familyId,
  userId,
  defaults,
  onDone,
}: {
  childId: string;
  familyId: string;
  userId: string;
  defaults: FeedDetails;
  onDone: () => void;
}) {
  const [method, setMethod] = useState(defaults.method);
  const [side, setSide] = useState(defaults.side ?? 'left');
  const [amount, setAmount] = useState(defaults.amount_ml ?? 60);
  const [pending, setPending] = useState(false);

  async function save() {
    setPending(true);
    const details: FeedDetails =
      method === 'breast'
        ? { method, side }
        : method === 'bottle'
          ? { method, amount_ml: amount }
          : { method, side, amount_ml: amount };

    const event = createFeedEvent({ familyId, childId, createdBy: userId, details });
    await logEvent(event);
    onDone();

    const summary =
      method === 'breast'
        ? `Breast · ${SIDE_LABEL[side]}`
        : `${METHOD_LABEL[method]} · ${amount} ml`;
    toast.success(`Feed logged — ${summary}`, {
      action: { label: 'Undo', onClick: () => void logEvent(softDeleteEvent(event)) },
    });
  }

  const showSide = method === 'breast' || method === 'pump';
  const showAmount = method === 'bottle' || method === 'pump';

  return (
    <>
      <Segmented
        label="Feed method"
        options={feedMethods}
        value={method}
        onChange={setMethod}
        labels={METHOD_LABEL}
      />
      {showSide && (
        <Segmented
          label="Side"
          options={breastSides}
          value={side}
          onChange={setSide}
          labels={SIDE_LABEL}
        />
      )}
      {showAmount && (
        <div className="flex items-center justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Less"
            className="size-14 shrink-0 rounded-full"
            onClick={() => setAmount((a) => Math.max(10, a - 10))}
          >
            <Minus className="size-6" />
          </Button>
          <div className="text-center">
            <div className="text-4xl font-bold tabular-nums">{amount}</div>
            <div className="text-xs text-muted-foreground">ml</div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="More"
            className="size-14 shrink-0 rounded-full"
            onClick={() => setAmount((a) => Math.min(2000, a + 10))}
          >
            <Plus className="size-6" />
          </Button>
        </div>
      )}
      <Button onClick={save} disabled={pending} className="h-14 w-full text-lg">
        {pending ? 'Saving…' : 'Save feed'}
      </Button>
    </>
  );
}

export function FeedSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { selectedChild, userId } = useAppData();
  const { events } = useEvents();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-6">
        <DialogHeader>
          <DialogTitle>Log a feed{selectedChild ? ` · ${selectedChild.name}` : ''}</DialogTitle>
        </DialogHeader>
        {open && selectedChild && (
          <FeedForm
            childId={selectedChild.id}
            familyId={selectedChild.family_id}
            userId={userId}
            defaults={nextFeedDefaults(events, selectedChild.id)}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
