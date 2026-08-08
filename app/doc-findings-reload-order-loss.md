# Findings: "Reload-Order-Loss" bug

**Date:** investigation on branch `research/reproduce-reload-loss`
**Scope:** `app/` (React 19 + Zustand 5.0.10 PWA)
**Status:** investigation-only — no application code was modified.

---

## 1. TL;DR (failure mechanism)

The persisted, user-reordered `currentSchedule` hydrates synchronously from
localStorage on page load, but `PlanViewer` unconditionally **re-seeds the
canonical schedule** on every mount:

1. On mount, the plan-load effect (`PlanViewer.tsx:45–64`) calls
   `setSchedule(null)` immediately, discarding the persisted reorder.
2. When `fetchPlan(...)` resolves, `setPlan(data)` flips the reseed effect
   (`PlanViewer.tsx:78–84`), which recomputes the **canonical** schedule from
   `plan + raceDate` via `calculateSchedule()` and calls `setSchedule(canonical)`.

`setSchedule` is a raw write of `currentSchedule` (`usePlanStore.ts:101`); there
is **no fingerprint (plan id + race date) check, no "has user reorders" flag,
and no comparison against what was hydrated**. Any persisted, reordered schedule
is therefore overwritten ~immediately on load. The reorder is lost.

---

## 2. Relevant code

