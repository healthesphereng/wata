'use client';

import { useState } from 'react';
import { Milk, Moon, Baby } from 'lucide-react';
import { useAppData } from '@/providers/app-data';
import { FeedSheet } from '@/components/log/feed-sheet';
import { cn } from '@/lib/utils';

/**
 * Fixed bottom bar — the app's primary action surface, in thumb reach. Feed is
 * live; Sleep and Diaper light up in their own increments. Buttons are 64px
 * tall for one-handed 3 AM taps.
 */
export function ThumbBar() {
  const { selectedChild } = useAppData();
  const [feedOpen, setFeedOpen] = useState(false);
  const disabled = !selectedChild;

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
          className={cn(
            'flex h-16 flex-col items-center justify-center gap-1 rounded-2xl bg-primary font-semibold text-primary-foreground transition active:scale-[0.98] disabled:opacity-40'
          )}
        >
          <Milk className="size-6" aria-hidden />
          <span className="text-sm">Feed</span>
        </button>

        <button
          type="button"
          disabled
          aria-disabled
          className="flex h-16 flex-col items-center justify-center gap-1 rounded-2xl border border-border bg-card font-medium text-muted-foreground opacity-50"
        >
          <Moon className="size-6" aria-hidden />
          <span className="text-sm">Sleep</span>
        </button>

        <button
          type="button"
          disabled
          aria-disabled
          className="flex h-16 flex-col items-center justify-center gap-1 rounded-2xl border border-border bg-card font-medium text-muted-foreground opacity-50"
        >
          <Baby className="size-6" aria-hidden />
          <span className="text-sm">Diaper</span>
        </button>
      </nav>

      <FeedSheet open={feedOpen} onOpenChange={setFeedOpen} />
    </>
  );
}
