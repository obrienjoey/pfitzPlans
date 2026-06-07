import { useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format, parseISO, isValid } from 'date-fns';
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
  const { raceDate, setRaceDate, selectedPlanId, setPlanId } = store;
  const isInitializing = useRef(true);

  // 1. Initialize store from URL params on mount
  useEffect(() => {
    if (isInitializing.current) {
      const urlPlan = searchParams.get('plan');
      const urlDate = searchParams.get('date');
      const urlDist = searchParams.get('dist');
      const urlTime = searchParams.get('time');
      const urlUnits = searchParams.get('units');

      // Check if any URL params exist
      if (urlPlan || urlDate || urlDist || urlTime || urlUnits) {
        if (urlPlan) {
          store.setPlanId(urlPlan);
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
  }, [searchParams, store]);

  // 2. Sync store changes to URL params
  useEffect(() => {
    // Only sync if initialization is done
    if (!isInitializing.current) {
      const params: Record<string, string> = {};
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
    store.selectedPlanId,
    store.raceDate,
    store.units,
    store.raceInput,
    setSearchParams
  ]);

  const defaultWeeks = useMemo(() => {
    return AVAILABLE_PLANS.find(p => p.id === selectedPlanId)?.weeks || 18;
  }, [selectedPlanId]);

  const defaultDate = useMemo(() => {
    const today = new Date();
    const target = new Date(today.getTime() + defaultWeeks * 7 * 24 * 60 * 60 * 1000);
    const day = target.getDay();
    const steps = day === 0 ? 0 : 7 - day;
    target.setDate(target.getDate() + steps);
    target.setHours(0, 0, 0, 0);
    return target;
  }, [defaultWeeks]);


  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-rose-500 selection:text-white">
        <Header />

        <main className="container mx-auto px-4 py-8 max-w-5xl">
          {!raceDate ? (
            <div className="flex flex-col items-center justify-center p-8 sm:p-12 bg-slate-800/50 backdrop-blur-sm rounded-3xl border border-slate-700/50 shadow-2xl mt-12 sm:mt-16 w-full max-w-4xl mx-auto">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-rose-400 to-orange-400 bg-clip-text text-transparent mb-10 text-center">
                Start Your Training
              </h2>

              <PlanSelector selectedId={selectedPlanId} onSelect={setPlanId} />

              <div className="w-full max-w-sm mt-8 p-6 bg-slate-900/50 rounded-2xl border border-slate-700 flex flex-col items-center">
                <p className="text-slate-300 mb-4 font-medium text-center">
                  Select your target race date to generate your personalized schedule.
                </p>
                <DatePicker
                  value={raceDate || defaultDate}
                  onChange={setRaceDate}
                  placeholder="YYYY-MM-DD"
                  className="w-full"
                />
                <button
                  onClick={() => setRaceDate(raceDate || defaultDate)}
                  className="w-full mt-4 py-2.5 px-4 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow-lg shadow-rose-500/20 active:bg-rose-700 transition-all text-sm uppercase tracking-wider"
                >
                  Generate Schedule
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
