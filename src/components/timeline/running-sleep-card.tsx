'use client';

import { toast } from 'sonner';
import { Moon, Square } from 'lucide-react';
import { useElapsed } from '@/hooks/use-elapsed';
import { type WataEvent } from '@/lib/events/schemas';
import { stopEvent } from '@/lib/events/factories';
import { logEvent } from '@/lib/offline/local-repo';
import { formatClock } from '@/lib/format';
import { Button } from '@/components/ui/button';

/**
 * The at-a-glance running sleep timer on Today — when a baby is asleep,
 * stopping it is the screen's primary action, so it sits up top, live and
 * prominent, with a big Stop button.
 */
export function RunningSleepCard({ event }: { event: WataEvent }) {
  const elapsed = useElapsed(event.started_at, true);

  async function stop() {
    await logEvent(stopEvent(event));
    toast.success('Sleep stopped');
  }

  return (
    <section
      aria-label="Sleep in progress"
      className="flex items-center gap-4 rounded-2xl border border-primary/30 bg-primary/10 p-4"
    >
      <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
        <Moon className="size-6" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground">Asleep</p>
        <p className="text-3xl font-bold tabular-nums" aria-live="polite">
          {formatClock(elapsed)}
        </p>
      </div>
      <Button onClick={stop} className="h-12 shrink-0 gap-2">
        <Square className="size-4 fill-current" />
        Stop
      </Button>
    </section>
  );
}
