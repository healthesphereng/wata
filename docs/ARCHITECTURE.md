# Wata — Architecture

_Decisions and their reasons. Update this when a decision changes; add an ADR under `docs/adr/` for anything contentious._

## 1. The shape of the system

Wata is an **offline-first PWA**. The defining requirement: _log a feed in a dead zone at 3 AM and lose nothing._ Everything follows from that.

```
tap
 └→ zod-validated event object (client-generated UUID)
     └→ IndexedDB, immediately          ← the UI reads & renders from here (optimistic, instant)
         └→ outbox queue → sync engine → Supabase upsert (idempotent, RLS-checked)
         ←  pull: rows with updated_at > last-sync watermark → merged into IndexedDB
```

- **The UI never waits for the network.** IndexedDB is the primary store the app reads; Supabase is the durable replica it syncs with.
- **Client-generated UUIDs** make every write idempotent: retries, double-taps, and repeated queue flushes cannot create duplicates.
- **Sync triggers**: `online` event, tab visibility, app start, and after every local write when online. No dependency on the Background Sync API (Chromium-only; iPhones matter here).
- **Conflict policy**: last-write-wins per row via `updated_at`. Logs are append-mostly, so real conflicts are rare; when co-parenting arrives, two caregivers logging _different_ events never conflict at all.
- **Running timers are rows** with `ended_at = NULL` — a sleep timer survives app restarts and offline periods, and syncs across devices for free.
- **Deletes are soft** (`deleted_at`) so they propagate through sync like any other update.

## 2. Data model

Two decisions make the "later" features (milestones, vaccinations, co-parenting, growth charts) additive instead of migrations:

1. **Children belong to a family, not a user.** `families` ← `family_members` (user, role) and `children.family_id`. Adding a co-parent later = inserting one membership row.
2. **One `events` table for every tracker.** A new tracker later (milestone, vaccine, measurement, medication) is a new `kind` value + a new zod payload schema — the timeline query, sync engine, and RLS policies don't change.

```
auth.users (Supabase-managed)
 └── profiles        user_id PK→auth.users, display_name, created_at

families             id PK, name, created_at
family_members       (family_id, user_id) PK, role 'owner'|'caregiver', joined_at
children             id PK, family_id FK, name, birth_date, sex?, archived_at?

events               id uuid PK (client-generated)
                     family_id FK (denormalized for RLS + sync), child_id FK
                     kind 'feed'|'sleep'|'diaper'
                     started_at timestamptz, ended_at timestamptz NULL
                     details jsonb  — zod-validated per kind:
                       feed   { method: breast|bottle|pump, side?, amount_ml?, duration_s? }
                       diaper { contents: wet|dirty|mixed|dry }
                       sleep  { }
                     note text NULL
                     created_by, created_at, updated_at, deleted_at NULL

indexes  (child_id, started_at DESC)   — timeline/today
         (family_id, updated_at)      — incremental sync pulls
```

**Security**: RLS on every table, deny-by-default. You can read/write rows only for families you're a member of. The browser uses the publishable key + user JWT; the secret key exists only in server-side env for administrative jobs.

## 3. Why not Prisma (decided 2026-07-16)

Prisma was in the original spec and was dropped deliberately:

- Prisma runs server-side with a privileged connection, **bypassing RLS** — forcing either an all-server data path (losing the client SDK + realtime) or two parallel data paths.
- Serverless Prisma needs connection-pooling ceremony (pgbouncer mode, split URLs) with zero user value.
- Offline-first moves the interesting logic client-side anyway; sync is a handful of idempotent upserts, not rich ORM queries.

Instead: **SQL migrations in `supabase/migrations/` are the schema's source of truth**, `supabase gen types typescript` generates end-to-end types from the real database, and RLS is the security model. Realtime subscriptions (for co-parenting) work natively later because writes go through Postgres either way.

## 4. Code layout

```
src/
  app/            routes only — thin, no business logic
    (app)/        authed shell: bottom thumb bar, child switcher; today/, log/, settings/
    auth/         sign-in + OAuth callback
  components/
    ui/           shadcn primitives (generated)
    log/          BigTapButton, TimerCard, SideToggle, UndoToast
    timeline/
  lib/
    events/       DOMAIN: event schemas (zod), factories, today-selectors. Pure TS. Unit-tested.
    offline/      SYNC:   IndexedDB store, outbox, sync engine. Pure TS core. Unit-tested.
    supabase/     IO:     browser/server clients, generated DB types
  hooks/          React bindings over lib/ (useTimer, useTodaySummary, useSyncStatus)
supabase/migrations/   SQL + RLS — source of truth
tests/                 Vitest + Testing Library (setup in tests/setup.ts)
```

The seam that matters: **`lib/events` and `lib/offline` import neither React nor Supabase.** The most critical behavior (what happens to a log entry created offline) is plain TypeScript that unit tests exercise without mocks of anything heavier than an in-memory store.

## 5. UX architecture

- **Bottom thumb bar** on every authed screen: three oversized (≥56px) buttons — Feed, Sleep, Diaper. Two taps max from anywhere to a saved log.
- **Smart defaults**: feed pre-fills from the previous feed (method, alternated breast side, last bottle amount). Confirm = one tap; editing is optional, never required.
- **Undo toast, never confirm dialogs.**
- **Dark theme is the default** (`<html class="dark">`); light mode is the toggle (next-themes). `themeColor` matches so the browser chrome doesn't flash white at night.
- Semantic HTML, labelled controls, and visible focus states throughout; timers announce running state via live regions.

## 6. Environments & deployment

- Supabase project `kqtkqemfjbuizscwqsry` (EU by default naming; single project for MVP — staging later if needed).
- Vercel project `wata`, separate from everything else. `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`.
- Google OAuth is configured in the Supabase dashboard (Auth → Providers), not in app code.