| File | Role |
|---|---|
| `app/src/store/usePlanStore.ts` | Zustand store + `persist(..., { name: 'plan-storage' })`. Single persisted blob containing `selectedPlanId, raceDate, units, raceInput, currentSchedule, workoutLogs`. `partialize` (L172–182) serializes `currentSchedule` (dates → ISO strings); `merge` (L183–237) revives dates and validates them. **No `storage` option → defaults to `createJSONStorage(() => localStorage)`, which is synchronous — hydration completes during store creation (module import), before the first React render.** |
| `app/src/components/PlanViewer.tsx` | Owns `plan` (fetched YAML) in local state + both `setSchedule` call sites + the reseed effect. |
| `app/src/lib/calculator.ts` | `calculateSchedule(plan, raceDate)` — the pure, canonical builder (dates/weeks from raceDate; returns a brand-new `RenderedPlan` with the plan's original workout order). |
| `app/src/App.tsx` | URL `<->` store sync (init + sync effects), manifest load, conditional render of `PlanViewer` only when `raceDate` is set. |
| `app/src/lib/parser.ts` | `fetchPlan(path)` — async `fetch` + YAML parse + AJV validation. This is the async hop that spaces the reseed from mount. |
| `app/src/components/DayCard.tsx` | Reads/writes completion status keyed `${selectedPlanId}-w${week}-d${day}`. |

---

## 3. Complete list of `setSchedule` call sites

From a whole-repo search (`setSchedule`), the **real** call sites in `app/src`
are exactly three:

1. **`app/src/store/usePlanStore.ts:101`** — the action implementation:
   `setSchedule: (schedule) => set({ currentSchedule: schedule })`.
   (Line 29 is only the `PlanState` interface declaration, not a call.)

2. **`app/src/components/PlanViewer.tsx:50`** — inside the *load effect*:
   `setSchedule(null);` — runs on mount and on every `selectedPlanId` change
   (deps: `[selectedPlanId, setSchedule, availablePlans]`). **Clears the
   persisted reordered schedule before the plan even finishes fetching.**

3. **`app/src/components/PlanViewer.tsx:82`** — inside the *reseed effect*:
   `setSchedule(canonical);` — recomputes `calculateSchedule(plan, raceDate)`
   whenever `plan` or `raceDate` changes (deps: `[plan, raceDate, setSchedule]`).
   **Overwrites regardless of whether a valid persisted schedule already exists,
   and regardless of whether that persisted schedule is order-modified.**

No other component or module calls `setSchedule`. In particular:
`moveWorkout` **does not** use `setSchedule` — it `set`s `currentSchedule`
directly (`usePlanStore.ts:102–157`), which still hits `partialize` and persists
the reorder correctly; the loss is purely the *reseed overwrite*, not a
persistence failure.
### Sites that *trigger* regeneration (second-order)

`setRaceDate` — every call retriggers the reseed effect because `raceDate` is in
its deps:

- `app/src/App.tsx:59` — URL `date` param applied during init
- `app/src/App.tsx:145` — landing `DatePicker` onChange
- `app/src/App.tsx:150` — "Generate Schedule" button
- `app/src/components/Header.tsx:181`, `:279` — header date pickers

`setPlanId` — every call retriggers the load effect and then the reseed:

- `app/src/App.tsx:50`, `:53` — URL `plan` param applied during init
- `app/src/App.tsx:137` — `PlanSelector` onSelect
- `app/src/components/Header.tsx:109`, `:231` — plan `<select>` onChange

Note the reseed effect's deps do **not** include `selectedPlanId`; a plan change
reaches it only indirectly (new `plan` object after fetch). The URL `units`
(`App.tsx:63`) and `dist/time` (`App.tsx:67–70`) params do not trigger either
effect, but the URL `plan`/`date` params do (see §5c).

---

## 4. Exact reload sequence and ordering proof

Derived from code order, not measurement. Timings relative to module load.

1. **T0 — module import (before React renders anything).**
   `usePlanStore` is created with `persist`. Because the default storage is the
   synchronous `localStorage`, `persist` **hydrates synchronously during store
   creation**: `selectedPlanId`, `raceDate`, `units`, `raceInput`, the
   **reordered `currentSchedule`**, and `workoutLogs` are all already in the
   store before `createRoot(...).render(...)` (Zustand v5 sync-storage
   hydration semantics; no `onRehydrateStorage`/deferred-path configured here).

2. **T1 — first render.** `App` reads `raceDate` (persisted, non-null) → renders
   `<PlanViewer />`. `PlanViewer` renders `currentSchedule` **as hydrated**
   (reordered). Because persisted values were already applied at T0, the
   URL-init effect in `App` (`App.tsx:38–75`) is gated on `manifestLoaded` and
   `isInitializing`; it runs only after the async manifest fetch resolves, so it
   can never run before this render.

3. **T1' — after paint, load effect runs** (`PlanViewer.tsx:45–64`):
   `setSchedule(null)` → store now has `currentSchedule: null` → persisted
   reorder is gone from memory (and the next `partialize` write will persist
   `null`, though React effects/persist ordering makes this moot). Then
   `await fetchPlan(planInfo.path)` starts (network + YAML parse + AJV).

4. **T2 — `fetchPlan` resolves the first time**:
   `setPlan(data)` → `plan` flips from `null` to the fetched plan.

5. **T2' — reseed effect runs** (`PlanViewer.tsx:78–84`):
   `plan && raceDate` are both truthy → `canonical = calculateSchedule(plan,
   raceDate)` (canonical order) → `setSchedule(canonical)` → store gets the
   fresh, canonical schedule. UI now shows the **canonical** (un-reordered)
   plan.

   If the fetch is slow, the UI is blank/loading from T1' to T2 (because
   `currentSchedule` was nulled); if the fetch fails, `error` is set and the
   schedule stays `null` — either way the reorder is already destroyed at T1'.

6. **Steady state.** `moveWorkout` mutations (drag-drop) re-write
   `currentSchedule` and persist correctly, so the user's reorders are in
   localStorage while the tab is open; but the *next* reload repeats T0→T2' and
   reverts them.

### Why "same config" reloads lose it and this never self-heals

- Hydration at T0 restores the reordered schedule **exactly once**, and nothing
  ever reads it again: `calculateSchedule` ignores `currentSchedule`; the reseed
  effect recomputes from `plan + raceDate` with zero knowledge of persisted
  order.
- `moveWorkout`-reordered state is never distinguished in the store from a
  "freshly generated" schedule — no dirty flag, no fingerprint, no
  `wasReseeded` marker.
- The reseed effect's deps (`plan`, `raceDate`) do not include any reorder
  signal, so it fires on mount regardless and wins.

---

## 5. Other loss vectors investigated

### (a) Completion status (`workoutLogs`) — no hard loss, but semantic corruption

