import { format } from 'date-fns';
import { Milk, Moon, Baby, Scale, Syringe } from 'lucide-react';
import { type WataEvent } from '@/lib/events/schemas';
import { IMMUNIZATION_SCHEDULE } from '@/lib/guide/immunization';

const SIDE_LABEL = { left: 'left', right: 'right', both: 'both sides' } as const;
const CONTENTS_LABEL = { wet: 'Wet', dirty: 'Dirty', mixed: 'Mixed', dry: 'Dry' } as const;

function describe(event: WataEvent): {
  icon: typeof Milk;
  title: string;
  detail: string;
  tint: string;
} {
  if (event.kind === 'feed') {
    const d = event.details;
    const detail =
      d.method === 'breast'
        ? `Breast · ${d.side ? SIDE_LABEL[d.side] : ''}`
        : d.method === 'bottle'
          ? `Bottle · ${d.amount_ml ?? '?'} ml`
          : `Pump · ${d.amount_ml ?? '?'} ml`;
    return { icon: Milk, title: 'Feed', detail, tint: 'bg-primary/15 text-primary' };
  }
  if (event.kind === 'diaper') {
    return {
      icon: Baby,
      title: 'Diaper',
      detail: CONTENTS_LABEL[event.details.contents],
      tint: 'bg-mint-soft/60 text-foreground',
    };
  }
  if (event.kind === 'measure') {
    return {
      icon: Scale,
      title: 'Weight',
      detail: `${event.details.weight_kg} kg`,
      tint: 'bg-pink/45 text-pink-deep',
    };
  }
  if (event.kind === 'vaccine') {
    const visit = IMMUNIZATION_SCHEDULE.find((v) => v.id === event.details.visit_id);
    return {
      icon: Syringe,
      title: 'Vaccines',
      detail: visit ? `${visit.ageLabel} visit` : 'Clinic visit',
      tint: 'bg-blue-soft/40 text-foreground',
    };
  }
  // sleep
  const running = event.ended_at === null;
  const detail = running
    ? 'In progress'
    : `${format(new Date(event.started_at), 'h:mm a')} – ${format(new Date(event.ended_at!), 'h:mm a')}`;
  return { icon: Moon, title: 'Sleep', detail, tint: 'bg-blue-soft/40 text-foreground' };
}

export function EventRow({
  event,
  onSelect,
}: {
  event: WataEvent;
  onSelect: (e: WataEvent) => void;
}) {
  const { icon: Icon, title, detail, tint } = describe(event);
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(event)}
        className="shadow-soft flex w-full items-center gap-3 rounded-xl bg-card p-3 text-left transition-colors hover:bg-accent active:scale-[0.99]"
      >
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${tint}`}>
          <Icon className="size-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium">{title}</p>
          <p className="truncate text-sm text-muted-foreground">{detail}</p>
        </div>
        <time className="shrink-0 text-sm tabular-nums text-muted-foreground">
          {format(new Date(event.started_at), 'h:mm a')}
        </time>
      </button>
    </li>
  );
}
