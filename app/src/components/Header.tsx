import { useState } from 'react';
import { usePlanStore } from '../store/usePlanStore';
import { AVAILABLE_PLANS } from '../config';
import { DatePicker } from './DatePicker';
import { TimeInput } from './TimeInput';

export const Header = () => {
    const { selectedPlanId, setPlanId, raceDate, setRaceDate } = usePlanStore();
    const units = usePlanStore(state => state.units);
    const raceInput = usePlanStore(state => state.raceInput);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const planInfo = AVAILABLE_PLANS.find(p => p.id === selectedPlanId);

    return (
        <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/60 shadow-sm transition-all text-left">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4 max-w-5xl">
                {/* Brand Logo & Title */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <img
                        src="pwa-512x512.png"
                        alt="Logo"
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl shadow-lg shadow-rose-500/20 object-cover"
                    />
                    <div className="flex flex-col sm:block">
                        <h1 className="text-lg sm:text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 leading-none sm:leading-normal">
                            RacePlans
                        </h1>
                        {planInfo && (
                            <span className="text-[10px] sm:hidden text-rose-400 font-semibold leading-none mt-0.5 max-w-[150px] truncate">
                                {planInfo.type} · {planInfo.name}
                            </span>
                        )}
                    </div>
                </div>

                {/* Desktop Controls (hidden on mobile, visible on sm and up) */}
                <div className="hidden sm:flex flex-wrap items-center justify-end gap-2 sm:gap-3 w-full sm:w-auto">
                    <select
                        value={selectedPlanId}
                        onChange={(e) => setPlanId(e.target.value)}
                        aria-label="Select training plan"
                        className="flex-1 min-w-[140px] md:w-64 md:flex-none bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500/50 outline-none transition-colors"
                    >
                        {AVAILABLE_PLANS.map(plan => (
                            <option key={plan.id} value={plan.id}>{plan.type} · {plan.name}</option>
                        ))}
                    </select>

                    <button
                        onClick={() => usePlanStore.getState().setUnits(units === 'mi' ? 'km' : 'mi')}
                        aria-label="Toggle units of measurement"
                        className="flex-none px-3 py-2 bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-lg text-sm font-medium text-slate-300 transition-colors w-12"
                        title="Toggle Units"
                    >
                        {units}
                    </button>

                    {raceDate && (
                        <div className="flex gap-1 items-center">
                            <select 
                                aria-label="Select race distance"
                                className="bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-rose-500/50 outline-none transition-colors"
                                value={raceInput?.distance}
                                onChange={(e) => {
                                    const state = usePlanStore.getState();
                                    const val = e.target.value as '5K' | '10K' | '15K' | 'Half Marathon' | 'Marathon';
                                    state.setRaceInput(state.raceInput ? { ...state.raceInput, distance: val } : { distance: val, time: '45:00' });
                                }}
                            >
                                <option>5K</option>
                                <option>10K</option>
                                <option>15K</option>
                                <option>Half Marathon</option>
                                <option>Marathon</option>
                            </select>
                            <TimeInput
                                value={raceInput?.time || ''}
                                onChange={(val) => {
                                    const state = usePlanStore.getState();
                                    state.setRaceInput(state.raceInput ? { ...state.raceInput, time: val } : { distance: '10K', time: val });
                                }}
                                raceDistance={raceInput?.distance}
                                className="w-[110px] text-sm"
                            />
                            <DatePicker
                                value={raceDate}
                                onChange={setRaceDate}
                                className="w-[120px] sm:w-[150px] text-sm"
                                placeholder="Race Date"
                            />
                        </div>
                    )}
                </div>

                {/* Mobile Settings Toggle (visible on mobile, hidden on sm and up) */}
                <div className="flex sm:hidden items-center gap-2">
                    <button
                        onClick={() => setIsDrawerOpen(true)}
                        aria-label="Open settings drawer"
                        className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 13.5V3.75m0 9.75a1.5 1.5 0 0 1 0 3m0-3a1.5 1.5 0 0 0 0 3m0 3.75V16.5m12-3V3.75m0 9.75a1.5 1.5 0 0 1 0 3m0-3a1.5 1.5 0 0 0 0 3m0 3.75V16.5m-6-9V3.75m0 3.75a1.5 1.5 0 0 1 0 3m0-3a1.5 1.5 0 0 0 0 3m0 9.75V10.5" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile Collapsible Settings Drawer */}
            {isDrawerOpen && (
                <div className="fixed inset-0 z-50 sm:hidden">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity animate-fade-in"
                        onClick={() => setIsDrawerOpen(false)}
                    />
                    
                    {/* Drawer Panel */}
                    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 rounded-t-2xl shadow-2xl p-6 space-y-6 max-h-[85vh] overflow-y-auto animate-slide-up z-50">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <div>
                                <h2 className="text-lg font-bold text-white">Plan Settings</h2>
                                <p className="text-xs text-slate-400">Configure your training parameters</p>
                            </div>
                            <button
                                onClick={() => setIsDrawerOpen(false)}
                                aria-label="Close settings drawer"
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Fields */}
                        <div className="space-y-4">
                            {/* Plan Selector */}
                            <div className="flex flex-col gap-1.5 text-left">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Training Plan</label>
                                <select
                                    value={selectedPlanId}
                                    onChange={(e) => setPlanId(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 hover:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-rose-500/50 outline-none transition-colors"
                                >
                                    {AVAILABLE_PLANS.map(plan => (
                                        <option key={plan.id} value={plan.id}>{plan.type} · {plan.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Units Toggle */}
                            <div className="flex items-center justify-between bg-slate-950/40 p-3 rounded-xl border border-slate-800/80 text-left">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-slate-200">Distance Units</span>
                                    <span className="text-xs text-slate-500">Toggle mileage display</span>
                                </div>
                                <button
                                    onClick={() => usePlanStore.getState().setUnits(units === 'mi' ? 'km' : 'mi')}
                                    className="px-4 py-2 bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-xl text-sm font-bold text-indigo-400 transition-colors uppercase"
                                >
                                    {units === 'mi' ? 'Miles (mi)' : 'Kilometers (km)'}
                                </button>
                            </div>

                            {/* Race Details */}
                            {raceDate && (
                                <div className="border-t border-slate-800/60 pt-4 space-y-4 text-left">
                                    {/* Distance */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Recent Race Distance</label>
                                        <select 
                                            className="w-full bg-slate-950 border border-slate-700 hover:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-rose-500/50 outline-none transition-colors"
                                            value={raceInput?.distance}
                                            onChange={(e) => {
                                                const state = usePlanStore.getState();
                                                const val = e.target.value as '5K' | '10K' | '15K' | 'Half Marathon' | 'Marathon';
                                                state.setRaceInput(state.raceInput ? { ...state.raceInput, distance: val } : { distance: val, time: '45:00' });
                                            }}
                                        >
                                            <option>5K</option>
                                            <option>10K</option>
                                            <option>15K</option>
                                            <option>Half Marathon</option>
                                            <option>Marathon</option>
                                        </select>
                                    </div>

                                    {/* Time */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Recent Race Time</label>
                                        <TimeInput
                                            value={raceInput?.time || ''}
                                            onChange={(val) => {
                                                const state = usePlanStore.getState();
                                                state.setRaceInput(state.raceInput ? { ...state.raceInput, time: val } : { distance: '10K', time: val });
                                            }}
                                            raceDistance={raceInput?.distance}
                                            className="w-full text-base"
                                        />
                                    </div>

                                    {/* Date */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Target Race Date</label>
                                        <DatePicker
                                            value={raceDate}
                                            onChange={setRaceDate}
                                            className="w-full text-base"
                                            placeholder="Race Date"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Apply & Close */}
                        <button
                            onClick={() => setIsDrawerOpen(false)}
                            className="w-full py-3 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white font-bold rounded-xl transition-colors text-sm uppercase tracking-wider shadow-lg shadow-rose-500/10"
                        >
                            Apply & Close
                        </button>
                    </div>
                </div>
            )}
        </header>
    );
};

