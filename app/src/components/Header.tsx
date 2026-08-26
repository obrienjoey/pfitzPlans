import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { usePlanStore } from '../store/usePlanStore';
import { DatePicker } from './DatePicker';
import { TimeInput } from './TimeInput';
import { ThemeToggle } from './ThemeToggle';

export const Header = () => {
    const { selectedPlanId, setPlanId, raceDate, setRaceDate, availablePlans } = usePlanStore();
    const units = usePlanStore(state => state.units);
    const raceInput = usePlanStore(state => state.raceInput);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Drag-to-dismiss state
    const dragStartY = useRef<number | null>(null);
    const sheetRef = useRef<HTMLDivElement>(null);
    const [dragOffset, setDragOffset] = useState(0);

    // Lock body scroll while drawer is open (fixes Android Chrome scroll-fight)
    useEffect(() => {
        if (isDrawerOpen) {
            document.body.classList.add('drawer-open');
        } else {
            document.body.classList.remove('drawer-open');
        }
        return () => document.body.classList.remove('drawer-open');
    }, [isDrawerOpen]);

    const handleDragStart = (e: React.TouchEvent) => {
        dragStartY.current = e.touches[0].clientY;
    };

    const handleDragMove = (e: React.TouchEvent) => {
        if (dragStartY.current === null) return;
        const delta = e.touches[0].clientY - dragStartY.current;
        if (delta > 0) setDragOffset(delta); // only allow dragging down
    };

    const closeDrawer = () => {
        setIsDrawerOpen(false);
        setDragOffset(0);
    };

    const handleDragEnd = () => {
        if (dragOffset > 80) {
            closeDrawer();
        } else {
            setDragOffset(0);
        }
        dragStartY.current = null;
    };

    const planInfo = availablePlans.find(p => p.id === selectedPlanId);

    const sheet = isDrawerOpen ? createPortal(
        <div className="fixed inset-0 z-[100] md:hidden" role="dialog" aria-modal="true" aria-label="Plan Settings">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
                onClick={closeDrawer}
            />

            {/* Sheet Panel */}
            <div
                ref={sheetRef}
                className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-2xl shadow-2xl flex flex-col animate-sheet-slide-up"
                style={{
                    height: '85svh',
                    transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
                    transition: dragOffset > 0 ? 'none' : 'transform 0.3s cubic-bezier(0.32,0.72,0,1)',
                }}
            >
                {/* Drag Handle */}
                <div
                    className="flex-none pt-3 pb-2 flex flex-col items-center touch-none"
                    onTouchStart={handleDragStart}
                    onTouchMove={handleDragMove}
                    onTouchEnd={handleDragEnd}
                    aria-label="Drag to dismiss"
                >
                    <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
                </div>

                {/* Sheet header */}
                <div className="flex-none flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-4 pb-3">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Plan Settings</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Configure your training parameters</p>
                    </div>
                    <button
                        onClick={closeDrawer}
                        aria-label="Close settings drawer"
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-white rounded-lg transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Plan Selector */}
                        <div className="flex flex-col gap-1.5 text-left sm:col-span-2">
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Training Plan</label>
                            <select
                                value={selectedPlanId}
                                onChange={(e) => setPlanId(e.target.value)}
                                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500/50 outline-none transition-colors"
                            >
                                {availablePlans.map(plan => (
                                    <option key={plan.id} value={plan.id}>{plan.type} · {plan.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Units Toggle */}
                        <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-300 dark:border-slate-800/80 text-left">
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-slate-900 dark:text-slate-200">Distance Units</span>
                                <span className="text-xs text-slate-500">Toggle mileage display</span>
                            </div>
                            <button
                                onClick={() => usePlanStore.getState().setUnits(units === 'mi' ? 'km' : 'mi')}
                                className="px-3 py-1.5 bg-slate-200/70 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 transition-colors uppercase"
                            >
                                {units === 'mi' ? 'Miles (mi)' : 'KM (km)'}
                            </button>
                        </div>

                        {/* Theme Toggle */}
                        <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-300 dark:border-slate-800/80 text-left">
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-slate-900 dark:text-slate-200">Appearance</span>
                                <span className="text-xs text-slate-500">Switch color theme</span>
                            </div>
                            <ThemeToggle className="bg-slate-200/70 dark:bg-slate-900" />
                        </div>

                        {/* Race Distance */}
                        <div className="flex flex-col gap-1.5 text-left">
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Recent Race Distance</label>
                            <select
                                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500/50 outline-none transition-colors"
                                value={raceInput?.distance || '10K'}
                                onChange={(e) => {
                                    const state = usePlanStore.getState();
                                    const val = e.target.value as '5K' | '10K' | '15K' | 'Half Marathon' | 'Marathon';
                                    state.setRaceInput(state.raceInput ? { ...state.raceInput, distance: val } : { distance: val, time: '0:45:00' });
                                }}
                            >
                                <option>5K</option>
                                <option>10K</option>
                                <option>15K</option>
                                <option>Half Marathon</option>
                                <option>Marathon</option>
                            </select>
                        </div>

                        {/* Race Time */}
                        <div className="flex flex-col gap-1.5 text-left">
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Recent Race Time</label>
                            <TimeInput
                                value={raceInput?.time || ''}
                                onChange={(val) => {
                                    const state = usePlanStore.getState();
                                    state.setRaceInput(state.raceInput ? { ...state.raceInput, time: val } : { distance: '10K', time: val });
                                }}
                                raceDistance={raceInput?.distance}
                                className="w-full text-base"
                                popupFixed
                            />
                        </div>

                        {/* Race Date */}
                        <div className="flex flex-col gap-1.5 text-left sm:col-span-2">
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Target Race Date</label>
                            <DatePicker
                                value={raceDate}
                                onChange={setRaceDate}
                                className="w-full text-sm"
                                placeholder="Race Date"
                            />
                        </div>
                    </div>
                    <div className="h-4" />
                </div>

                {/* Pinned Done */}
                <div className="flex-none px-4 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <button
                        onClick={closeDrawer}
                        className="w-full py-3.5 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white font-bold rounded-xl transition-colors text-sm uppercase tracking-wider shadow-lg shadow-rose-500/20"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>,
        document.body
    ) : null;

    return (
        <>
        <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800/60 shadow-sm transition-colors text-left">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4 max-w-5xl">
                {/* Brand Logo & Title */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <img
                        src="pwa-512x512.png"
                        alt="Logo"
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl shadow-lg shadow-rose-500/20 object-cover"
                    />
                    <div className="flex flex-col sm:block">
                        <h1 className="text-lg sm:text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-400 leading-none sm:leading-normal">
                            RacePlans
                        </h1>
                        {planInfo && (
                            <span className="text-[10px] sm:hidden text-rose-500 dark:text-rose-400 font-semibold leading-none mt-0.5 max-w-[150px] truncate">
                                {planInfo.type} · {planInfo.name}
                            </span>
                        )}
                    </div>
                </div>

                {/* Desktop Controls (hidden on mobile/tablet portrait/landscape, visible on md and up) */}
                <div className="hidden md:flex flex-wrap items-center justify-end gap-2 sm:gap-3 w-full md:w-auto">
                    <select
                        value={selectedPlanId}
                        onChange={(e) => setPlanId(e.target.value)}
                        aria-label="Select training plan"
                        className="flex-1 min-w-[140px] md:w-64 md:flex-none bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:border-slate-400 dark:hover:border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500/50 outline-none transition-colors"
                    >
                        {availablePlans.map(plan => (
                            <option key={plan.id} value={plan.id}>{plan.type} · {plan.name}</option>
                        ))}
                    </select>

                    <button
                        onClick={() => usePlanStore.getState().setUnits(units === 'mi' ? 'km' : 'mi')}
                        aria-label="Toggle units of measurement"
                        className="flex-none px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors w-12"
                        title="Toggle Units"
                    >
                        {units}
                    </button>

                    <ThemeToggle />

                    <div className="flex gap-1 items-center">
                        <select 
                            aria-label="Select race distance"
                            className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:border-slate-400 dark:hover:border-slate-600 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-rose-500/50 outline-none transition-colors"
                            value={raceInput?.distance || '10K'}
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
                </div>

                {/* Mobile Settings Toggle (visible on mobile/tablet landscape, hidden on md and up) */}
                <div className="flex md:hidden items-center gap-2">
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

        </header>
        {sheet}
        </>
    );
};

