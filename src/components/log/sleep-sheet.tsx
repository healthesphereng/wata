'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Moon, Square } from 'lucide-react';
import { useAppData } from '@/providers/app-data';
import { useEvents } from '@/hooks/use-events';
import { useElapsed } from '@/hooks/use-elapsed';
import { startSleepEvent, stopEvent } from '@/lib/events/factories';
import { findRunningSleep } from '@/lib/events/today';
import { logEvent } from '@/lib/offline/local-repo';
import { formatClock } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

/** "HH:MM" today → Date. */
function timeToday(hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function toTimeValue(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function SleepSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { selectedChild, userId } = useAppData();
  const { events } = useEvents();

  const childEvents = selectedChild ? events.filter((e) => e.child_id === selectedChild.id) : [];
  const running = findRunningSleep(childEvents);
  const elapsed = useElapsed(running?.started_at ?? null, Boolean(running) && open);

  const now = new Date();
  const [startTime, setStartTime] = useState(() =>
    toTimeValue(new Date(now.getTime() - 3_600_000))
  );
  const [endTime, setEndTime] = useState(() => toTimeValue(now));

  async function startNow() {
    if (!selectedChild) return;
    const event = startSleepEvent({
      familyId: selectedChild.family_id,
      childId: selectedChild.id,
      createdBy: userId,
    });
    await logEvent(event);
    onOpenChange(false);
    toast.success('Sleep started');
  }

  async function stopNow() {
    if (!running) return;
    await logEvent(stopEvent(running));
    onOpenChange(false);
    toast.success('Sleep stopped');
  }

  async function saveManual() {
    if (!selectedChild) return;
    const start = timeToday(startTime);
    const end = timeToday(endTime);
    if (end <= start) {
      toast.error('End time must be after start time');
      return;
    }
    const started = startSleepEvent(
      { familyId: selectedChild.family_id, childId: selectedChild.id, createdBy: userId },
      start
    );
    await logEvent(stopEvent(started, end));
    onOpenChange(false);
    toast.success('Sleep added');
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-6">
        <DialogHeader>
          <DialogTitle>Sleep{selectedChild ? ` · ${selectedChild.name}` : ''}</DialogTitle>
        </DialogHeader>

        {running ? (
          <div className="flex flex-col items-center gap-5">
            <div className="flex flex-col items-center gap-1">
              <span className="text-sm text-muted-foreground">Sleeping</span>
              <span className="text-5xl font-bold tabular-nums" aria-live="polite">
                {formatClock(elapsed)}
              </span>
            </div>
            <Button onClick={stopNow} className="h-14 w-full gap-2 text-lg">
              <Square className="size-5 fill-current" />
              Stop sleep
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <Button
              onClick={startNow}
              disabled={!selectedChild}
              className="h-16 w-full gap-2 text-lg"
            >
              <Moon className="size-6" />
              Start sleep now
            </Button>

            <div className="flex flex-col gap-3">
              <span className="text-sm font-medium text-muted-foreground">Or add a past sleep</span>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="sleep-start">From</Label>
                  <Input
                    id="sleep-start"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="h-12 text-base"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="sleep-end">To</Label>
                  <Input
                    id="sleep-end"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="h-12 text-base"
                  />
                </div>
              </div>
              <Button variant="outline" onClick={saveManual} className="h-12 text-base">
                Add sleep
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
