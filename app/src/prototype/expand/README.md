# Prototype — day-row tap-to-reveal on mobile (primary source)

Throwaway UI prototype captured per the prototype skill after the verdict.
**Winner: Variant A (Inline accordion), with rest/recovery rows kept inert.**
Folded into production `DayCard` on `main`. Variants B (sticky note) and C
(bottom sheet) were rejected and live only on this branch.

## What this was

Three ways to reveal a workout's pace on small screens (where the inline pace
is hidden). Switchable via `?expand=A|B|C` on the schedule route, dev-gated,
mounted from `PlanViewer` (dev builds only, since removed from main):

```tsx
// PlanViewer.tsx, inside the weeks block — since removed from main
import.meta.env.DEV && new URLSearchParams(window.location.search).get('expand')
  ? <ExpandPrototype schedule={validSchedule} units={units} paces={paces || undefined} />
  : /* normal WeekCard list */
```

To re-run: restore that mount, `npm run dev`, open a generated plan, add
`&expand=A` (or B/C). Floating switcher: arrows cycle, `✕` exits.

## Files

- `meta.ts` / `ExpandSwitcher.tsx` / `ExpandPrototype.tsx` — host chrome
- `shared.tsx` — presentational row + sheet scaffold, pace/rest/today helpers
- `variantA.tsx` — Inline accordion (winner)
- `variantB.tsx` — Sticky note (rejected)
- `variantC.tsx` — Bottom sheet (rejected)

## Verdict (2026-08-26)

A won: tapping a workout row expands it in place with a zone-colored pace line
and the full description; rest/recovery rows do nothing (no chevron). Today's
red-pen circle is kept on any row, rest or not. Folded into `DayCard` on main.
