import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AVAILABLE_PLANS } from '../config';

import type { RenderedPlan } from '../types';

export type WorkoutStatus = 'completed' | 'skipped' | 'modified' | 'none';

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
    workoutLogs: Record<string, WorkoutStatus>;
    setPlanId: (id: string) => void;
    setRaceDate: (date: Date | null) => void;
    setUnits: (units: 'mi' | 'km') => void;
    setRaceInput: (input: RaceInputState | null) => void;
    setSchedule: (schedule: RenderedPlan | null) => void;
    moveWorkout: (fromWeekIndex: number, fromDayIndex: number, toWeekIndex: number, toDayIndex: number) => void;
    setWorkoutStatus: (weekIndex: number, dayIndex: number, status: WorkoutStatus) => void;
}

interface PersistedWorkout {
    date: string;
    [key: string]: unknown;
}

interface PersistedWeek {
    weekStart: string;
    weekEnd: string;
    workouts: PersistedWorkout[];
    [key: string]: unknown;
}

interface PersistedSchedule {
    raceDate: string;
    startDate: string;
    weeks: PersistedWeek[];
    [key: string]: unknown;
}

interface PersistedState {
    selectedPlanId?: string;
    raceDate?: string | null;
    units?: 'mi' | 'km';
    raceInput?: RaceInputState | null;
    currentSchedule?: PersistedSchedule | null;
    goalTime?: string;
    workoutLogs?: Record<string, WorkoutStatus>;
}

export const usePlanStore = create<PlanState>()(
    persist(
        (set, get) => ({
            selectedPlanId: 'pfitz_18_55_4th',
            raceDate: null,
            units: 'km',
            raceInput: { distance: '10K', time: '0:45:00' },
            currentSchedule: null,
            workoutLogs: {},
            setPlanId: (id) => {
                const planInfo = AVAILABLE_PLANS.find(p => p.id === id);
                const newType = planInfo?.type;
                const currentPlanInfo = AVAILABLE_PLANS.find(p => p.id === get().selectedPlanId);
                const currentType = currentPlanInfo?.type;

                const updates: Partial<PlanState> = { selectedPlanId: id };

                const DEFAULT_RACE_INPUTS: Record<string, RaceInputState> = {
                    'Marathon': { distance: 'Marathon', time: '3:30:00' },
                    'Half Marathon': { distance: 'Half Marathon', time: '1:45:00' },
                    '5K': { distance: '5K', time: '0:20:00' },
                    '10K': { distance: '10K', time: '0:45:00' },
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

                // Swap completion status logs
                const fromKey = `${state.selectedPlanId}-w${fromWeekIndex}-d${fromDayIndex}`;
                const toKey = `${state.selectedPlanId}-w${toWeekIndex}-d${toDayIndex}`;
                const newLogs = { ...state.workoutLogs };
                const fromStatus = newLogs[fromKey];
                const toStatus = newLogs[toKey];

                if (fromStatus) {
                    newLogs[toKey] = fromStatus;
                } else {
                    delete newLogs[toKey];
                }

                if (toStatus) {
                    newLogs[fromKey] = toStatus;
                } else {
                    delete newLogs[fromKey];
                }

                return { 
                    currentSchedule: newSchedule,
                    workoutLogs: newLogs
                };
            }),
            setWorkoutStatus: (weekIndex, dayIndex, status) => set((state) => {
                const key = `${state.selectedPlanId}-w${weekIndex}-d${dayIndex}`;
                const newLogs = { ...state.workoutLogs };
                if (status === 'none') {
                    delete newLogs[key];
                } else {
                    newLogs[key] = status;
                }
                return { workoutLogs: newLogs };
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
                    workoutLogs: state.workoutLogs,
                };
            },
            merge: (persistedState: unknown, currentState) => {
                const pState = persistedState as PersistedState;
                if (!pState) return currentState;

                const revivedSchedule = pState.currentSchedule ? {
                    ...pState.currentSchedule,
                    raceDate: new Date(pState.currentSchedule.raceDate),
                    startDate: new Date(pState.currentSchedule.startDate),
                    weeks: pState.currentSchedule.weeks.map((week) => ({
                        ...week,
                        weekStart: new Date(week.weekStart),
                        weekEnd: new Date(week.weekEnd),
                        workouts: week.workouts.map((workout) => ({
                            ...workout,
                            date: new Date(workout.date)
                        }))
                    }))
                } : null;
                
                // Backwards compat: if old "goalTime" exists but no "raceInput" yet
                let mergedRaceInput = pState.raceInput;
                if (!mergedRaceInput && pState.goalTime) {
                    const planId = pState.selectedPlanId || currentState.selectedPlanId;
                    const planType = AVAILABLE_PLANS.find(p => p.id === planId)?.type;
                    if (planType === 'Half Marathon') {
                        mergedRaceInput = { distance: 'Half Marathon', time: pState.goalTime };
                    } else if (planType === '5K') {
                        mergedRaceInput = { distance: '5K', time: pState.goalTime };
                    } else if (planType === '10K') {
                        mergedRaceInput = { distance: '10K', time: pState.goalTime };
                    } else {
                        mergedRaceInput = { distance: 'Marathon', time: pState.goalTime };
                    }
                }

                let revivedRaceDate = pState.raceDate ? new Date(pState.raceDate) : null;
                if (revivedRaceDate && (isNaN(revivedRaceDate.getTime()) || revivedRaceDate.getFullYear() < 2020 || revivedRaceDate.getFullYear() > 2050)) {
                    revivedRaceDate = null;
                }

                // If the schedule date is corrupted, discard the schedule too
                let finalRevivedSchedule = revivedSchedule;
                if (revivedSchedule && revivedSchedule.raceDate && (isNaN(revivedSchedule.raceDate.getTime()) || revivedSchedule.raceDate.getFullYear() < 2020 || revivedSchedule.raceDate.getFullYear() > 2050)) {
                    finalRevivedSchedule = null;
                }

                return {
                    ...currentState,
                    ...pState,
                    raceDate: revivedRaceDate,
                    currentSchedule: finalRevivedSchedule as unknown as RenderedPlan,
                    raceInput: mergedRaceInput || currentState.raceInput,
                    workoutLogs: pState.workoutLogs || {},
                }
            }
        }
    )
);
