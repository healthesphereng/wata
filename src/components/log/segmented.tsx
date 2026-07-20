'use client';

import { cn } from '@/lib/utils';

/** Segmented, large-target selector — one row of thumb-sized options. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  labels,
  label,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  labels: Record<T, string>;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="grid grid-cols-3 gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          aria-pressed={value === opt}
          onClick={() => onChange(opt)}
          className={cn(
            'h-12 rounded-xl border text-base font-medium transition-colors',
            value === opt
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-card text-foreground hover:bg-accent'
          )}
        >
          {labels[opt]}
        </button>
      ))}
    </div>
  );
}
