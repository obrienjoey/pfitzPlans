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
                className="fixed inset-0 bg-ink/50 backdrop-blur-sm"
                onClick={closeDrawer}
            />

            {/* Sheet Panel */}
            <div
                ref={sheetRef}
                className="fixed bottom-0 left-0 right-0 bg-card border-t border-rule shadow-2xl flex flex-col animate-sheet-slide-up"
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
                    <div className="w-10 h-1.5 bg-pencil/50" />
                </div>

                {/* Sheet header */}
                <div className="flex-none flex items-center justify-between border-b border-rule px-4 pb-3">
                    <div>
                        <h2 className="font-display font-semibold uppercase text-xl text-ink leading-none">Plan Settings</h2>
                        <p className="text-xs text-pencil mt-1">Plan, race day, and pace settings</p>
                    </div>
                    <button
                        onClick={closeDrawer}
                        aria-label="Close settings drawer"
                        className="p-1.5 bg-paper hover:bg-paper/70 text-pencil hover:text-ink border border-rule rounded-none transition-colors"
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
                            <label className="text-[10px] font-semibold text-pencil uppercase tracking-[0.15em] font-data">Training Plan</label>
                            <select
                                value={selectedPlanId}
                                onChange={(e) => setPlanId(e.target.value)}
                                className="w-full bg-card border border-rule hover:border-pencil/60 rounded-none px-3 py-2.5 text-sm text-ink font-data focus:ring-2 focus:ring-marker/50 outline-none transition-colors"
                            >
                                {availablePlans.map(plan => (
                                    <option key={plan.id} value={plan.id}>{plan.type} · {plan.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Units Toggle */}
                        <div className="flex items-center justify-between bg-paper p-3 border border-rule text-left">
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-ink">Distance units</span>
                                <span className="text-xs text-pencil">Show miles or kilometres</span>
                            </div>
                            <button
                                onClick={() => usePlanStore.getState().setUnits(units === 'mi' ? 'km' : 'mi')}
                                className="px-3 py-1.5 bg-card border border-rule hover:border-pencil/60 rounded-none text-xs font-bold text-marker font-data transition-colors uppercase"
                            >
                                {units === 'mi' ? 'Miles (mi)' : 'KM (km)'}
                            </button>
                        </div>

                        {/* Theme Toggle */}
                        <div className="flex items-center justify-between bg-paper p-3 border border-rule text-left">
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-ink">Appearance</span>
                                <span className="text-xs text-pencil">Light, dark, or system</span>
                            </div>
                            <ThemeToggle />
                        </div>

                        {/* Race Distance */}
                        <div className="flex flex-col gap-1.5 text-left">
                            <label className="text-[10px] font-semibold text-pencil uppercase tracking-[0.15em] font-data">Recent Race Distance</label>
                            <select
                                className="w-full bg-card border border-rule hover:border-pencil/60 rounded-none px-3 py-2.5 text-sm text-ink font-data focus:ring-2 focus:ring-marker/50 outline-none transition-colors"
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
                            <label className="text-[10px] font-semibold text-pencil uppercase tracking-[0.15em] font-data">Recent Race Time</label>
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
                            <label className="text-[10px] font-semibold text-pencil uppercase tracking-[0.15em] font-data">Target Race Date</label>
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
                <div className="flex-none px-4 py-4 border-t border-rule bg-card">
                    <button
                        onClick={closeDrawer}
                        className="w-full py-3.5 bg-marker hover:bg-marker/90 active:bg-marker/80 text-paper font-bold rounded-none transition-colors text-sm uppercase tracking-[0.12em] font-data"
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
        <header className="sticky top-0 z-50 backdrop-blur bg-paper/90 border-b border-rule transition-colors text-left">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4 max-w-5xl">
                {/* Brand Logo & Title */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <img
                        src="pwa-512x512.png"
                        alt="Logo"
                        className="w-8 h-8 sm:w-10 sm:h-10 object-cover"
                    />
                    <div className="flex flex-col sm:block">
                        <h1 className="font-display font-bold uppercase text-2xl tracking-wide text-ink leading-none sm:leading-normal">
                            RacePlans
                        </h1>
                        {planInfo && (
                            <span className="text-[10px] sm:hidden text-marker font-semibold leading-none mt-0.5 max-w-[150px] truncate">
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
                        className="flex-1 min-w-[140px] md:w-64 md:flex-none bg-card border border-rule text-ink hover:border-pencil/60 rounded-none px-3 py-2 text-sm font-data focus:ring-2 focus:ring-marker/50 outline-none transition-colors"
                    >
                        {availablePlans.map(plan => (
                            <option key={plan.id} value={plan.id}>{plan.type} · {plan.name}</option>
                        ))}
                    </select>

                    <button
                        onClick={() => usePlanStore.getState().setUnits(units === 'mi' ? 'km' : 'mi')}
                        aria-label="Toggle units of measurement"
                        className="flex-none px-3 py-2 bg-card border border-rule hover:border-pencil/60 rounded-none text-sm font-medium text-ink font-data transition-colors w-12"
                        title="Toggle Units"
                    >
                        {units}
                    </button>

                    <ThemeToggle />

                    <div className="flex gap-1 items-center">
                        <select 
                            aria-label="Select race distance"
                            className="bg-card border border-rule text-ink hover:border-pencil/60 rounded-none px-2 py-2 text-sm font-data focus:ring-2 focus:ring-marker/50 outline-none transition-colors"
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
                        className="p-2 bg-card border border-rule hover:border-pencil/60 rounded-none text-pencil hover:text-ink transition-colors"
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

