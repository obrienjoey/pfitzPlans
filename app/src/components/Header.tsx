import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import { usePlanStore } from '../store/usePlanStore';
import { DatePicker } from './DatePicker';
import { TimeInput } from './TimeInput';
import { ThemeToggle } from './ThemeToggle';

/**
 * Header (Variant B: Minimalist Popover Hub)
 * Ultra-clean, distraction-free top bar featuring an interactive telemetry chip
 * that opens a focused training calibration card on desktop and a bottom drawer on mobile.
 */

/** Compact runner shorthand so the chip never truncates mid-word.
 *  "Pfitzinger/Douglas: Up to 55 miles per week, 18-week schedule" → "Mar 18wk · ≤55 mi"
 *  "Faster Road Racing: 5K Schedule 1" → "5K S1" */
const shortPlanChip = (plan?: { name: string; type: string; weeks: number }): string => {
    if (!plan) return 'Select Plan';
    const sched = plan.name.match(/schedule\s*(\d+)/i)?.[1];
    if (/faster road racing/i.test(plan.name) && sched) {
        return `${plan.type} S${sched}`;
    }
    const upTo = plan.name.match(/up to\s*(\d+)\s*mi/i)?.[1];
    if (upTo) {
        const prefix = plan.type === 'Marathon' ? 'Mar' : plan.type === 'Half Marathon' ? 'HM' : plan.type;
        return `${prefix} ${plan.weeks}wk · ≤${upTo} mi`;
    }
    const range = plan.name.match(/(\d+)\s*[–-]\s*(\d+)\s*mi/i);
    if (range) {
        const prefix = plan.type === 'Marathon' ? 'Mar' : plan.type === 'Half Marathon' ? 'HM' : plan.type;
        return `${prefix} ${plan.weeks}wk · ${range[1]}–${range[2]} mi`;
    }
    return plan.weeks ? `${plan.type} ${plan.weeks}wk` : plan.name;
};

