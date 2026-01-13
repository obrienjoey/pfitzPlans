import { useEffect, useState, useMemo } from 'react';
import { format } from 'date-fns';
import { usePlanStore } from '../store/usePlanStore';
import { fetchPlan } from '../lib/parser';
import { calculateSchedule } from '../lib/calculator';
import { AVAILABLE_PLANS } from '../config';
import type { Plan } from '../types';
import { calculatePaces, parseTimeString } from '../lib/paceCalculator';
import { WeekCard } from './WeekCard';
import { PaceChart } from './PaceChart';
import {
    DndContext,
    DragOverlay,
    useSensor,
    useSensors,
    MouseSensor,
    TouchSensor,
    closestCenter,
    type DragEndEvent,
    type DragStartEvent
} from '@dnd-kit/core';
import { DayCard } from './DayCard';

export const PlanViewer = () => {
    const { selectedPlanId, raceDate, currentSchedule, setSchedule, moveWorkout, goalTime, units } = usePlanStore();
    const [plan, setPlan] = useState<Plan | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
            const planInfo = AVAILABLE_PLANS.find(p => p.id === selectedPlanId);
            if (!planInfo) return;

            setLoading(true);
            setError(null);
            try {
                const data = await fetchPlan(planInfo.path);
                setPlan(data);
            } catch (err) {
                console.error(err);
                setError('Failed to load plan. Ensure the plan file exists in /public/plans.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [selectedPlanId]);

    // Calculate Paces for consistent display across components
    const paces = useMemo(() => {
        if (!goalTime) return null;
        const totalSeconds = parseTimeString(goalTime);
        if (!totalSeconds) return null;

        // MP per km
        const mpPerKm = totalSeconds / 42.195;
        return calculatePaces(mpPerKm);
    }, [goalTime]);

    // Calculate canonical schedule when inputs change
    useEffect(() => {
        if (plan && raceDate) {
            const canonical = calculateSchedule(plan, raceDate);
            // Initialize store with fresh schedule
            setSchedule(canonical);
        }
    }, [plan, raceDate, setSchedule]);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;
        if (active.id === over.id) return;

        // IDs are formatted as: "week-{w}-day-{d}"
        const parseId = (id: string) => {
            const parts = id.split('-');
            return { week: parseInt(parts[1]), day: parseInt(parts[3]) };
        };

        const src = parseId(active.id as string);
        const dest = parseId(over.id as string);

        moveWorkout(src.week, src.day, dest.week, dest.day);
    };

    // Find the active workout data for the DragOverlay
    const activeWorkout = activeId && currentSchedule ? (() => {
        const parts = activeId.split('-');
        const week = parseInt(parts[1]);
        const day = parseInt(parts[3]);
        return currentSchedule.weeks[week]?.workouts[day];
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

    if (!currentSchedule) return null;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-800 pb-6 gap-4">
                    <div>
                        <div className="inline-block px-2 py-1 bg-rose-500/10 text-rose-400 text-xs font-bold uppercase tracking-wider rounded mb-2">
                            Running Plan
                        </div>
                        <h2 className="text-3xl font-bold text-slate-100">{currentSchedule.originalPlan.name}</h2>
                        <p className="text-slate-400 mt-2 max-w-2xl leading-relaxed">{currentSchedule.originalPlan.description}</p>
                    </div>
                    <div className="text-left md:text-right bg-slate-900/50 p-4 rounded-xl border border-slate-800 min-w-[140px]">
                        <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Race Date</div>
                        {raceDate && (
                            <div className="flex flex-col md:items-end">
                                <div className="text-2xl font-bold text-rose-400 leading-none mb-1">
                                    {format(raceDate, 'MMM d')}
                                </div>
                                <div className="text-lg text-slate-100 font-medium leading-none mb-1">
                                    {format(raceDate, 'yyyy')}
                                </div>
                                <div className="text-sm text-slate-500 font-bold uppercase tracking-wider">
                                    {format(raceDate, 'EEEE')}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <PaceChart paces={paces || undefined} />

                <div className="space-y-6">
                    {currentSchedule.weeks.map((week, idx) => (
                        <WeekCard key={week.weeksToGoal} week={week} weekIndex={idx} paces={paces || undefined} />
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
        </DndContext>
    );
};
