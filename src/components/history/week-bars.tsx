'use client';

import { useId, useState } from 'react';
import { format } from 'date-fns';

export interface WeekBarPoint {
  date: Date;
  value: number;
}

/**
 * One small bar-per-day chart for the week view. Bars wear the chart token,
 * data-ends are rounded and anchored to the baseline (rounded bottoms are
 * clipped off), only the max bar carries a direct label — tap any bar for
 * its value.
 */
export function WeekBars({
  points,
  formatValue,
}: {
  points: WeekBarPoint[];
  formatValue: (v: number) => string;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const clipId = useId();

  const W = 340;
  const H = 96;
  const B = 16; // room for weekday letters
  const T = 14; // room for the max label
  const max = Math.max(...points.map((p) => p.value), 1);
  const slot = W / points.length;
  const barW = Math.min(28, slot - 8);

  const xc = (i: number) => slot * i + slot / 2;
  const yTop = (v: number) => T + (H - T - B) * (1 - v / max);

  const maxIndex = points.reduce((best, p, i) => (p.value > points[best].value ? i : best), 0);
  const sel = selected !== null ? points[selected] : null;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Daily totals this week">
      <defs>
        <clipPath id={clipId}>
          <rect x="0" y="0" width={W} height={H - B} />
        </clipPath>
      </defs>

      {/* baseline */}
      <line x1="0" x2={W} y1={H - B} y2={H - B} className="stroke-border" strokeWidth="1" />

      <g clipPath={`url(#${clipId})`}>
        {points.map((p, i) =>
          p.value > 0 ? (
            <rect
              key={p.date.toISOString()}
              x={xc(i) - barW / 2}
              y={yTop(p.value)}
              width={barW}
              height={H - B - yTop(p.value) + 4} // +4 sinks the rounded bottom under the clip
              rx="4"
              className="fill-chart-1"
            />
          ) : (
            <rect
              key={p.date.toISOString()}
              x={xc(i) - barW / 2}
              y={H - B - 2}
              width={barW}
              height="2"
              className="fill-border"
            />
          )
        )}
      </g>

      {/* selective direct label: max bar only (skipped while a tap tooltip is up) */}
      {points[maxIndex].value > 0 && selected === null && (
        <text
          x={xc(maxIndex)}
          y={yTop(points[maxIndex].value) - 4}
          textAnchor="middle"
          className="fill-muted-foreground text-[10px] font-semibold tabular-nums"
        >
          {formatValue(points[maxIndex].value)}
        </text>
      )}

      {/* weekday letters */}
      {points.map((p, i) => (
        <text
          key={p.date.toISOString()}
          x={xc(i)}
          y={H - 4}
          textAnchor="middle"
          className="fill-subtle text-[9px]"
        >
          {format(p.date, 'EEEEE')}
        </text>
      ))}

      {/* tap targets + tooltip */}
      {points.map((p, i) => (
        <rect
          key={p.date.toISOString()}
          x={slot * i}
          y="0"
          width={slot}
          height={H}
          fill="transparent"
          onClick={() => setSelected(selected === i ? null : i)}
        />
      ))}
      {sel && (
        <g pointerEvents="none">
          <rect
            x={Math.min(Math.max(xc(selected!) - 46, 2), W - 94)}
            y="2"
            width="92"
            height="22"
            rx="8"
            className="fill-popover stroke-border"
          />
          <text
            x={Math.min(Math.max(xc(selected!) - 46, 2), W - 94) + 46}
            y="17"
            textAnchor="middle"
            className="fill-foreground text-[10px] font-semibold tabular-nums"
          >
            {format(sel.date, 'EEE d')} · {formatValue(sel.value)}
          </text>
        </g>
      )}
    </svg>
  );
}
