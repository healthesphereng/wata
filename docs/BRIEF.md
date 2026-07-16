# Wata — Product Brief

_The founder's original spec, recorded 16 July 2026. This is the source of truth for scope and principles._

A parenting app for new parents (newborn to preschool). **The app an exhausted parent uses one-handed at 3 AM while holding a crying baby.**

## MVP scope (build only these)

1. **Feeding tracker** — breastfeeding, bottle, pumping; log with 1–2 taps
2. **Sleep tracker** — start/stop timer plus manual entry
3. **Diaper log** — one tap per type
4. **Timeline / dashboard** — today at a glance
5. **Auth** — email + Google sign-in

Later (design the data model for these now; do not build): milestones, vaccinations, co-parenting sync, growth charts.

## Non-negotiable design principles

- **One-handed use**: primary actions in thumb reach, touch targets ≥ 44px
- **Dark mode first** (parents log at night)
- **Minimal typing** — taps, timers, and smart defaults over text input
- **One primary action per screen**
- **Fast**: instant perceived load, optimistic UI updates
- **Accessible**: semantic HTML, proper contrast, screen-reader support

## Stack (as agreed after review)

Next.js App Router + TypeScript strict · Tailwind CSS + shadcn/ui · Supabase (Postgres, auth, realtime) with **supabase-js + RLS + SQL migrations + generated types** (Prisma considered and dropped — see ARCHITECTURE.md) · PWA with offline-first logging (IndexedDB outbox, sync on reconnect).

## Working agreement

Plan → founder approves → build. Feature order: **auth → data model/migrations → feeding → diaper → sleep → dashboard.** Pause and summarize after each feature. Production quality from the start: strict types, ESLint + Prettier, Vitest + Testing Library, documented decisions.

## MVP decisions made

- Multiple children supported end-to-end (data model **and** a simple child switcher in the UI)
- Children belong to a _family_, not a user — co-parenting later is additive
- One `events` table for all trackers — future features are new event kinds, not new tables
- Supabase project: `kqtkqemfjbuizscwqsry` · Deployment target: Vercel