/** "0:45:00" → "45:00" so the chip reads like a result, not a timestamp. */
const shortTime = (t?: string): string => (t ?? '').replace(/^0:/, '');
const CalibrationForm = () => {
    const { selectedPlanId, setPlanId, raceDate, setRaceDate, availablePlans } = usePlanStore();
    const units = usePlanStore(state => state.units);
    const raceInput = usePlanStore(state => state.raceInput);

    return (
        <div className="space-y-4 text-left">
            {/* Plan selector */}
            <div>
                <label htmlFor="header-plan-select" className="block font-data text-[10px] uppercase font-bold tracking-wider text-pencil mb-1">
                    Training Plan
                </label>
                <select
                    id="header-plan-select"
                    value={selectedPlanId}
                    onChange={(e) => setPlanId(e.target.value)}
                    className="w-full bg-paper border border-rule hover:border-pencil/60 rounded-none px-3 py-2 text-xs font-data text-ink focus:ring-1 focus:ring-marker outline-none transition-colors"
                >
                    {availablePlans.map(plan => (
                        <option key={plan.id} value={plan.id}>{plan.type} · {plan.name}</option>
                    ))}
                </select>
            </div>

            {/* Recent Race & Effort */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label htmlFor="header-bench-dist" className="block font-data text-[10px] uppercase font-bold tracking-wider text-pencil mb-1">
                        Recent Benchmark Distance
                    </label>
                    <select
                        id="header-bench-dist"
                        className="w-full bg-paper border border-rule hover:border-pencil/60 rounded-none px-3 py-2 text-xs font-data text-ink focus:ring-1 focus:ring-marker outline-none transition-colors"
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
                </div>
                <div>
                    <label className="block font-data text-[10px] uppercase font-bold tracking-wider text-pencil mb-1">
                        Recent Finish Time
                    </label>
                    <TimeInput
                        value={raceInput?.time || ''}
                        onChange={(val) => {
                            const state = usePlanStore.getState();
                            state.setRaceInput(state.raceInput ? { ...state.raceInput, time: val } : { distance: '10K', time: val });
                        }}
                        raceDistance={raceInput?.distance}
                        className="w-full text-xs"
                    />
                </div>
            </div>

            {/* Race Date & Units */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label className="block font-data text-[10px] uppercase font-bold tracking-wider text-pencil mb-1">
                        Target Race Day
                    </label>
                    <DatePicker
                        value={raceDate}
                        onChange={setRaceDate}
                        className="w-full text-xs"
                        placeholder="Select Race Date"
                    />
                </div>
                <div>
                    <label className="block font-data text-[10px] uppercase font-bold tracking-wider text-pencil mb-1">
                        Distance Units
                    </label>
                    <div className="flex border border-rule bg-paper p-0.5">
                        <button
                            type="button"
                            onClick={() => usePlanStore.getState().setUnits('mi')}
                            className={`flex-1 py-1.5 font-data text-xs transition-colors ${units === 'mi' ? 'bg-ink text-paper font-bold' : 'text-pencil hover:text-ink'}`}
                        >
                            Miles (mi)
                        </button>
                        <button
                            type="button"
                            onClick={() => usePlanStore.getState().setUnits('km')}
                            className={`flex-1 py-1.5 font-data text-xs transition-colors ${units === 'km' ? 'bg-ink text-paper font-bold' : 'text-pencil hover:text-ink'}`}
                        >
                            KM (km)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const Header = () => {
    const { availablePlans } = usePlanStore();
    const { selectedPlanId, raceDate } = usePlanStore();
    const units = usePlanStore(state => state.units);
    const raceInput = usePlanStore(state => state.raceInput);
    const [isOpen, setIsOpen] = useState(false);

    const popoverRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const mobileSheetRef = useRef<HTMLDivElement>(null);

    // Mobile drag-to-dismiss state
    const dragStartY = useRef<number | null>(null);
    const [dragOffset, setDragOffset] = useState(0);

    // Lock body scroll while open on mobile
    useEffect(() => {
        if (isOpen) {
            document.body.classList.add('drawer-open');
        } else {
            document.body.classList.remove('drawer-open');
        }
        return () => document.body.classList.remove('drawer-open');
    }, [isOpen]);

    // Close on outside click or escape key
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            if (
                popoverRef.current?.contains(target) ||
                triggerRef.current?.contains(target) ||
                mobileSheetRef.current?.contains(target)
            ) {
                return;
            }
            // Ignore clicks inside portaled overlays (e.g. DatePicker popup)
            if ((target as HTMLElement).closest?.('[data-datepicker-popup]')) {
                return;
            }
            setIsOpen(false);
            setDragOffset(0);
        };
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
                setDragOffset(0);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEsc);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEsc);
        };
    }, [isOpen]);

    const handleDragStart = (e: React.TouchEvent) => {
        dragStartY.current = e.touches[0].clientY;
    };

    const handleDragMove = (e: React.TouchEvent) => {
        if (dragStartY.current === null) return;
        const delta = e.touches[0].clientY - dragStartY.current;
        if (delta > 0) setDragOffset(delta);
    };

    const handleDragEnd = () => {
        if (dragOffset > 80) {
            setIsOpen(false);
            setDragOffset(0);
        } else {
            setDragOffset(0);
        }
        dragStartY.current = null;
    };

    const planInfo = availablePlans.find(p => p.id === selectedPlanId);
    const formattedRaceDate = raceDate ? format(new Date(raceDate), 'MMM d, yyyy') : 'Set Race Date';


    // Mobile Bottom Sheet Portal
    const mobileSheet = isOpen ? createPortal(
        <div className="fixed inset-0 z-[100] md:hidden" role="dialog" aria-modal="true" aria-label="Training Calibration Settings">
            <div
                className="fixed inset-0 bg-ink/50 backdrop-blur-sm"
                onClick={() => { setIsOpen(false); setDragOffset(0); }}
            />
            <div
                ref={mobileSheetRef}
                className="fixed bottom-0 left-0 right-0 bg-card border-t border-rule shadow-2xl flex flex-col animate-sheet-slide-up"
                style={{
                    maxHeight: '85svh',
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

                {/* Header */}
                <div className="flex-none flex items-center justify-between border-b border-rule px-4 pb-3">
                    <div>
                        <h2 className="font-display font-semibold uppercase text-xl text-ink leading-none">Training Calibration</h2>
                        <p className="text-xs text-pencil font-data mt-0.5">Plan, race day, and pace baseline</p>
                    </div>
                    <button
                        onClick={() => { setIsOpen(false); setDragOffset(0); }}
                        aria-label="Close settings"
                        className="p-1.5 bg-paper hover:bg-paper/70 text-pencil hover:text-ink border border-rule transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-4">
                    <CalibrationForm />
                </div>

                {/* Pinned Apply Button */}
                <div className="flex-none px-4 py-4 border-t border-rule bg-card">
                    <button
                        onClick={() => { setIsOpen(false); setDragOffset(0); }}
                        className="w-full py-3 bg-marker hover:bg-marker/90 active:bg-marker/80 text-paper font-bold font-data text-xs uppercase tracking-wider transition-colors"
                    >
                        Apply & Close
                    </button>
                </div>
            </div>
        </div>,
        document.body
    ) : null;

    return (
        <>
            <header className="sticky top-0 z-50 backdrop-blur bg-paper/90 border-b border-rule transition-colors text-left">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4 max-w-5xl">
                    {/* Brand Logo & Title */}
                    <div className="flex items-center gap-2.5 shrink-0">
                        <img
                            src="pwa-512x512.png"
                            alt="Logo"
                            className="w-8 h-8 object-cover"
                        />
                        <div>
                            <h1 className="font-display font-bold uppercase text-xl sm:text-2xl tracking-wide text-ink leading-none">
                                RacePlans
                            </h1>
                            <p className="text-[10px] text-pencil font-data uppercase tracking-wider hidden sm:block">
                                Interactive Training Log
                            </p>
                        </div>
                    </div>

                    {/* Center / Right: Interactive Telemetry Chip */}
                    <div className="flex items-center gap-2 relative">
                        <button
                            ref={triggerRef}
                            onClick={() => setIsOpen(!isOpen)}
                            aria-expanded={isOpen}
                            aria-label={`Open plan settings. Current: ${planInfo ? planInfo.name : 'no plan'}, ${raceInput?.distance} ${raceInput?.time}, ${formattedRaceDate}`}
                            title={planInfo ? planInfo.name : 'Select plan'}
                            className={`group relative flex items-center gap-2 sm:gap-3 px-3.5 py-2 border transition-all duration-200 text-left bg-card ${
                                isOpen 
                                    ? 'border-marker ring-2 ring-marker/30 shadow-md' 
                                    : 'border-rule hover:border-pencil/80 hover:bg-ink/[0.02]'
                            }`}
                        >
                            <div className="w-2 h-2 rounded-full bg-marker shrink-0" />
                            <div className="flex flex-row items-center gap-2">
                                <span className="font-data font-bold text-xs text-ink whitespace-nowrap">
                                    {shortPlanChip(planInfo)}
                                </span>
                                <span className="text-pencil/50" aria-hidden="true">|</span>
                                <span className="font-data text-[11px] text-pencil whitespace-nowrap">
                                    {raceInput?.distance} {shortTime(raceInput?.time)}
                                </span>
                                <span className="text-pencil/50 hidden md:inline" aria-hidden="true">|</span>
                                <span className="font-data text-[11px] text-marker font-semibold hidden md:inline whitespace-nowrap">
                                    {formattedRaceDate}
                                </span>
                            </div>
                            <span className={`font-data text-xs text-pencil transition-transform duration-200 ml-1 ${isOpen ? 'rotate-180 text-marker' : 'group-hover:text-ink'}`}>
                                ▾
                            </span>
                        </button>

                        {/* Desktop Global Controls */}
                        <div className="hidden sm:flex items-center gap-1.5 border-l border-rule pl-2">
                            <button
                                onClick={() => usePlanStore.getState().setUnits(units === 'mi' ? 'km' : 'mi')}
                                aria-label="Toggle units of measurement"
                                className="px-2.5 py-1.5 bg-card border border-rule hover:border-pencil/60 text-xs font-bold text-ink font-data transition-colors uppercase"
                                title="Toggle Units"
                            >
                                {units}
                            </button>
                            <ThemeToggle />
                        </div>

                        {/* Desktop Dropdown Popover */}
                        {isOpen && (
                            <div
                                ref={popoverRef}
                                className="hidden md:block absolute right-0 top-full mt-2 w-[460px] bg-card border border-rule shadow-2xl p-5 z-50 animate-in text-left"
                            >
                                <div className="flex items-center justify-between border-b border-rule pb-3 mb-4">
                                    <div>
                                        <h3 className="font-display font-bold uppercase text-lg text-ink leading-none">Training Calibration</h3>
                                        <p className="text-xs text-pencil font-data mt-0.5">Configure target race parameters and pace baseline</p>
                                    </div>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="text-pencil hover:text-ink p-1 font-data text-xs"
                                        aria-label="Close popover"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <CalibrationForm />

                                <div className="mt-5 pt-3 border-t border-rule flex justify-end">
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="px-4 py-2 bg-marker hover:bg-marker/90 text-paper font-data font-bold text-xs uppercase tracking-wider transition-colors"
                                    >
                                        Apply & Close
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>
            {mobileSheet}
        </>
    );
};