- `workoutLogs` live in the **same** `plan-storage` blob
  (`partialize` L180, `merge` L235) and hydrate at T0 — so **no log key is
  dropped on reload**. `setWorkoutStatus`/`DayCard` never touch `currentSchedule`.
  The reseed overwrite does not touch `workoutLogs` either.
- **However:** `moveWorkout` deliberately *swaps* log entries so a status follows
  the workout's *title* (keys `selectedPlanId-w{w}-d{d}` at L135–151, applied at
  L141–151). When the reseed restores the canonical order at step T2', those
  swapped keys are **not swapped back** — they stay attached to their calendar
  slots. Net effect after a reload:
  - the workout the user marked "completed" (now back in its original slot) shows
    **no** status, and
  - the workout it was swapped with shows the orphaned status.
  So "completion" visibly jumps to the wrong runs — the same root cause (no
  fingerprint/authoritative persisted order) expressed in the status layer.
- Secondary: keys are slot-indexed per plan (`w{w}-d{d}`), so a status is
  sticky to a *calendar slot*, not to a workout/date. After any reseed whose
  layout differs from the persisted one, statuses may attach to different
  workouts. This is a design hazard even apart from the bug.

### (b) Stale schedule from a different plan — real, but transient

- `setPlanId` (`usePlanStore.ts:76–97`) changes `selectedPlanId` (and possibly
  `raceInput`) but **does not clear `currentSchedule`**. Neither does
  `setRaceDate` (`usePlanStore.ts:98`).
- Window: if the persisted `currentSchedule` belongs to plan A (or a different
  raceDate) and the user selects plan B, the schedule for A keeps rendering —
  under plan B — until React commits the `selectedPlanId` change, after which
  the `PlanViewer` load effect runs `setSchedule(null)` (one painted frame of
  mismatch; cleared within that effect tick, then reseeded with B's canonical
  after fetch).
