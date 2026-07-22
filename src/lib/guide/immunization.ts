import { addDays } from 'date-fns';

/**
 * Routine immunization coach. The dataset is Nigeria's routine immunization
 * schedule (NPI, WHO-aligned) — visits keyed by age in days so due dates fall
 * out of birth_date arithmetic. Data-driven on purpose: other country
 * schedules can be added as alternative tables later. The clinic's card is
 * always the source of truth; the UI must say so.
 */

export interface Vaccine {
  name: string;
  /** What it protects against, in parent words. */
  protects: string;
}

export interface VaccineVisit {
  id: string;
  ageDays: number;
  ageLabel: string;
  vaccines: Vaccine[];
}

export const IMMUNIZATION_SCHEDULE: VaccineVisit[] = [
  {
    id: 'birth',
    ageDays: 0,
    ageLabel: 'At birth',
    vaccines: [
      { name: 'BCG', protects: 'tuberculosis' },
      { name: 'HepB0', protects: 'hepatitis B' },
      { name: 'OPV0', protects: 'polio' },
    ],
  },
  {
    id: '6w',
    ageDays: 42,
    ageLabel: '6 weeks',
    vaccines: [
      { name: 'Penta 1', protects: 'diphtheria, whooping cough, tetanus, hep B, Hib' },
      { name: 'PCV 1', protects: 'pneumonia' },
      { name: 'OPV 1', protects: 'polio' },
      { name: 'Rota 1', protects: 'rotavirus diarrhoea' },
    ],
  },
  {
    id: '10w',
    ageDays: 70,
    ageLabel: '10 weeks',
    vaccines: [
      { name: 'Penta 2', protects: 'diphtheria, whooping cough, tetanus, hep B, Hib' },
      { name: 'PCV 2', protects: 'pneumonia' },
      { name: 'OPV 2', protects: 'polio' },
      { name: 'Rota 2', protects: 'rotavirus diarrhoea' },
    ],
  },
  {
    id: '14w',
    ageDays: 98,
    ageLabel: '14 weeks',
    vaccines: [
      { name: 'Penta 3', protects: 'diphtheria, whooping cough, tetanus, hep B, Hib' },
      { name: 'PCV 3', protects: 'pneumonia' },
      { name: 'OPV 3', protects: 'polio' },
      { name: 'IPV 1', protects: 'polio (injected dose)' },
    ],
  },
  {
    id: '6m',
    ageDays: 183,
    ageLabel: '6 months',
    vaccines: [
      { name: 'Vitamin A', protects: 'vitamin A deficiency (first dose)' },
      { name: 'IPV 2', protects: 'polio (injected dose)' },
    ],
  },
  {
    id: '9m',
    ageDays: 274,
    ageLabel: '9 months',
    vaccines: [
      { name: 'Measles 1 (MCV1)', protects: 'measles' },
      { name: 'Yellow fever', protects: 'yellow fever' },
    ],
  },
  {
    id: '15m',
    ageDays: 456,
    ageLabel: '15 months',
    vaccines: [
      { name: 'Measles 2 (MCV2)', protects: 'measles (second dose)' },
      { name: 'MenA', protects: 'meningitis A' },
    ],
  },
];

/**
 * past  — the visit window has closed; check the clinic card / catch up.
 * due   — the visit age has arrived (within the 4-week window).
 * next  — the first visit still ahead.
 * later — everything after that.
 */
export type VisitStatus = 'past' | 'due' | 'next' | 'later';

const DUE_WINDOW_DAYS = 28;

export function visitStatus(visit: VaccineVisit, ageDays: number): VisitStatus {
  if (ageDays >= visit.ageDays) {
    return ageDays - visit.ageDays <= DUE_WINDOW_DAYS ? 'due' : 'past';
  }
  const next = IMMUNIZATION_SCHEDULE.find((v) => v.ageDays > ageDays);
  return next?.id === visit.id ? 'next' : 'later';
}

export function visitDueDate(birthDate: string, visit: VaccineVisit): Date {
  return addDays(new Date(birthDate), visit.ageDays);
}
