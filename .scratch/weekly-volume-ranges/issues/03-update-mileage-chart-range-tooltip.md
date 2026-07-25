# 03 — Update MileageChart bar heights & tooltip range display

**What to build:**
Update `MileageChart` to calculate bar heights using `volume.average` (or `max`) and update hover tooltips to render `volume.formatted` with units.

**Blocked by:** 01 — Define WeeklyVolume domain model & update calculateWeeklyVolume

**Status:** ready-for-agent

- [ ] `MileageChart` uses `volume.average` for chart bar height calculations
- [ ] Hover tooltips display full formatted range string (e.g. `82.9 - 84.5 km`)
- [ ] Y-axis ticks and peak indicators function cleanly with ranged totals
