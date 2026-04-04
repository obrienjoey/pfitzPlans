import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AVAILABLE_PLANS } from '../config';

import type { RenderedPlan } from '../types';

export interface RaceInputState {
  distance: '5K' | '10K' | '15K' | 'Half Marathon' | 'Marathon';
  time: string; // "H:MM:SS" or "MM:SS"
}

interface PlanState {
    selectedPlanId: string;
    raceDate: Date | null;
    units: 'mi' | 'km';
    raceInput: RaceInputState | null;
    currentSchedule: RenderedPlan | null;
    setPlanId: (id: string) => void;
    setRaceDate: (date: Date | null) => void;
    setUnits: (units: 'mi' | 'km') => void;
    setRaceInput: (input: RaceInputState | null) => void;
    setSchedule: (schedule: RenderedPlan | null) => void;
    moveWorkout: (fromWeekIndex: number, fromDayIndex: number, toWeekIndex: number, toDayIndex: number) => void;
}

export const usePlanStore = create<PlanState>()(
    persist(
        (set, get) => ({
            selectedPlanId: 'pfitz_18_55_4th',
            raceDate: null,
            units: 'km',
            raceInput: { distance: '10K', time: '0:45:00' },
            currentSchedule: null,
            setPlanId: (id) => {
                const planInfo = AVAILABLE_PLANS.find(p => p.id === id);
                const newType = planInfo?.type;
                const currentPlanInfo = AVAILABLE_PLANS.find(p => p.id === get().selectedPlanId);
                const currentType = currentPlanInfo?.type;

                const updates: Partial<PlanState> = { selectedPlanId: id };

                const DEFAULT_RACE_INPUTS: Record<string, RaceInputState> = {
                    'Marathon': { distance: '10K', time: '0:45:00' },
                    'Half Marathon': { distance: '5K', time: '0:22:00' },
                    '5K': { distance: '5K', time: '0:20:00' },
                };

                // Reset race input if switching race type
                if (newType && newType !== currentType) {
                    updates.raceInput = DEFAULT_RACE_INPUTS[newType] || { distance: '10K', time: '0:45:00' };
                }

                set(updates);
            },
            setRaceDate: (date) => set({ raceDate: date }),
            setUnits: (units) => set({ units }),
            setRaceInput: (input) => set({ raceInput: input }),
            setSchedule: (schedule) => set({ currentSchedule: schedule }),
            moveWorkout: (fromWeekIndex, fromDayIndex, toWeekIndex, toDayIndex) => set((state) => {
                const schedule = state.currentSchedule;
                if (!schedule) return {};

                // Deep copy to avoid mutation issues
                const newSchedule = structuredClone(schedule);

                const fromWeek = newSchedule.weeks[fromWeekIndex];
                const toWeek = newSchedule.weeks[toWeekIndex];

                const fromDay = fromWeek.workouts[fromDayIndex];
                const toDay = toWeek.workouts[toDayIndex];

                // Check if days are valid
                if (!fromDay || !toDay) return {};

                const tempTitle = fromDay.title;
                const tempDesc = fromDay.description;
                const tempDist = fromDay.distance;
                const tempTags = fromDay.tags;

                // Swap Metadata
                fromDay.title = toDay.title;
                fromDay.description = toDay.description;
                fromDay.distance = toDay.distance;
                fromDay.tags = toDay.tags;

                toDay.title = tempTitle;
                toDay.description = tempDesc;
                toDay.distance = tempDist;
                toDay.tags = tempTags;

                return { currentSchedule: newSchedule };
            }),
        }),
        {
            name: 'plan-storage',
            // Custom serialization for Date
            partialize: (state) => {
                // Backward compatibility: map old 'goalTime' to 'raceInput' if saving over an old session
                return {
                    selectedPlanId: state.selectedPlanId,
                    raceDate: state.raceDate ? state.raceDate.toISOString() : null,
                    units: state.units,
                    raceInput: state.raceInput,
                    currentSchedule: state.currentSchedule,
                };
            },
            merge: (persistedState: any, currentState) => {
                const revivedSchedule = persistedState.currentSchedule ? {
                    ...persistedState.currentSchedule,
                    raceDate: new Date(persistedState.currentSchedule.raceDate),
                    startDate: new Date(persistedState.currentSchedule.startDate),
                    weeks: persistedState.currentSchedule.weeks.map((week: any) => ({
                        ...week,
                        weekStart: new Date(week.weekStart),
                        weekEnd: new Date(week.weekEnd),
                        workouts: week.workouts.map((workout: any) => ({
                            ...workout,
                            date: new Date(workout.date)
                        }))
                    }))
                } : null;
                
                // Backwards compat: if old "goalTime" exists but no "raceInput" yet
                let mergedRaceInput = persistedState.raceInput;
                if (!mergedRaceInput && persistedState.goalTime) {
                    const planId = persistedState.selectedPlanId || currentState.selectedPlanId;
                    const planType = AVAILABLE_PLANS.find(p => p.id === planId)?.type;
                    if (planType === 'Half Marathon') {
                        mergedRaceInput = { distance: 'Half Marathon', time: persistedState.goalTime };
                    } else if (planType === '5K') {
                        mergedRaceInput = { distance: '5K', time: persistedState.goalTime };
                    } else {
                        mergedRaceInput = { distance: 'Marathon', time: persistedState.goalTime };
                    }
                }

                return {
                    ...currentState,
                    ...persistedState,
                    raceDate: persistedState.raceDate ? new Date(persistedState.raceDate) : null,
                    currentSchedule: revivedSchedule,
                    raceInput: mergedRaceInput || currentState.raceInput,
                }
            }
        }
    )
);
