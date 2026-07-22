'use client';

import { useState } from 'react';
import { Milk, Moon, Baby } from 'lucide-react';
import { useAppData } from '@/providers/app-data';
import { useEvents } from '@/hooks/use-events';
import { findRunningSleep } from '@/lib/events/today';
import { FeedSheet } from '@/components/log/feed-sheet';
import { DiaperSheet } from '@/components/log/diaper-sheet';
import { SleepSheet } from '@/components/log/sleep-sheet';
import { cn } from '@/lib/utils';

/**
 * Fixed bottom bar — the app's primary action surface, in thumb reach. All
 * three trackers are live. Buttons are 64px tall for one-handed 3 AM taps;
 * Sleep glows while a timer is running.
 */
export function ThumbBar() {
  const { selectedChild } = useAppData();
  const { events } = useEvents();
  const [feedOpen, setFeedOpen] = useState(false);
  const [diaperOpen, setDiaperOpen] = useState(false);
  const [sleepOpen, setSleepOpen] = useState(false);
  const disabled = !selectedChild;

  const sleeping = selectedChild
    ? Boolean(findRunningSleep(events.filter((e) => e.child_id === selectedChild.id)))
    : false;

  return (
    <>
      <nav
        aria-label="Log an activity"
        className="sticky bottom-0 z-10 grid grid-cols-3 gap-2 border-t border-border bg-background/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur"
      >
        <button
          type="button"
          disabled={disabled}
          onClick={() => setFeedOpen(true)}
          className="shadow-pill flex h-16 flex-col items-center justify-center gap-1 rounded-2xl bg-primary font-semibold text-primary-foreground transition active:scale-[0.98] disabled:opacity-40"
        >
          <Milk className="size-6" aria-hidden />
          <span className="text-sm">Feed</span>
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => setSleepOpen(true)}
          className={cn(
            'flex h-16 flex-col items-center justify-center gap-1 rounded-2xl border border-transparent font-semibold transition active:scale-[0.98] disabled:opacity-40',
            sleeping ? 'border-primary/40 bg-primary/15 text-primary' : 'bg-blue-soft/40 text-foreground'
          )}
        >
          <Moon className="size-6" aria-hidden />
          <span className="text-sm">{sleeping ? 'Sleeping' : 'Sleep'}</span>
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => setDiaperOpen(true)}
          className="flex h-16 flex-col items-center justify-center gap-1 rounded-2xl border border-transparent bg-mint-soft/60 font-semibold text-foreground transition active:scale-[0.98] disabled:opacity-40"
        >
          <Baby className="size-6" aria-hidden />
          <span className="text-sm">Diaper</span>
        </button>
      </nav>

      <FeedSheet open={feedOpen} onOpenChange={setFeedOpen} />
      <DiaperSheet open={diaperOpen} onOpenChange={setDiaperOpen} />
      <SleepSheet open={sleepOpen} onOpenChange={setSleepOpen} />
    </>
  );
}
