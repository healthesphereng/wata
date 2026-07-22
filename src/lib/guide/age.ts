import { differenceInCalendarDays } from 'date-fns';

/**
 * Age math for the coach. Everything downstream (feeding bands, vaccine due
 * dates) works in whole days since birth so the boundaries are unambiguous.
 */

export function ageInDays(birthDate: string, on: Date = new Date()): number {
  return Math.max(0, differenceInCalendarDays(on, new Date(birthDate)));
}

/** Approximate months for banding — WHO tables use 30.4375-day months. */
export function ageInMonths(days: number): number {
  return days / 30.4375;
}

/** Human age label: days, then weeks, then months, then years. */
export function formatAge(days: number): string {
  if (days < 14) return days === 1 ? '1 day old' : `${days} days old`;
  if (days < 84) {
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? '1 week old' : `${weeks} weeks old`;
  }
  const months = Math.floor(ageInMonths(days));
  if (months < 24) return months === 1 ? '1 month old' : `${months} months old`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const yearPart = years === 1 ? '1 year' : `${years} years`;
  return rest === 0 ? `${yearPart} old` : `${yearPart} ${rest} months old`;
}
