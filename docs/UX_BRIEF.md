# Wata — UX/UI Brainstorming Brief

_A self-contained brief for a design conversation. It assumes no access to the codebase — everything you need to reason about the product's experience is described here. Last updated 20 July 2026._

---

## 1. What Wata is

A **parenting app for new parents** (newborn to preschool). The guiding image:

> **The app an exhausted parent uses one-handed, in the dark, at 3 AM, while holding a crying baby.**

Its job is to make logging a baby's day — **feeds, sleep, and diapers** — so fast and so effortless that a depleted parent will actually do it, every time, without thinking. Then it reflects the day back clearly so parents (and later, their pediatrician) can see patterns.

**Who it's for:** first-time and early-stage parents, often sleep-deprived, frequently one-handed, often in a dark room, sometimes with no signal (nursery, basement, on the move). Not power users — people at their lowest cognitive capacity.

---

## 2. Design principles (the non-negotiables)

These are fixed commitments. New ideas should honor them, not fight them:

1. **One-handed use.** Every primary action must be reachable by a thumb. Large touch targets (minimum ~44px; the app currently uses 56–64px for primary actions).
2. **Dark mode first.** Parents log at night. The default theme is near-black; a light theme is the exception, not the default. No bright white flashes.
3. **Minimal typing.** Taps, timers, steppers, and smart defaults over text fields. Typing is a last resort.
4. **One primary action per screen.** Never make a tired person choose between five things.
5. **Fast and forgiving.** Instant perceived response (the UI updates optimistically before anything saves). Mistakes are cheap to undo or fix.
6. **Accessible.** Real semantic structure, sufficient contrast, screen-reader labels, meaning never conveyed by color alone.
7. **Works offline.** Logging must never depend on a connection; it syncs later. (This is already fully built.)

---

## 3. What is built today (the current MVP)

Wata is a **working, deployed-ready web app** (installable-PWA is not yet done). All of the following is live and tested:

- **Accounts:** email sign-in/sign-up (Google sign-in is wired but not yet switched on).
- **Multiple children:** a family can have several babies; a switcher in the header changes who you're logging for.
- **Three trackers**, all logged through a persistent bottom bar:
  - **Feed** — breast (with side), bottle (with ml amount), or pump.
  - **Sleep** — a live start/stop timer, plus manual entry of a past sleep.
  - **Diaper** — one tap for wet / dirty / mixed / dry.
- **Today dashboard** — a running-sleep card (when applicable), three at-a-glance stat tiles, and a reverse-chronological timeline of the day.
- **Edit & delete** — tap any timeline entry to change or remove it.
- **Offline-first** — everything saves instantly on-device and syncs to the cloud when back online. A running sleep timer survives closing the app.

**Not yet built:** any view beyond "today" (no week/history/trends view), growth charts, milestones, vaccinations, co-parent sharing, notifications/reminders, home-screen installability, and onboarding beyond "add a baby."

---

## 4. The current screens, described precisely

Since you'll brainstorm without seeing the app, here is exactly what exists today, screen by screen. **The visual language is currently minimal and unpolished — that's much of what's up for redesign.**

### Visual language (as it stands)
- Background: near-black. Cards/surfaces: a slightly lighter dark gray, rounded corners (~16px).
- Primary buttons: near-white with dark text (high contrast). Secondary: outlined dark.
- Accent/brand color: currently a default blue used sparingly (e.g. the "sleeping" glow). **Not a deliberate brand palette yet.**
- Typography: **not yet dialed in** — currently rendering in a default serif-ish fallback in places; there is no intentional type system. (Open item.)
- Iconography: simple line icons (a milk bottle for feed, a moon for sleep, a baby face for diaper).
- Logo: a rounded square with a lowercase "w."

### A. Sign-in
Centered card: the "w" logo, "Welcome to wata," a one-line tagline, email + password fields, a primary "Sign in" button, a divider, a "Continue with Google" button, and a "New here? Create an account" toggle. Clean but generic.

### B. First-run onboarding (no baby yet)
A near-empty screen: the logo, "Welcome to wata," "Add your baby to start logging feeds, sleep, and diapers," and a single "+ Add your baby" button. Tapping it opens a small dialog asking for a name (and optional birth date). _The bottom tracker bar is visible but disabled here._

### C. Today dashboard (the home screen)
Top to bottom:
- **Header:** the current baby's name (or a dropdown switcher if there are several) on the left; a "Sign out" button on the right.
- **Running-sleep card** (only while a sleep timer runs): a prominent card — "Asleep," a large live-ticking clock (e.g. `0:42`), and a big "Stop" button.
- **Three stat tiles** in a row: feeds (count), sleep (total hours/minutes today), diapers (count). Each is an icon + big number + label.
- **"Today" timeline:** a heading, then a reverse-chronological list of cards. Each card = a round icon, the type + a one-line detail (e.g. "Feed / Bottle · 80 ml"), and the time on the right (e.g. "1:59 PM"). Empty state: "Nothing logged yet. Tap Feed below to start."
- **Bottom tracker bar (fixed):** three large buttons — **Feed** (filled/primary), **Sleep** (glows and says "Sleeping" while a timer runs), **Diaper**.

### D. Logging sheets (open from the bottom bar)
All three currently appear as a **centered dialog** (not a bottom sheet — a known limitation for one-handed reach):
- **Feed:** a "Breast / Bottle / Pump" segmented row; then a side selector (Left/Right/Both) for breast/pump and/or a big −  60 ml  + stepper for bottle/pump; a full-width "Save feed" button. **Smart default:** it pre-fills from the last feed and alternates the breast side.
- **Diaper:** a 2×2 grid of large buttons — Wet (blue), Dirty (amber), Mixed (green), Dry (dashed) — each with a label and a tiny sub-label ("Pee only," etc.). **One tap logs and closes.** Color is a hint only; the label carries the meaning.
- **Sleep:** if not sleeping — a big "Start sleep now" button plus an "add a past sleep" section with From/To time inputs. If sleeping — a large live clock and a "Stop sleep" button.
- After any log, a toast appears with an **Undo** action.

