import { useEffect, useState, useMemo } from 'react';
import { usePlanStore } from '../store/usePlanStore';
import { fetchPlan } from '../lib/parser';
import { calculateSchedule, calculateWeeklyVolume } from '../lib/calculator';
import { scheduleMatchesValid } from '../lib/scheduleGuard';
import type { Plan } from '../types';
import { calculateTrainingPaces, parseTimeString } from '../lib/paceCalculator';
import { completedVolumeForWeek } from '../lib/actualLog';
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
    KeyboardSensor,
    closestCenter,
    type DragEndEvent,
    type DragStartEvent,
    type DragOverEvent
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { DayCard } from './DayCard';
import { TodayBand } from './TodayBand';

const parseWorkoutId = (id: string) => {
    const parts = id.split('-');
    return { week: parseInt(parts[1], 10), day: parseInt(parts[3], 10) };
};

export const PlanViewer = () => {

    const { selectedPlanId, raceDate, currentSchedule, setSchedule, moveWorkout, raceInput, units, availablePlans, workoutLogs } = usePlanStore();
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
            // Snappier 200ms hold on mobile touch with 6px tolerance
            activationConstraint: { delay: 200, tolerance: 6 }
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates
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

    // Logged mileage per week from the completion toggles. Future weeks are
    // null (nothing to log yet) so charts/cards render planned-only.
    const actualVolumes = useMemo(() => {
        if (!validSchedule) return [];
        const today = new Date();
        return validSchedule.weeks.map((week, idx) =>
            new Date(week.weekStart) <= today
                ? completedVolumeForWeek(week, idx, selectedPlanId, workoutLogs, units)
                : null
        );
    }, [validSchedule, selectedPlanId, workoutLogs, units]);

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
        <div className="flex items-center justify-center py-20" role="status" aria-label="Loading training plan">
            <div className="w-8 h-8 border-4 border-pencil/30 border-t-marker rounded-full animate-spin"></div>
        </div>
    );

    if (error) return (
        <div className="p-6 bg-marker/5 border border-marker/30 text-ink rounded-none text-center font-data text-sm">
            Couldn&apos;t load this plan. Check your connection and reload the page.
        </div>
    );

    if (!validSchedule) return null;

    const planName = plan?.name || planInfo?.name || validSchedule.originalPlan?.name || 'Training plan';
    const weekVolumes = validSchedule.weeks.map(w => calculateWeeklyVolume(w, units).average);
    const peakVolume = Math.round(Math.max(...weekVolumes, 0));

    const jumpToToday = () => {
        if (currentWeekIndex >= 0) {
            document.getElementById(`week-card-${currentWeekIndex}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="space-y-6 animate-in">
                <TodayBand
                    schedule={validSchedule}
                    raceDate={raceDate}
                    planName={planName}
                    planType={plan?.type || planInfo?.type || 'Marathon'}
                    units={units}
                    peakVolume={peakVolume}
                    onJump={jumpToToday}
                />

                <MileageChart weeks={validSchedule.weeks} units={units} actualVolumes={actualVolumes} />

                <PaceChart
                    paces={paces || undefined}
                    equivalents={equivalents || undefined}
                    units={units}
                    raceInput={raceInput}
                    planType={plan?.type || 'Marathon'}
                />

                <div className="space-y-5">
                    {validSchedule.weeks.map((week, idx) => (
                        <WeekCard
                            key={week.weeksToGoal}
                            week={week}
                            weekIndex={idx}
                            paces={paces || undefined}
                            activeId={activeId || undefined}
                            overId={overId || undefined}
                            actualVolume={actualVolumes[idx] ?? undefined}
                        />
                    ))}
                </div>
            </div>

            <DragOverlay>
                {activeWorkout ? (
                    <div
                        className="cursor-grabbing scale-[1.01] shadow-2xl border-2 border-ink bg-card transition-transform duration-150"
                        style={{ width: 'min(90vw, 56rem)' }}
                    >
                        <div className="relative">
                            <span className="absolute -top-3 left-4 z-20 px-2.5 py-0.5 bg-ink text-paper font-data text-[10px] font-bold tracking-wider shadow">
                                ▲ REORDERING
                            </span>
                            <DayCard
                                workout={activeWorkout}
                                date={activeWorkout.date}
                                isRaceDay={false}
                                units={units}
                                paces={paces || undefined}
                            />
                        </div>
                    </div>
                ) : null}
            </DragOverlay>

            {currentWeekIndex !== -1 && (
                <button
                    onClick={jumpToToday}
                    className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2 px-3.5 py-2.5 sm:px-4 sm:py-3 bg-marker hover:bg-marker/90 active:bg-marker/80 text-paper font-data font-bold text-xs sm:text-sm uppercase tracking-[0.12em] rounded-none shadow-lg transition-colors"
                    aria-label="Jump to current week"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true">
                        <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm-3.75 8.25v9a1.5 1.5 0 001.5 1.5h15a1.5 1.5 0 001.5-1.5v-9h-18z" clipRule="evenodd" />
                    </svg>
                    <span>Current week</span>
                </button>
            )}
        </DndContext>
    );
};
