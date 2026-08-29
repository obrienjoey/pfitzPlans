import { useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format, parseISO, isValid, startOfDay, addWeeks, addDays } from 'date-fns';
import { usePlanStore } from './store/usePlanStore';
import { PlanViewer } from './components/PlanViewer';
import { Header } from './components/Header';
import { DatePicker } from './components/DatePicker';
import { PlanSelector } from './components/PlanSelector';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AVAILABLE_PLANS } from './config';

function App() {
  const [searchParams, setSearchParams] = useSearchParams();
  const store = usePlanStore();
  const { raceDate, setRaceDate, selectedPlanId, setPlanId, availablePlans, manifestLoaded, setAvailablePlans, setManifestLoaded } = store;
  const isInitializing = useRef(true);

  // Load manifest on mount
  useEffect(() => {
    fetch('/plans/manifest.json')
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
  }, [setAvailablePlans, setManifestLoaded]);

  // 1. Initialize store from URL params on mount
  useEffect(() => {
    if (manifestLoaded && isInitializing.current) {
      const urlPlan = searchParams.get('plan');
      const urlDate = searchParams.get('date');
      const urlDist = searchParams.get('dist');
      const urlTime = searchParams.get('time');
      const urlUnits = searchParams.get('units');

      // Check if any URL params exist
      if (urlPlan || urlDate || urlDist || urlTime || urlUnits) {
        if (urlPlan) {
          if (availablePlans.some(p => p.id === urlPlan)) {
            store.setPlanId(urlPlan);
          } else {
            // Use default plan if invalid or doesn't exist
            store.setPlanId('pfitz_18_55_4th');
          }
        }
        if (urlDate) {
          const parsed = parseISO(urlDate);
          if (isValid(parsed)) {
            store.setRaceDate(parsed);
          }
        }
        if (urlUnits === 'mi' || urlUnits === 'km') {
          store.setUnits(urlUnits);
        }
        if (urlDist || urlTime) {
          const currentInput = store.raceInput || { distance: '10K', time: '0:45:00' };
          store.setRaceInput({
            distance: (urlDist as '5K' | '10K' | '15K' | 'Half Marathon' | 'Marathon') || currentInput.distance,
            time: urlTime || currentInput.time,
          });
        }
      }
      isInitializing.current = false;
    }
  }, [manifestLoaded, searchParams, store, availablePlans]);

  // 2. Sync store changes to URL params
  useEffect(() => {
    // Only sync if initialization is done
    if (manifestLoaded && !isInitializing.current) {
      const params: Record<string, string> = {};
      // Preserve non-app params before syncing known ones.
      const APP_KEYS = ['plan', 'date', 'dist', 'time', 'units'];
      searchParams.forEach((v, k) => {
        if (!APP_KEYS.includes(k)) params[k] = v;
      });
      if (store.selectedPlanId) {
        params.plan = store.selectedPlanId;
      }
      if (store.raceDate) {
        try {
          params.date = format(new Date(store.raceDate), 'yyyy-MM-dd');
        } catch (e) {
          console.error(e);
        }
      }
      if (store.units) {
        params.units = store.units;
      }
      if (store.raceInput) {
        params.dist = store.raceInput.distance;
        params.time = store.raceInput.time;
      }
      setSearchParams(params, { replace: true });
    }
  }, [
    manifestLoaded,
    store.selectedPlanId,
    store.raceDate,
    store.units,
    store.raceInput,
    setSearchParams,
    searchParams
  ]);

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


  return (
    <ErrorBoundary>
      <div className="min-h-screen text-ink font-sans selection:bg-marker selection:text-paper transition-colors duration-300">
        <Header />

        <main className="container mx-auto px-4 py-8 max-w-5xl">
          {!raceDate ? (
            <div className="w-full max-w-4xl mx-auto mt-6 sm:mt-10">
              <header className="border-b-2 border-ink pb-4 mb-8">
                <h2 className="font-display font-bold uppercase text-4xl sm:text-5xl leading-[0.95] text-ink">
                  Pick a plan, set your race day
                </h2>
                <p className="text-pencil text-sm mt-2">
                  Choose a training schedule, then get a dated calendar with pace targets built from a recent race.
                </p>
              </header>

              <PlanSelector selectedId={selectedPlanId} onSelect={setPlanId} />

              <div className="card bg-card border border-rule p-6 flex flex-col sm:flex-row sm:items-end gap-4">
                <div className="flex-1">
                  <label htmlFor="landing-date" className="block font-data text-[10px] uppercase tracking-[0.15em] text-pencil mb-1">
                    Race day
                  </label>
                  <DatePicker
                    value={raceDate || defaultDate}
                    onChange={setRaceDate}
                    placeholder="YYYY-MM-DD"
                    className="w-full sm:max-w-xs"
                  />
                </div>
                <button
                  onClick={() => setRaceDate(raceDate || defaultDate)}
                  className="w-full sm:w-auto py-2.5 px-6 bg-marker hover:bg-marker/90 active:bg-marker/80 text-paper font-data font-bold rounded-none text-sm uppercase tracking-[0.12em] transition-colors"
                >
                  Build my schedule
                </button>
              </div>
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
