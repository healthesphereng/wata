'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { differenceInCalendarDays } from 'date-fns';
import { estimateWeightKg, weightBand, type Sex } from '@/lib/guide/weight';

export interface GrowthPoint {
  recordedAt: string; // ISO
  kg: number;
}

/**
 * Weight-for-age against the (approximate) WHO healthy band — the chart a
 * clinic growth card shows. One data series (the baby), a recessive band
 * (P3–P97), and a dashed median for context. Colors ride the theme tokens;
 * tap a point for its value. The entry list under it is the table view.
 */
export function GrowthChart({
  birthDate,
  sex,
  points,
}: {
  birthDate: string;
  sex: Sex;
  points: GrowthPoint[];
}) {
  const [selected, setSelected] = useState<number | null>(null);

  const { band, median, series, xMax, yMax, yMin } = useMemo(() => {
    const birth = new Date(birthDate);
    const series = points
      .map((p) => ({
        months: Math.max(0, differenceInCalendarDays(new Date(p.recordedAt), birth)) / 30.4375,
        kg: p.kg,
        at: p.recordedAt,
      }))
      .sort((a, b) => a.months - b.months);

    const nowMonths = Math.max(0, differenceInCalendarDays(new Date(), birth)) / 30.4375;
    const xMax = Math.min(24, Math.max(6, Math.ceil(nowMonths + 3)));

    const samples = Array.from({ length: xMax * 2 + 1 }, (_, i) => i / 2); // half-month steps
    const band = samples.map((m) => ({ m, ...weightBand(m * 30.4375, sex) }));
    const median = samples.map((m) => ({ m, kg: estimateWeightKg(m * 30.4375, sex) }));

    const highs = band.map((b) => b.high).concat(series.map((s) => s.kg));
    const lows = band.map((b) => b.low).concat(series.map((s) => s.kg));
    const yMax = Math.ceil(Math.max(...highs) + 0.5);
    const yMin = Math.max(0, Math.floor(Math.min(...lows) - 0.5));
    return { band, median, series, xMax, yMax, yMin };
  }, [birthDate, sex, points]);

  // Plot geometry (SVG user units; rendered responsive via viewBox).
  const W = 340;
  const H = 190;
  const L = 26;
  const R = 36;
  const T = 8;
  const B = 24;
  const x = (m: number) => L + ((W - L - R) * m) / xMax;
  const y = (kg: number) => T + (H - T - B) * (1 - (kg - yMin) / (yMax - yMin));

  const bandPath =
    band.map((b, i) => `${i === 0 ? 'M' : 'L'}${x(b.m).toFixed(1)},${y(b.high).toFixed(1)}`).join(' ') +
    ' ' +
    [...band].reverse().map((b) => `L${x(b.m).toFixed(1)},${y(b.low).toFixed(1)}`).join(' ') +
    ' Z';
  const medianPath = median
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.m).toFixed(1)},${y(p.kg).toFixed(1)}`)
    .join(' ');
  const seriesPath = series
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.months).toFixed(1)},${y(p.kg).toFixed(1)}`)
    .join(' ');

  const xTicks = xMax <= 8 ? [0, 2, 4, 6, 8].filter((t) => t <= xMax) : [0, 6, 12, 18, 24].filter((t) => t <= xMax);
  const yStep = yMax - yMin > 8 ? 4 : 2;
  const yTicks: number[] = [];
  for (let v = yMin; v <= yMax; v += yStep) yTicks.push(v);

  const sel = selected !== null ? series[selected] : null;

  return (
    <figure className="flex flex-col gap-1">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Weight-for-age chart against the WHO healthy range"
        className="w-full"
      >
        {/* recessive grid */}
        {yTicks.map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} className="stroke-border" strokeWidth="1" />
            <text
              x={L - 4}
              y={y(v) + 3}
              textAnchor="end"
              className="fill-subtle text-[9px] tabular-nums"
            >
              {v}
            </text>
          </g>
        ))}
        {xTicks.map((t) => (
          <text
            key={t}
            x={x(t)}
            y={H - 8}
            textAnchor="middle"
            className="fill-subtle text-[9px] tabular-nums"
          >
            {t}mo
          </text>
        ))}

        {/* WHO band + median (context, quieter than the data) */}
        <path d={bandPath} className="fill-primary/10" />
        <path
          d={medianPath}
          className="stroke-subtle"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          fill="none"
        />
        <text
          x={W - R + 4}
          y={y(band[band.length - 1].high) + 3}
          className="fill-subtle text-[9px]"
        >
          97th
        </text>
        <text x={W - R + 4} y={y(band[band.length - 1].low) + 3} className="fill-subtle text-[9px]">
          3rd
        </text>
        <text
          x={W - R + 4}
          y={y(median[median.length - 1].kg) + 3}
          className="fill-subtle text-[9px]"
        >
          median
        </text>

        {/* the baby's series */}
        {series.length > 1 && (
          <path d={seriesPath} className="stroke-chart-1" strokeWidth="2" fill="none" />
        )}
        {series.map((p, i) => (
          <g key={p.at}>
            {/* oversized hit target for touch */}
            <circle
              cx={x(p.months)}
              cy={y(p.kg)}
              r="12"
              fill="transparent"
              onClick={() => setSelected(selected === i ? null : i)}
            />
            <circle
              cx={x(p.months)}
              cy={y(p.kg)}
              r="4"
              className="fill-chart-1 stroke-card"
              strokeWidth="2"
              pointerEvents="none"
            />
          </g>
        ))}

        {/* tapped-point tooltip */}
        {sel && (
          <g pointerEvents="none">
            <rect
              x={Math.min(Math.max(x(sel.months) - 42, L), W - R - 84)}
              y={Math.max(y(sel.kg) - 34, 2)}
              width="84"
              height="24"
              rx="8"
              className="fill-popover stroke-border"
            />
            <text
              x={Math.min(Math.max(x(sel.months) - 42, L), W - R - 84) + 42}
              y={Math.max(y(sel.kg) - 34, 2) + 15}
              textAnchor="middle"
              className="fill-foreground text-[10px] font-semibold tabular-nums"
            >
              {sel.kg} kg · {format(new Date(sel.at), 'd MMM')}
            </text>
          </g>
        )}
      </svg>
      <figcaption className="text-xs text-subtle">
        Weight (kg) by age · shaded band ≈ WHO healthy range{sex ? '' : ' (sex not set)'}
      </figcaption>
    </figure>
  );
}
