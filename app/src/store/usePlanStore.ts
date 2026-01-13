import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { RenderedPlan } from '../types';

interface PlanState {
    selectedPlanId: string;
    raceDate: Date | null;
    units: 'mi' | 'km';
    goalTime: string;
    currentSchedule: RenderedPlan | null;
    setPlanId: (id: string) => void;
    setRaceDate: (date: Date | null) => void;
    setUnits: (units: 'mi' | 'km') => void;
    setGoalTime: (time: string) => void;
    setSchedule: (schedule: RenderedPlan | null) => void;
    moveWorkout: (fromWeekIndex: number, fromDayIndex: number, toWeekIndex: number, toDayIndex: number) => void;
}

export const usePlanStore = create<PlanState>()(
    persist(
        (set) => ({
            selectedPlanId: 'pfitz_18_55_4th',
            raceDate: null,
            units: 'km',
            goalTime: '4:00:00',
            currentSchedule: null,
            setPlanId: (id) => set({ selectedPlanId: id }),
            setRaceDate: (date) => set({ raceDate: date }),
            setUnits: (units) => set({ units }),
            setGoalTime: (time) => set({ goalTime: time }),
            setSchedule: (schedule) => set({ currentSchedule: schedule }),
            moveWorkout: (fromWeekIndex, fromDayIndex, toWeekIndex, toDayIndex) => set((state) => {
                const schedule = state.currentSchedule;
                if (!schedule) return {};

                // Deep copy to avoid mutation issues
                const newSchedule = JSON.parse(JSON.stringify(schedule)) as RenderedPlan;

                const fromWeek = newSchedule.weeks[fromWeekIndex];
                const toWeek = newSchedule.weeks[toWeekIndex];

                const fromDay = fromWeek.workouts[fromDayIndex];
                const toDay = toWeek.workouts[toDayIndex];

                // Check if days are valid
                if (!fromDay || !toDay) return {};

                // Core Logic: 
                // We want to KEEP the date of the destination day, but SWAP the workout content.
                // Because RenderedWorkout EXTENDS Workout, we swap the specific workout fields.

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

                // Note: We are keeping the dates fixed to the calendar day!

                return { currentSchedule: newSchedule };
            }),
        }),
        {
            name: 'plan-storage',
            // Custom serialization for Date
            partialize: (state) => ({
                selectedPlanId: state.selectedPlanId,
                raceDate: state.raceDate ? state.raceDate.toISOString() : null,
                units: state.units,
                goalTime: state.goalTime,
                currentSchedule: state.currentSchedule,
            }),
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

                return {
                    ...currentState,
                    ...persistedState,
                    raceDate: persistedState.raceDate ? new Date(persistedState.raceDate) : null,
                    currentSchedule: revivedSchedule,
                }
            }
        }
    )
);
