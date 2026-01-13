import { usePlanStore } from '../store/usePlanStore';
import { AVAILABLE_PLANS } from '../config';
import { DatePicker } from './DatePicker';

export const Header = () => {
    const { selectedPlanId, setPlanId, raceDate, setRaceDate } = usePlanStore();

    return (
        <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/60 shadow-sm transition-all">
            <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center font-bold text-white shadow-lg shadow-rose-500/20">
                        M
                    </div>
                    <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        MarathonPlanner
                    </h1>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <select
                        value={selectedPlanId}
                        onChange={(e) => setPlanId(e.target.value)}
                        className="flex-1 md:w-64 bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500/50 outline-none transition-colors"
                    >
                        {AVAILABLE_PLANS.map(plan => (
                            <option key={plan.id} value={plan.id}>{plan.name}</option>
                        ))}
                    </select>

                    <button
                        onClick={() => usePlanStore.getState().setUnits(usePlanStore.getState().units === 'mi' ? 'km' : 'mi')}
                        className="px-3 py-2 bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-lg text-sm font-medium text-slate-300 transition-colors w-12"
                        title="Toggle Units"
                    >
                        {usePlanStore(state => state.units)}
                    </button>

                    {raceDate && (
                        <DatePicker
                            value={raceDate}
                            onChange={setRaceDate}
                            className="w-full sm:w-auto min-w-[160px] text-sm"
                            placeholder="Race Date"
                        />
                    )}
                </div>
            </div>
        </header>
    );
};

