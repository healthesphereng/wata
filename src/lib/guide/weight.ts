import { ageInMonths } from './age';

/**
 * Body weight for the coach. Parents enter the latest clinic weight; until
 * they do, we estimate from the WHO weight-for-age growth-standard medians so
 * the guidance still works out of the box. Entered weights are stored
 * per-child on this device (localStorage) — a synced `measure` event kind is
 * the planned upgrade path (see events schema notes).
 */

export type Sex = 'male' | 'female' | null;

// WHO Child Growth Standards, weight-for-age medians (kg) at monthly ages.
// Index = age in months, 0–24.
const MEDIAN_BOYS = [
  3.3, 4.5, 5.6, 6.4, 7.0, 7.5, 7.9, 8.3, 8.6, 8.9, 9.2, 9.4, 9.6, 9.9, 10.1, 10.3, 10.5, 10.7,
  10.9, 11.1, 11.3, 11.5, 11.8, 12.0, 12.2,
];
const MEDIAN_GIRLS = [
  3.2, 4.2, 5.1, 5.8, 6.4, 6.9, 7.3, 7.6, 7.9, 8.2, 8.5, 8.7, 8.9, 9.2, 9.4, 9.6, 9.8, 10.0,
  10.2, 10.4, 10.6, 10.9, 11.1, 11.3, 11.5,
];

/** Median-based estimate; clamps beyond 24 months to the 24-month value. */
export function estimateWeightKg(ageDays: number, sex: Sex = null): number {
  const months = Math.min(24, Math.max(0, ageInMonths(ageDays)));
  const lo = Math.floor(months);
  const hi = Math.min(24, lo + 1);
  const t = months - lo;
  const at = (table: number[]) => table[lo] + (table[hi] - table[lo]) * t;
  const kg =
    sex === 'male'
      ? at(MEDIAN_BOYS)
      : sex === 'female'
        ? at(MEDIAN_GIRLS)
        : (at(MEDIAN_BOYS) + at(MEDIAN_GIRLS)) / 2;
  return Math.round(kg * 10) / 10;
}

// ---------- WHO percentile band (for the growth chart) ----------

// Approximate WHO weight-for-age 3rd/97th percentiles (kg) at anchor months.
// Enough to draw the healthy band a clinic chart shows; the median tables
// above carry the centre line.
const BAND_MONTHS = [0, 1, 2, 3, 6, 9, 12, 18, 24] as const;
const P3_BOYS = [2.5, 3.4, 4.3, 5.0, 6.4, 7.1, 7.7, 8.8, 9.7];
const P97_BOYS = [4.4, 5.8, 7.1, 8.0, 9.8, 10.9, 11.8, 13.7, 15.3];
const P3_GIRLS = [2.4, 3.2, 3.9, 4.5, 5.7, 6.5, 7.0, 8.1, 9.0];
const P97_GIRLS = [4.2, 5.5, 6.6, 7.5, 9.3, 10.5, 11.5, 13.2, 14.8];

function interpolateAnchored(months: number, values: number[]): number {
  const m = Math.min(24, Math.max(0, months));
  let i = 0;
  while (i < BAND_MONTHS.length - 1 && BAND_MONTHS[i + 1] < m) i++;
  const lo = BAND_MONTHS[i];
  const hi = BAND_MONTHS[Math.min(i + 1, BAND_MONTHS.length - 1)];
  const t = hi === lo ? 0 : (m - lo) / (hi - lo);
  const v = values[i] + (values[Math.min(i + 1, values.length - 1)] - values[i]) * t;
  return Math.round(v * 10) / 10;
}

/** The healthy weight band (approx. WHO P3–P97) at an age, for charting. */
export function weightBand(ageDays: number, sex: Sex = null): { low: number; high: number } {
  const months = ageInMonths(ageDays);
  const lowOf = (b: number[], g: number[]) =>
    sex === 'male'
      ? interpolateAnchored(months, b)
      : sex === 'female'
        ? interpolateAnchored(months, g)
        : Math.round(((interpolateAnchored(months, b) + interpolateAnchored(months, g)) / 2) * 10) /
          10;
  return { low: lowOf(P3_BOYS, P3_GIRLS), high: lowOf(P97_BOYS, P97_GIRLS) };
}

// ---------- on-device weight entries ----------

export interface WeightEntry {
  kg: number;
  recordedAt: string; // ISO date
}

const legacyKey = (childId: string) => `wata:weight:${childId}`;
const historyKey = (childId: string) => `wata:weights:${childId}`;

/** All on-device entries for a child, oldest first. Migrates the old single-entry key. */
export function loadWeightHistory(childId: string): WeightEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(historyKey(childId));
    let entries: WeightEntry[] = raw ? (JSON.parse(raw) as WeightEntry[]) : [];
    if (entries.length === 0) {
      const legacy = localStorage.getItem(legacyKey(childId));
      if (legacy) {
        const parsed = JSON.parse(legacy) as WeightEntry;
        if (typeof parsed.kg === 'number' && parsed.kg > 0) entries = [parsed];
      }
    }
    return entries
      .filter((e) => typeof e.kg === 'number' && e.kg > 0)
      .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
  } catch {
    return [];
  }
}

/** Latest entered weight, if any. */
export function loadWeight(childId: string): WeightEntry | null {
  const history = loadWeightHistory(childId);
  return history[history.length - 1] ?? null;
}

/** Appends to the history (replacing any same-day entry). */
export function saveWeight(childId: string, kg: number): WeightEntry {
  const entry: WeightEntry = { kg, recordedAt: new Date().toISOString() };
  const day = entry.recordedAt.slice(0, 10);
  const rest = loadWeightHistory(childId).filter((e) => e.recordedAt.slice(0, 10) !== day);
  localStorage.setItem(historyKey(childId), JSON.stringify([...rest, entry]));
  return entry;
}