- Cross-session: on a cold reload where the URL `plan` param differs from the
  persisted `selectedPlanId`, hydration (T0) restores A **and A's schedule**;
  the `App` init effect later applies URL plan B; the stale A-schedule is
  briefly visible (T1→T1') and is only removed by the mount/load effect, not by
  `setPlanId` itself. If `fetchPlan` fails, the stale schedule is *not* visible
  (nulled), so the observable stale render is limited to the fetch latency
  window.
- This makes correctness dependent on an effect firing; the durable fix should
  clear/replace `currentSchedule` inside `setPlanId` / `setRaceDate` (or
  fingerprint it) so mismatch never renders.

### (c) Races between App.tsx URL-param init and store hydration

- **No race on hydration itself**: hydration is synchronous at module import
  (T0), and the URL-init effect is a React effect gated on `manifestLoaded` +
  `isInitializing.current` — by the time it can run, hydration has long
  completed. URL params deterministically override persisted values (by design).
- **But URL params are a third reorder annihilator.** App syncs the store to
  the URL (`App.tsx:78–108`), so a normal reload arrives with `?plan=…&date=…`.
  The init effect then calls `store.setPlanId(urlPlan)` and/or
  `store.setRaceDate(parsed)`:
  - `setPlanId` re-runs the load effect → `setSchedule(null)` + refetch + reseed
    (even when the URL plan *equals* the persisted plan).
  - `setRaceDate` re-runs the reseed effect directly — `parseISO` produces a
    **new `Date` reference**, so even a date identical to the persisted one
    trips the `[plan, raceDate, setSchedule]` effect and reseeds the canonical
    schedule.
  - Only the `units`/`dist`/`time` params avoid the reseed path.
- Net: with URL params present, the reorder is destroyed even before the
  mount-time effects alone would have done it; the `date` param alone suffices.
- Manifest loading also gates `PlanViewer` availability: `manifestLoaded` gates
  the init effect, but `PlanViewer` mounts as soon as `raceDate` is non-null
  (which is true immediately after hydration) — so the fetch/reseed path starts
  before the manifest and URL-init finish, and any later `setRaceDate` from the
  URL re-triggers the reseed again. (Harmless to reorder loss — the damage is
  already done — but relevant to "which effect wins" reasoning.)


---

## 6. Test coverage gap — confirmed

Runs performed in `app/`:

- `node node_modules/vitest/vitest.mjs run src/store/usePlanStore.test.ts`
  — **4/4 pass** (swaps workouts preserving dates / raceInput type-switch /
  status set / status swap on move).
- `node node_modules/vitest/vitest.mjs run src/lib/calculator.test.ts`
  — **4/4 pass**.
- (`npm test` was blocked by the PowerShell execution policy on this machine;
  running `vitest.cmd`/`vitest.mjs` directly worked.)

Test inventory (`src/**/*.test.{ts,tsx}`):
`DayCard`, `Header`, `MileageChart`, `PaceChart`, `WeekCard`,
`lib/calculator`, `lib/formatters`, `lib/paceCalculator`,
`store/usePlanStore`.

**There is no `PlanViewer.test.tsx`** (nor any component test that mounts
`PlanViewer`, nor any test that exercises persist/hydration round-trip or the
remount/reseed path). The store tests exercise `moveWorkout` in memory only —
they cannot see the reseed because reseeding lives entirely in `PlanViewer`
effects, and they never simulate "hydrate reordered schedule → remount →
reseed effect fires". So **the bug is invisible to the current suite**, and a
fix can regress without any existing test failing.

---

## 7. What the durable fix must guard / touch

1. **Stop unconditional reseeding on mount.**
   - The reseed effect (`PlanViewer.tsx:78–84`) must only call `setSchedule`
     when it is a *real* freshness condition — i.e. when there is no persisted
     schedule, or the persisted schedule's fingerprint
     `{ selectedPlanId, raceDate }` differs from the one about to be generated.
     If a persisted schedule already matches the current plan+date, keep it
     (preserving reorders).
   - Requires a **persisted fingerprint**: store `{ schemaVersion, planId,
     raceDate }` (or a hash) next to `currentSchedule` in `partialize`, compare
     in the store/`merge`, and expose e.g. `hasValidSchedule`/`scheduleKey` for
     `PlanViewer` to gate on. Pure in-component heuristics ("skip if
     `currentSchedule` non-null") are insufficient when URL params force
     `setRaceDate`/`setPlanId` to new references (see §5c) — the fingerprint
     must be value-compared, not reference-compared.

2. **Remove or guard `setSchedule(null)` in `PlanViewer.tsx:50`.** It currently
   destroys the persisted schedule before the fetch completes. Only discard the
   stored schedule when the fingerprint actually mismatches (or when the user
   explicitly changes plan/date); otherwise keep the hydrated schedule on screen
   while the fetch refreshes in the background.

3. **Call sites the fix must touch** (setSchedule call sites are only these
   three — §3):
   - `usePlanStore.ts:101` — consider tightening `setSchedule` to accept/lookup
     a fingerprint, or add a dedicated `reseedIfStale(plan, raceDate)` action
     that no-ops when the persisted schedule matches.
   - `PlanViewer.tsx:50` (guarded null/clear).
   - `PlanViewer.tsx:82` (guarded reseed).
   - Secondary (regeneration triggers): `setPlanId` (`usePlanStore.ts:76`) and
     `setRaceDate` (`usePlanStore.ts:98`) should invalidate `currentSchedule`
     when the fingerprint actually changes (closes §5b staleness), and the App
     URL-init (`App.tsx:50/53/59`) should set values idempotently so applying
     the URL never re-seeds an identical config.

4. **Address the status-corruption consequence (§5a)**: when the schedule is
   reseeded, `workoutLogs` swap state becomes orphaned. Options: key logs by
   workout identity/date instead of `w{w}-d{d}`, or persist the authoritative
   order (the reordered schedule) so logs never need re-swapping, or re-run the
   swap logic when a persisted schedule is discarded.

5. **Test the failure mode**: add a test that (a) sets a reordered
   `currentSchedule` + matching fingerprint, (b) simulates hydration
   (recreate/rehydrate the store from a serialized blob), (c) mounts
   `PlanViewer` with mocked `fetchPlan`, (d) asserts `currentSchedule` order is
   preserved after the async fetch + effects settle. Without such a test the
   regression can slide through, since current coverage never mounts
   `PlanViewer` (§6).

