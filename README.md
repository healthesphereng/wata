# wata

The one-handed baby tracker. Feeds, sleep, and diapers — logged in a tap or two, even at 3 AM, even offline.

- **Product scope & principles:** [docs/BRIEF.md](docs/BRIEF.md)
- **Technical decisions:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## Stack

Next.js (App Router) · TypeScript strict · Tailwind CSS 4 + shadcn/ui · Supabase (Postgres, Auth, RLS) · offline-first PWA (IndexedDB outbox + sync)

## Setup

```bash
npm install
cp .env.example .env.local   # fill in from Supabase Dashboard → Project Settings → API Keys
npm run dev                  # http://localhost:3000
```

| Env var                                | What it is                                                 |
| -------------------------------------- | ---------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | `https://<project-ref>.supabase.co`                        |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | browser-safe key (`sb_publishable_...`)                    |
| `SUPABASE_SECRET_KEY`                  | server-only key (`sb_secret_...`) — never expose or commit |

## Commands

```bash
npm run dev          # dev server
npm run build        # production build
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm test             # vitest (once)
npm run test:watch   # vitest (watch)
npm run format       # prettier
```

## Repository layout

```
src/app          routes (thin)          src/lib/events    domain logic (pure, tested)
src/components   UI                     src/lib/offline   IndexedDB + sync (pure core, tested)
src/hooks        React bindings         src/lib/supabase  clients + generated DB types
supabase/        SQL migrations + RLS   docs/             brief, architecture, ADRs
```
