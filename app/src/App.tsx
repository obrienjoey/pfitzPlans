import { usePlanStore } from './store/usePlanStore';
import { PlanViewer } from './components/PlanViewer';
import { Header } from './components/Header';
import { DatePicker } from './components/DatePicker';

function App() {
  const { raceDate, setRaceDate } = usePlanStore();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-rose-500 selection:text-white">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {!raceDate ? (
          <div className="flex flex-col items-center justify-center p-12 bg-slate-800/50 backdrop-blur-sm rounded-3xl border border-slate-700/50 shadow-2xl mt-12">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-rose-400 to-orange-400 bg-clip-text text-transparent mb-6">
              Start Your Training
            </h2>
            <p className="text-slate-400 mb-8 text-lg text-center max-w-md">
              Select your target race date to generate your personalized schedule.
            </p>
            <div className="w-full max-w-sm">
              <DatePicker
                value={null}
                onChange={setRaceDate}
                placeholder="YYYY-MM-DD"
                className="w-full"
              />
            </div>
          </div>
        ) : (
          <PlanViewer />
        )}
      </main>
    </div>
  );
}

export default App;