### E. Edit / delete
Tapping a timeline entry opens a sheet pre-filled with that entry's values (same controls as logging), plus a red "Delete." Sleeps edit their From/To; a still-running sleep offers "Stop."

---

## 5. Known rough edges & open questions (the good stuff to brainstorm)

This is where a design conversation adds the most value. Grouped by theme.

### Speed & one-handedness
- The log sheets are **centered dialogs**, not bottom sheets — the primary buttons aren't as thumb-friendly as they should be. Should everything slide up from the bottom? What's the ideal reachable zone on a large phone?
- Is opening a sheet then tapping a type one tap too many? Could the most common action (e.g., "same as last feed") be a **single tap** from the home screen? What's the fastest possible "log a breastfeed" path?
- **Quick-repeat:** many logs are near-identical to the last one. How might the UI exploit that without hiding the details when they differ?

### The "at a glance" story
- Today is shown as **counts + a flat list.** Is that the most reassuring, legible view for a foggy brain? Would a visual timeline (a 24-hour ribbon showing feeds/sleep/diapers as marks) be clearer? A "time since last feed" front-and-center?
- New parents constantly ask **"when did she last eat?" / "how long has she been down?"** Should those two answers be the hero of the home screen, above counts?
- There is **no history view yet** (only today). What's the right second screen — a scrollable past-days list, a week grid, simple trend lines? What matters to a sleep-deprived parent vs. what matters at a pediatric checkup?

### Night ergonomics
- Dark-first is done, but is it dark _enough_ and warm enough for a nursery at 3 AM (blue-light, sudden brightness, glare on a phone inches from a sleeping baby)? Is there a role for an ultra-dim "night mode," red-shifted palette, or huge-touch-target "one-thumb" mode?

### Emotional tone
- The current copy is functional ("Nothing logged yet"). Parenting at this stage is exhausting and emotional. What tone should Wata strike — calm and clinical, warm and encouraging, gently witty? How do we avoid guilt-tripping (e.g., if logging is sparse) while still being useful?
- Should the app ever **celebrate** (first full night of sleep, a good feeding day) or stay strictly neutral?

### Multiple children & multiple caregivers
- The child switcher is a header dropdown. For twins (very common in this audience), is switching per-log too slow? Should logging capture "which baby" differently?
- **Co-parenting** is coming (two caregivers, one baby, real-time sync). How should the UI show "your partner just logged a feed," who did what, and avoid double-logging?

### Identity & brand
- There is **no real visual identity yet** — no deliberate color palette, no type system, placeholder logo. What should Wata _feel_ like? (Calming? Trustworthy/medical? Friendly/soft?) A moodboard, palette, and type direction would be hugely valuable.
- The name "wata" (lowercase) — how should it be treated typographically?

### Onboarding & first impression
- Onboarding is currently one step (add a baby). What should a parent understand in the first 30 seconds? Is there a gentle way to explain offline logging, the timer, and smart defaults without a tutorial wall?

---

## 6. Forward-compatible roadmap (design for these, don't build yet)

The data model already supports adding these as new "event types" without rework, so the UX can be planned with them in mind:

- **Milestones** (first smile, rolled over, first steps) — likely a celebratory, photo-friendly surface.
- **Growth charts** (weight/height/head circumference vs. percentiles) — the most "chart-y" feature.
- **Vaccinations** (schedule, reminders, records).
- **Co-parent / caregiver sharing** (real-time, multi-user).
- **Reminders / notifications** ("it's been 3 hours since the last feed").
- **Pumping stash / bottle inventory**, **medications**, **temperature** — smaller trackers.

A key design question: **how does the home screen and navigation scale** from 3 trackers to a dozen features without losing the 3-AM simplicity?

---

## 7. Practical constraints for any design idea

So suggestions stay buildable:

- It's a **web app / PWA** (installs to the home screen; no native app store). Works on iPhone and Android browsers — so no reliance on Android-only tricks; iOS PWA limitations apply.
- **Phone-first**, portrait. Tablet/desktop are secondary.
- **Offline-first is sacred** — nothing in a core logging flow can require the network.
- Built with a standard modern component/design-system approach (a Tailwind-based UI kit), so conventional mobile patterns (sheets, tabs, cards, steppers, segmented controls) are all cheap; anything wildly custom or animation-heavy is more expensive.
- Keep the **event model** in mind: everything logged is an event with a type, a time (or start/end), and a small set of details. This is what keeps the app simple and extensible.

---

## 8. Suggested questions to bring to the design conversation

If you want a starting agenda:

1. What are the **two or three things** the home screen should answer at a glance, and how should it show them?
2. What is the **single fastest path** to log the most common event, and can it be one tap?
3. Should logging be **bottom sheets**, full screens, or something else — and what does the reachable one-thumb layout look like?
4. What is Wata's **visual identity** — palette, type, warmth, logo treatment?
5. What is the right **second screen** (history/trends), and what does it show?
6. What's the **emotional tone** of the copy and moments — neutral, warm, celebratory?
7. How should the app **scale** to co-parenting and future trackers without losing 3-AM simplicity?

---

_Wata already works: a parent can log feeds, sleep, and diapers one-handed and offline, see today at a glance, and fix mistakes. This brief is about making that experience feel calm, fast, beautiful, and unmistakably Wata's own._
