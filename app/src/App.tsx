import { useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format, parseISO, isValid, startOfDay, addWeeks, addDays } from 'date-fns';
import { usePlanStore } from './store/usePlanStore';
import { PlanViewer } from './components/PlanViewer';
import { Header } from './components/Header';
import { LandingHero } from './components/LandingHero';
import { PlanSelector } from './components/PlanSelector';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AVAILABLE_PLANS } from './config';
import { isValidRaceDistance, parseTimeString } from './lib/paceCalculator';
import { MAX_RACE_YEAR, MIN_RACE_YEAR } from './lib/constants';

const APP_KEYS = ['plan', 'date', 'dist', 'time', 'units'];

function manifestUrl(): string {
  const base = import.meta.env.BASE_URL || '/';
  return base.endsWith('/') ? `${base}plans/manifest.json` : `${base}/plans/manifest.json`;
}

function App() {
  const [searchParams, setSearchParams] = useSearchParams();
  // Select slices individually so URL sync / header edits don't re-render App
  // on every unrelated store change.
  const raceDate = usePlanStore((s) => s.raceDate);
  const selectedPlanId = usePlanStore((s) => s.selectedPlanId);
  const availablePlans = usePlanStore((s) => s.availablePlans);
  const manifestLoaded = usePlanStore((s) => s.manifestLoaded);
  const raceInput = usePlanStore((s) => s.raceInput);
  const units = usePlanStore((s) => s.units);
  const isInitializing = useRef(true);

  // Load manifest on mount (base-aware so subpath deploys work)
  useEffect(() => {
    const { setAvailablePlans, setManifestLoaded } = usePlanStore.getState();
    fetch(manifestUrl())
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch manifest');
        return res.json();
      })
      .then(plans => {
        setAvailablePlans(plans);
        setManifestLoaded(true);
      })
      .catch(err => {
        console.error(err);
        // Fallback to static AVAILABLE_PLANS in config.ts
        setAvailablePlans(AVAILABLE_PLANS);
        setManifestLoaded(true);
      });
  }, []);

  // 1. Initialize store from URL params on mount (once, after manifest)
  useEffect(() => {
    if (!manifestLoaded || !isInitializing.current) return;
    const state = usePlanStore.getState();
    const plans = state.availablePlans;

    const urlPlan = searchParams.get('plan');
    const urlDate = searchParams.get('date');
    const urlDist = searchParams.get('dist');
    const urlTime = searchParams.get('time');
    const urlUnits = searchParams.get('units');

    if (urlPlan || urlDate || urlDist || urlTime || urlUnits) {
      if (urlPlan) {
        if (plans.some(p => p.id === urlPlan)) {
          state.setPlanId(urlPlan);
        } else {
          // Use default plan if invalid or doesn't exist
          state.setPlanId('pfitz_18_55_4th');
        }
      }
      if (urlDate) {
        const parsed = parseISO(urlDate);
        if (isValid(parsed) && parsed.getFullYear() >= MIN_RACE_YEAR && parsed.getFullYear() <= MAX_RACE_YEAR) {
          state.setRaceDate(parsed);
        }
      }
      if (urlUnits === 'mi' || urlUnits === 'km') {
        state.setUnits(urlUnits);
      }
      // Only override the parts of raceInput that validate — a bad ?time=
      // must never wipe a good stored input.
      const currentInput = usePlanStore.getState().raceInput || { distance: '10K' as const, time: '0:45:00' };
      let nextDistance = currentInput.distance;
      let nextTime = currentInput.time;
      let touched = false;
      if (urlDist && isValidRaceDistance(urlDist)) {
        nextDistance = urlDist;
        touched = true;
      }
      if (urlTime && parseTimeString(urlTime) != null) {
        nextTime = urlTime;
        touched = true;
      }
      if (touched) {
        state.setRaceInput({ distance: nextDistance, time: nextTime });
      }
    }
    isInitializing.current = false;
    // Run once after manifest load — searchParams intentionally not a dep.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manifestLoaded]);

  // 2. Sync store changes to URL params (functional update avoids
  // depending on the searchParams identity, which would loop).
  useEffect(() => {
    if (!manifestLoaded || isInitializing.current) return;
    setSearchParams((prev) => {
      const next = new URLSearchParams();
      prev.forEach((v, k) => {
        if (!APP_KEYS.includes(k)) next.set(k, v);
      });
      const s = usePlanStore.getState();
      if (s.selectedPlanId) next.set('plan', s.selectedPlanId);
      if (s.raceDate) {
        try {
          next.set('date', format(new Date(s.raceDate), 'yyyy-MM-dd'));
        } catch (e) {
          console.error(e);
        }
      }
      if (s.units) next.set('units', s.units);
      if (s.raceInput) {
        next.set('dist', s.raceInput.distance);
        next.set('time', s.raceInput.time);
      }
      // No-op when nothing changed so we don't trigger a navigation loop.
      if (next.toString() === prev.toString()) return prev;
      return next;
    }, { replace: true });
  }, [manifestLoaded, selectedPlanId, raceDate, units, raceInput, setSearchParams]);

  const defaultWeeks = useMemo(() => {
    return availablePlans.find(p => p.id === selectedPlanId)?.weeks || 18;
  }, [selectedPlanId, availablePlans]);

  const defaultDate = useMemo(() => {
    const today = startOfDay(new Date());
    const target = addWeeks(today, defaultWeeks);
    const day = target.getDay();
    const steps = day === 0 ? 0 : 7 - day;
    return addDays(target, steps);
  }, [defaultWeeks]);

  const setPlanId = usePlanStore((s) => s.setPlanId);


  return (
    <ErrorBoundary>
      <div className="min-h-screen text-ink font-sans selection:bg-marker selection:text-paper transition-colors duration-300">
        <Header />

        <main className="container mx-auto px-4 py-8 max-w-5xl">
          {!raceDate ? (
            <div className="w-full max-w-4xl mx-auto mt-6 sm:mt-10">
              <LandingHero defaultDate={defaultDate} />

              <div className="border-t-2 border-ink pt-4 mt-10 mb-6">
                <h2 className="font-display font-semibold uppercase text-2xl sm:text-3xl text-ink tracking-wide">
                  Choose your schedule
                </h2>
                <p className="text-pencil text-sm mt-1">
                  Grouped by race distance. Higher mileage means faster — pick what your base supports.
                </p>
              </div>

              <PlanSelector selectedId={selectedPlanId} onSelect={setPlanId} />
            </div>
          ) : (
            <PlanViewer />
          )}
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;
