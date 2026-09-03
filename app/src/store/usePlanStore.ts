import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format, parseISO, isValid, startOfDay } from 'date-fns';
import { AVAILABLE_PLANS, type PlanInfo } from '../config';
import { MAX_RACE_YEAR, MIN_RACE_YEAR } from '../lib/constants';

import type { RenderedPlan, ScheduleFingerprint } from '../types';

export type WorkoutStatus = 'completed' | 'skipped' | 'modified' | 'none';

export interface RaceInputState {
  distance: '5K' | '10K' | '15K' | 'Half Marathon' | 'Marathon';
  time: string; // "H:MM:SS" or "MM:SS"
}

interface PlanState {
    availablePlans: PlanInfo[];
    manifestLoaded: boolean;
    selectedPlanId: string;
    raceDate: Date | null;
    units: 'mi' | 'km';
    raceInput: RaceInputState | null;
    currentSchedule: RenderedPlan | null;
    workoutLogs: Record<string, WorkoutStatus>;
    setAvailablePlans: (plans: PlanInfo[]) => void;
    setManifestLoaded: (loaded: boolean) => void;
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
    fp?: ScheduleFingerprint;
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

const dateToStorageKey = (d: Date | string | null | undefined): string | null => {
    if (!d) return null;
    const dateObj = d instanceof Date ? d : parseISO(d);
    if (!isValid(dateObj)) return null;
    return format(startOfDay(dateObj), 'yyyy-MM-dd');
};

const parseStoredDate = (val: string | Date | unknown): Date | null => {
    if (!val) return null;
    if (val instanceof Date) return isValid(val) ? startOfDay(val) : null;
    if (typeof val === 'string') {
        const parsed = parseISO(val);
        if (isValid(parsed)) return startOfDay(parsed);
        const fallback = new Date(val);
        return isValid(fallback) ? startOfDay(fallback) : null;
    }
    return null;
};

/**
 * Rehydrate persisted zustand state: revive date strings into Dates, migrate
 * the legacy `goalTime` shape into `raceInput`, and discard schedules that
 * fail validation (corrupt dates, missing fingerprint). Pure and exported
 * for unit testing. Never throws for malformed input — callers still wrap
 * in try/catch as a final backstop.
 */
export const migratePersistedState = (
    persistedState: unknown,
    currentState: PlanState
): PlanState => {
    const pState = persistedState as PersistedState;
    if (!pState || typeof pState !== 'object') return currentState;

    // Malformed schedule shapes (wrong types, missing arrays) are treated
    // as absent — never let them throw or inject garbage into the store.
    const rawSched = pState.currentSchedule;
    const validWeeks = Array.isArray(rawSched?.weeks)
        && (rawSched.weeks as unknown[]).every((w) => !!w && Array.isArray((w as PersistedWeek).workouts));
    const revivedSchedule = rawSched && validWeeks ? {
        ...rawSched,
        raceDate: parseStoredDate(rawSched.raceDate),
        startDate: parseStoredDate(rawSched.startDate),
        weeks: (rawSched.weeks as PersistedWeek[]).map((week) => ({
            ...week,
            weekStart: parseStoredDate(week.weekStart),
            weekEnd: parseStoredDate(week.weekEnd),
            workouts: week.workouts.map((workout) => ({
                ...workout,
                date: parseStoredDate(workout.date)
            }))
        }))
    } : null;

    // Backwards compat: if old "goalTime" exists but no "raceInput" yet
    let mergedRaceInput = pState.raceInput;
    if (!mergedRaceInput && pState.goalTime) {
        const planId = pState.selectedPlanId || currentState.selectedPlanId;
        const planType = (currentState.availablePlans || AVAILABLE_PLANS).find(p => p.id === planId)?.type;
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

    let revivedRaceDate = parseStoredDate(pState.raceDate);
    if (revivedRaceDate && (revivedRaceDate.getFullYear() < MIN_RACE_YEAR || revivedRaceDate.getFullYear() > MAX_RACE_YEAR)) {
        revivedRaceDate = null;
    }

    // If the schedule date is corrupted, discard the schedule too
    let finalRevivedSchedule = revivedSchedule;
    if (revivedSchedule && (!revivedSchedule.raceDate || revivedSchedule.raceDate.getFullYear() < MIN_RACE_YEAR || revivedSchedule.raceDate.getFullYear() > MAX_RACE_YEAR)) {
        finalRevivedSchedule = null;
    }

    // A persisted schedule without a complete fingerprint is legacy pre-fix data:
    // never reuse it — the current configuration cannot be verified against it.
    if (finalRevivedSchedule && (!finalRevivedSchedule.fp || !finalRevivedSchedule.fp.planId || !finalRevivedSchedule.fp.raceDateKey)) {
        finalRevivedSchedule = null;
    }

    return {
        ...currentState,
        ...pState,
        raceDate: revivedRaceDate,
        currentSchedule: finalRevivedSchedule as unknown as RenderedPlan,
        raceInput: mergedRaceInput || currentState.raceInput,
        workoutLogs: finalRevivedSchedule ? (pState.workoutLogs || {}) : {},
    };
};

export const usePlanStore = create<PlanState>()(
    persist(
        (set, get) => ({
            availablePlans: AVAILABLE_PLANS,
            manifestLoaded: false,
            setAvailablePlans: (plans) => set({ availablePlans: plans }),
            setManifestLoaded: (loaded) => set({ manifestLoaded: loaded }),
            selectedPlanId: 'pfitz_18_55_4th',
            raceDate: null,
            units: 'km',
            raceInput: { distance: '10K', time: '0:45:00' },
            currentSchedule: null,
            workoutLogs: {},
            setPlanId: (id) => {
                const planInfo = get().availablePlans.find(p => p.id === id);
                const newType = planInfo?.type;
                const currentPlanInfo = get().availablePlans.find(p => p.id === get().selectedPlanId);
                const currentType = currentPlanInfo?.type;

                const updates: Partial<PlanState> = { selectedPlanId: id };

                if (id !== get().selectedPlanId) {
                    updates.workoutLogs = {};
                }

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
            setRaceDate: (date) => set((state) => {
                const currentDateKey = dateToStorageKey(state.raceDate);
                const newDateKey = dateToStorageKey(date);
                const changed = currentDateKey !== newDateKey;
                return {
                    raceDate: date ? startOfDay(date) : null,
                    workoutLogs: changed ? {} : state.workoutLogs,
                };
            }),
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

                const fromDay = fromWeek?.workouts[fromDayIndex];
                const toDay = toWeek?.workouts[toDayIndex];

                // Check if days are valid
                if (!fromDay || !toDay) return {};

                // Swap everything except the calendar slot (date/dayOfWeek stay
                // with the day so the schedule keeps its dates; the workout —
                // including its explicit `zone` — moves).
                const { date: fromDate, dayOfWeek: fromDOW, ...fromRest } = fromDay;
                const { date: toDate, dayOfWeek: toDOW, ...toRest } = toDay;

                Object.assign(fromDay, toRest, { date: fromDate, dayOfWeek: fromDOW });
                Object.assign(toDay, fromRest, { date: toDate, dayOfWeek: toDOW });

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
            // Custom serialization for Date as YYYY-MM-DD to be timezone agnostic
            partialize: (state) => {
                let slimSchedule = null;
                if (state.currentSchedule) {
                    slimSchedule = {
                        raceDate: dateToStorageKey(state.currentSchedule.raceDate),
                        startDate: dateToStorageKey(state.currentSchedule.startDate),
                        weeks: state.currentSchedule.weeks.map(week => {
                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                            const { originalWeek, ...slimWeek } = week;
                            return {
                                ...slimWeek,
                                weekStart: dateToStorageKey(week.weekStart),
                                weekEnd: dateToStorageKey(week.weekEnd),
                                workouts: week.workouts.map(workout => ({
                                    ...workout,
                                    date: dateToStorageKey(workout.date)
                                }))
                            };
                        }),
                        fp: state.currentSchedule.fp,
                    };
                }

                return {
                    selectedPlanId: state.selectedPlanId,
                    raceDate: dateToStorageKey(state.raceDate),
                    units: state.units,
                    raceInput: state.raceInput,
                    currentSchedule: slimSchedule,
                    workoutLogs: state.workoutLogs,
                };
            },
            merge: (persistedState: unknown, currentState) => {
                // Any unexpected shape in localStorage must reset to defaults,
                // never crash the app into the ErrorBoundary on every load.
                try {
                    return migratePersistedState(persistedState, currentState);
                } catch (err) {
                    console.warn('Discarding corrupt persisted plan state:', err);
                    return currentState;
                }
            }
        }
    )
);
