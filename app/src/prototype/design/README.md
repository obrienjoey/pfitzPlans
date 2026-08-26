# Design prototype — 'coach's paper training log' (primary source)

Throwaway UI prototype, captured per the prototype skill after the verdict.
**Winner: Variant C (Session Sheet) with Variant B's bib hero** — folded into
`main` as the production redesign. Variants A (Log Table) and B (Bib & Splits)
were rejected and live only on this branch.

## What this was

Three structural variants of the plan page, switchable via `?design=A|B|C` on
the schedule route, dev-gated. Mounted from `PlanViewer` (dev builds only):

```tsx
// PlanViewer.tsx, after the validSchedule guard — since removed from main
if (import.meta.env.DEV && searchParams.get('design')) {
    return (
        <DesignPrototype
            schedule={validSchedule}
            units={units}
            paces={paces || undefined}
            planName={...}
            planSource={...}
        />
    );
}
```

To re-run: restore that mount, `npm run dev`, open a generated plan, add
`&design=A` (or B/C). Floating switcher: arrows cycle, `✕` exits.

## Files

- `tokens.ts` — palette, zone ramp (watch vernacular, cool→hot)
- `design.css` — paper/grid texture, pen-circle, dark tokens
- `TodayBand.tsx` — the signature element (today + T−N countdown)
- `designVariantA.tsx` — Log Table (whole plan as one table)
- `designVariantB.tsx` — Bib & Splits (bib hero + timeline lanes)
- `designVariantC.tsx` — Session Sheet + bib hero + working drag + settings strip
- `DesignPrototype.tsx` / `DesignSwitcher.tsx` / `designMeta.ts` — host chrome

## Verdict (2026-08-26)

C + bib hero won. Proven in-prototype: row drag-to-reschedule (mouse/touch/
keyboard) mutating the real store, settings strip wired to the store, units
conversion. Fold-in on main carries these into WeekCard/DayCard/PlanViewer.
