import { useEffect, useState, useMemo } from 'react';
import { format } from 'date-fns';
import { usePlanStore } from '../store/usePlanStore';
import { fetchPlan } from '../lib/parser';
import { calculateSchedule } from '../lib/calculator';
import { scheduleMatchesValid } from '../lib/scheduleGuard';
import type { Plan } from '../types';
import { calculateTrainingPaces, parseTimeString } from '../lib/paceCalculator';
import { WeekCard } from './WeekCard';
import { PaceChart } from './PaceChart';
import { MileageChart } from './MileageChart';
import {
    DndContext,
    DragOverlay,
    useSensor,
    useSensors,
    MouseSensor,
    TouchSensor,
    closestCenter,
    type DragEndEvent,
    type DragStartEvent,
    type DragOverEvent
} from '@dnd-kit/core';
import { DayCard } from './DayCard';
// PROTOTYPE (?today=A|B|C) — throwaway today-awareness/countdown variants. Dev-only.
import { TodayPrototype } from '../prototype/today/TodayPrototype';

const parseWorkoutId = (id: string) => {
    const parts = id.split('-');
    return { week: parseInt(parts[1], 10), day: parseInt(parts[3], 10) };
};

export const PlanViewer = () => {
    const { selectedPlanId, raceDate, currentSchedule, setSchedule, moveWorkout, raceInput, units, availablePlans } = usePlanStore();
    const [plan, setPlan] = useState<Plan | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [overId, setOverId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const planInfo = useMemo(() => {
        return availablePlans.find(p => p.id === selectedPlanId);
    }, [availablePlans, selectedPlanId]);

    // Derived valid schedule: returns currentSchedule iff its fingerprint matches
    // selectedPlanId and raceDate by value. Immediately null when config changes,
    // preventing any 1-frame render flash of a mismatched schedule.
    const validSchedule = useMemo(() => {
        return scheduleMatchesValid(currentSchedule, selectedPlanId, raceDate) ? currentSchedule : null;
    }, [currentSchedule, selectedPlanId, raceDate]);

    // Sensors for better UX (especially avoiding conflict with scrolling)
    const sensors = useSensors(
        useSensor(MouseSensor, {
            // Require movement of 10px before drag starts to prevent accidental clicks
            activationConstraint: { distance: 10 }
        }),
        useSensor(TouchSensor, {
            // Require hold of 250ms and move of 5px for touch
            activationConstraint: { delay: 250, tolerance: 5 }
        })
    );

    useEffect(() => {
        const load = async () => {
            const planInfo = availablePlans.find(p => p.id === selectedPlanId);
            if (!planInfo) return;

            // Do NOT clear the schedule here. Unconditionally setting it to null on load
            // is what once discarded a reordered schedule on every page refresh (issue #14).
            // The persisted schedule is trusted (or regenerated) by the guarded effect below.
            setLoading(true);
            setError(null);
            try {
                const data = await fetchPlan(planInfo.path);
                setPlan(data);
            } catch (err) {
                console.error(err);
                setError('Failed to load training plan');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [selectedPlanId, availablePlans]);

    const data = useMemo(() => {
        if (!raceInput || !plan) return null;
        const totalSeconds = parseTimeString(raceInput.time);
        if (!totalSeconds) return null;

        return calculateTrainingPaces({ distance: raceInput.distance, timeSeconds: totalSeconds }, plan.type);
    }, [raceInput, plan]);
    
    const paces = data?.paces;
    const equivalents = data?.equivalents;

    // Calculate canonical schedule when inputs change — but only when the currently stored
    // schedule is NOT valid for reuse. Guard-based TRUST (issue #14): a persisted schedule
    // whose fingerprint matches the current configuration (same plan, same race date) is kept
    // as-is, preserving any reordered workouts across reloads. A mismatch or absence is a
    // deliberate fresh start: regenerate canonical (which resets reorders).
    useEffect(() => {
        if (plan && raceDate) {
            if (validSchedule) {
                return;
            }
            const canonical = calculateSchedule(plan, raceDate);
            setSchedule(canonical);
        }
    }, [plan, raceDate, validSchedule, setSchedule]);

    const currentWeekIndex = useMemo(() => {
        if (!validSchedule) return -1;
        const today = new Date();
        return validSchedule.weeks.findIndex(week => {
            const start = new Date(week.weekStart);
            const end = new Date(week.weekEnd);
            return today >= start && today <= end;
        });
    }, [validSchedule]);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragOver = (event: DragOverEvent) => {
        setOverId(event.over?.id as string || null);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        setOverId(null);

        if (!over) return;
        if (active.id === over.id) return;

        // IDs are formatted as: "week-{w}-day-{d}"
        const src = parseWorkoutId(active.id as string);
        const dest = parseWorkoutId(over.id as string);

        moveWorkout(src.week, src.day, dest.week, dest.day);
    };

    // Find the active workout data for the DragOverlay
    const activeWorkout = activeId && validSchedule ? (() => {
        const { week, day } = parseWorkoutId(activeId);
        return validSchedule.weeks[week]?.workouts[day];
    })() : null;

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-slate-700 border-t-rose-500 rounded-full animate-spin"></div>
        </div>
    );

    if (error) return (
        <div className="p-6 bg-red-900/20 border border-red-500/30 text-red-200 rounded-xl text-center">
            Error: {error}
        </div>
    );

    if (!validSchedule) return null;

    // PROTOTYPE gate — mount only in dev builds with ?today= present.
    const showTodayPrototype =
        import.meta.env.DEV &&
        typeof window !== 'undefined' &&
        new URLSearchParams(window.location.search).get('today') !== null;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 dark:border-slate-800 pb-6 gap-4">
                    <div>
                        <div className="inline-block px-2 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-wider rounded mb-2">
                            Running Plan
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{plan?.name || planInfo?.name || validSchedule.originalPlan?.name}</h2>
                        <p className="text-slate-600 dark:text-slate-400 mt-2 max-w-2xl leading-relaxed">{plan?.description || planInfo?.description || validSchedule.originalPlan?.description}</p>
                    </div>
                    <div className="text-left md:text-right bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 min-w-[140px] shadow-sm">
                        <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Race Date</div>
                        {raceDate && (
                            <div className="flex flex-col md:items-end">
                                <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 leading-none mb-1">
                                    {format(raceDate, 'MMM d')}
                                </div>
                                <div className="text-lg text-slate-900 dark:text-slate-100 font-medium leading-none mb-1">
                                    {format(raceDate, 'yyyy')}
                                </div>
                                <div className="text-sm text-slate-500 font-bold uppercase tracking-wider">
                                    {format(raceDate, 'EEEE')}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <MileageChart weeks={validSchedule.weeks} units={units} />

                <PaceChart
                    paces={paces || undefined}
                    equivalents={equivalents || undefined}
                    units={units}
                    raceInput={raceInput}
                    planType={plan?.type || 'Marathon'}
                />

                {showTodayPrototype && (
                    <TodayPrototype schedule={validSchedule} units={units} />
                )}

                <div className="space-y-6">
                    {validSchedule.weeks.map((week, idx) => (
                        <WeekCard
                            key={week.weeksToGoal}
                            week={week}
                            weekIndex={idx}
                            paces={paces || undefined}
                            activeId={activeId || undefined}
                            overId={overId || undefined}
                        />
                    ))}
                </div>
            </div>

            <DragOverlay>
                {activeWorkout ? (
                    <div className="opacity-90 scale-105 cursor-grabbing">
                        <DayCard
                            workout={activeWorkout}
                            date={activeWorkout.date} // optional override, though effectively same
                            isRaceDay={false}
                            units={units}
                            paces={paces || undefined}
                        />
                    </div>
                ) : null}
            </DragOverlay>

            {currentWeekIndex !== -1 && (
                <button
                    onClick={() => {
                        document.getElementById(`week-card-${currentWeekIndex}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-sm rounded-full shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 border border-indigo-500/30"
                    aria-label="Jump to current week"
                >
                    <span>📅</span>
                    <span>Jump to Current Week</span>
                </button>
            )}
        </DndContext>
    );
};
