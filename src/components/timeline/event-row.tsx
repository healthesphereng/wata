import { format } from 'date-fns';
import { Milk, Moon, Baby } from 'lucide-react';
import { type WataEvent } from '@/lib/events/schemas';

const SIDE_LABEL = { left: 'left', right: 'right', both: 'both sides' } as const;
const CONTENTS_LABEL = { wet: 'Wet', dirty: 'Dirty', mixed: 'Mixed', dry: 'Dry' } as const;

function describe(event: WataEvent): { icon: typeof Milk; title: string; detail: string } {
  if (event.kind === 'feed') {
    const d = event.details;
    const detail =
      d.method === 'breast'
        ? `Breast · ${d.side ? SIDE_LABEL[d.side] : ''}`
        : d.method === 'bottle'
          ? `Bottle · ${d.amount_ml ?? '?'} ml`
          : `Pump · ${d.amount_ml ?? '?'} ml`;
    return { icon: Milk, title: 'Feed', detail };
  }
  if (event.kind === 'diaper') {
    return { icon: Baby, title: 'Diaper', detail: CONTENTS_LABEL[event.details.contents] };
  }
  // sleep
  const running = event.ended_at === null;
  const detail = running
    ? 'In progress'
    : `${format(new Date(event.started_at), 'h:mm a')} – ${format(new Date(event.ended_at!), 'h:mm a')}`;
  return { icon: Moon, title: 'Sleep', detail };
}

export function EventRow({ event }: { event: WataEvent }) {
  const { icon: Icon, title, detail } = describe(event);
  return (
    <li className="flex items-center gap-3 rounded-xl bg-card p-3">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <Icon className="size-5" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{title}</p>
        <p className="truncate text-sm text-muted-foreground">{detail}</p>
      </div>
      <time className="shrink-0 text-sm tabular-nums text-muted-foreground">
        {format(new Date(event.started_at), 'h:mm a')}
      </time>
    </li>
  );
}
