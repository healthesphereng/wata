'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Minus, Plus, Trash2, Square } from 'lucide-react';
import { reviseEvent, softDeleteEvent, stopEvent } from '@/lib/events/factories';
import { type WataEvent, breastSides, diaperContents, feedMethods } from '@/lib/events/schemas';
import { logEvent } from '@/lib/offline/local-repo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Segmented } from '@/components/log/segmented';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const METHOD_LABEL = { breast: 'Breast', bottle: 'Bottle', pump: 'Pump' } as const;
const SIDE_LABEL = { left: 'Left', right: 'Right', both: 'Both' } as const;
const CONTENTS_LABEL = { wet: 'Wet', dirty: 'Dirty', mixed: 'Mixed', dry: 'Dry' } as const;
const KIND_TITLE = { feed: 'Edit feed', diaper: 'Edit diaper', sleep: 'Edit sleep' } as const;

function timeValue(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
/** Combine a base day (from the event) with a new HH:MM. */
function withTime(baseIso: string, hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(baseIso);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

function DeleteButton({ onDelete }: { onDelete: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onDelete}
      className="h-11 gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
    >
      <Trash2 className="size-4" />
      Delete
    </Button>
  );
}

function EditForm({ event, onClose }: { event: WataEvent; onClose: () => void }) {
  // Common: the clock time of the event (instant events edit one time).
  const [time, setTime] = useState(timeValue(event.started_at));

  // Feed
  const [method, setMethod] = useState(event.kind === 'feed' ? event.details.method : 'breast');
  const [side, setSide] = useState<(typeof breastSides)[number]>(
    event.kind === 'feed' && event.details.side ? event.details.side : 'left'
  );
  const [amount, setAmount] = useState(
    event.kind === 'feed' && event.details.amount_ml ? event.details.amount_ml : 60
  );

  // Diaper
  const [contents, setContents] = useState<(typeof diaperContents)[number]>(
    event.kind === 'diaper' ? event.details.contents : 'wet'
  );

  // Sleep (finished): from / to
  const [from, setFrom] = useState(timeValue(event.started_at));
  const [to, setTo] = useState(
    event.ended_at ? timeValue(event.ended_at) : timeValue(event.started_at)
  );

  async function remove() {
    await logEvent(softDeleteEvent(event));
    onClose();
    toast.success('Deleted');
  }

  async function saveFeed() {
    const details =
      method === 'breast'
        ? { method, side }
        : method === 'bottle'
          ? { method, amount_ml: amount }
          : { method, side, amount_ml: amount };
    const at = withTime(event.started_at, time);
    await logEvent(reviseEvent(event, { details, started_at: at, ended_at: at }));
    onClose();
    toast.success('Feed updated');
  }

  async function saveDiaper() {
    const at = withTime(event.started_at, time);
    await logEvent(reviseEvent(event, { details: { contents }, started_at: at, ended_at: at }));
    onClose();
    toast.success('Diaper updated');
  }

  async function saveSleep() {
    const start = withTime(event.started_at, from);
    const end = withTime(event.ended_at ?? event.started_at, to);
    if (new Date(end) <= new Date(start)) {
      toast.error('End time must be after start time');
      return;
    }
    await logEvent(reviseEvent(event, { started_at: start, ended_at: end }));
    onClose();
    toast.success('Sleep updated');
  }

  if (event.kind === 'feed') {
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
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-time">Time</Label>
          <Input
            id="edit-time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="h-12 text-base"
          />
        </div>
        <Button onClick={saveFeed} className="h-14 w-full text-lg">
          Save changes
        </Button>
        <DeleteButton onDelete={remove} />
      </>
    );
  }

  if (event.kind === 'diaper') {
    return (
      <>
        <div className="grid grid-cols-4 gap-2" role="group" aria-label="Diaper type">
          {diaperContents.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={contents === c}
              onClick={() => setContents(c)}
              className={`h-14 rounded-xl border text-sm font-medium transition-colors ${contents === c ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card'}`}
            >
              {CONTENTS_LABEL[c]}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-time">Time</Label>
          <Input
            id="edit-time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="h-12 text-base"
          />
        </div>
        <Button onClick={saveDiaper} className="h-14 w-full text-lg">
          Save changes
        </Button>
        <DeleteButton onDelete={remove} />
      </>
    );
  }

  // sleep
  const running = event.ended_at === null;
  if (running) {
    return (
      <>
        <p className="text-center text-sm text-muted-foreground">
          This sleep is still in progress.
        </p>
        <Button
          onClick={async () => {
            await logEvent(stopEvent(event));
            onClose();
            toast.success('Sleep stopped');
          }}
          className="h-14 w-full gap-2 text-lg"
        >
          <Square className="size-5 fill-current" />
          Stop sleep
        </Button>
        <DeleteButton onDelete={remove} />
      </>
    );
  }
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-from">From</Label>
          <Input
            id="edit-from"
            type="time"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-12 text-base"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-to">To</Label>
          <Input
            id="edit-to"
            type="time"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-12 text-base"
          />
        </div>
      </div>
      <Button onClick={saveSleep} className="h-14 w-full text-lg">
        Save changes
      </Button>
      <DeleteButton onDelete={remove} />
    </>
  );
}

export function EditEventSheet({
  event,
  onOpenChange,
}: {
  event: WataEvent | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={Boolean(event)} onOpenChange={onOpenChange}>
      <DialogContent className="gap-6">
        <DialogHeader>
          <DialogTitle>{event ? KIND_TITLE[event.kind] : 'Edit'}</DialogTitle>
        </DialogHeader>
        {event && <EditForm key={event.id} event={event} onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}
