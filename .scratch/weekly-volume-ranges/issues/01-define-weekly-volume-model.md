# 01 — Define WeeklyVolume domain model & update calculateWeeklyVolume

**What to build:**
Define the `WeeklyVolume` domain interface (`{ min, max, average, formatted }`) in `types.ts` and update `calculateWeeklyVolume` in `calculator.ts` to calculate minimum, maximum, average, and formatted weekly totals. Add comprehensive unit tests in `calculator.test.ts`.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] `WeeklyVolume` interface added to `types.ts`
- [ ] `calculateWeeklyVolume` in `calculator.ts` updated to compute `min`, `max`, `average`, and `formatted`
- [ ] Rounding rules applied for `mi` (whole/decimal) and `km` (1 decimal place)
- [ ] Unit tests for single values and ranged distances added to `calculator.test.ts`
