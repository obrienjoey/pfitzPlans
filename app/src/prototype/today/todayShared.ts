import { differenceInCalendarDays } from 'date-fns';
import type { RenderedPlan } from '../../types';
import { KM_PER_MILE } from '../../lib/constants';

/**
 * PROTOTYPE — throwaway code answering "how should today + race countdown surface?".
 * Shared derived state for the three ?today= variants. Not for production.
 */
export interface TodayState {
    /** Calendar days from today until race day (0 = race day, negative = past). */
    daysToRace: number;
    /** Total calendar days in the plan (start → race). */
    totalDays: number;
    /** 0–100 percent of the plan elapsed as of today. */
    elapsedPct: number;
    /** 1-based week number containing today, or null if outside the plan. */
    currentWeekNumber: number | null;
    /** Index of the week containing today (into schedule.weeks), or -1. */
    weekIndex: number;
    /** Index of today's workout within its week, or -1. */
    dayIndex: number;
    title: string | null;
    distanceLabel: string | null;
}

export const formatDistance = (dist: number | [number, number], units: 'mi' | 'km') => {
    const convert = (v: number) => (units === 'km' ? Math.round(v * KM_PER_MILE * 10) / 10 : v);
    return typeof dist === 'number'
        ? `${convert(dist)} ${units}`
        : `${convert(dist[0])}–${convert(dist[1])} ${units}`;
};

export const computeTodayState = (
    schedule: RenderedPlan,
    units: 'mi' | 'km'
): TodayState => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const start = new Date(schedule.startDate);
    start.setHours(0, 0, 0, 0);
    const race = new Date(schedule.raceDate);
    race.setHours(23, 59, 59, 999);

    const daysToRace = differenceInCalendarDays(new Date(schedule.raceDate), now);
    const totalDays = Math.max(1, differenceInCalendarDays(race, start));
    const elapsed = differenceInCalendarDays(now, start);
    const elapsedPct = Math.min(100, Math.max(0, Math.round((elapsed / totalDays) * 100)));

    let weekIndex = -1;
    let dayIndex = -1;
    schedule.weeks.forEach((week, wIdx) => {
        const ws = new Date(week.weekStart);
        ws.setHours(0, 0, 0, 0);
        const we = new Date(week.weekEnd);
        we.setHours(23, 59, 59, 999);
        if (now >= ws && now <= we && weekIndex === -1) {
            weekIndex = wIdx;
            week.workouts.forEach((workout, dIdx) => {
                const d = new Date(workout.date);
                if (d.toDateString() === now.toDateString()) dayIndex = dIdx;
            });
        }
    });

    const workout =
        weekIndex >= 0 && dayIndex >= 0 ? schedule.weeks[weekIndex].workouts[dayIndex] : null;

    return {
        daysToRace,
        totalDays,
        elapsedPct,
        currentWeekNumber: weekIndex >= 0 ? schedule.weeks[weekIndex].weekNumber : null,
        weekIndex,
        dayIndex,
        title: workout?.title ?? null,
        distanceLabel: workout?.distance != null ? formatDistance(workout.distance, units) : null,
    };
};

export const scrollToToday = (state: TodayState) => {
    if (state.weekIndex < 0 || state.dayIndex < 0) return;
    document
        .getElementById(`week-${state.weekIndex}-day-${state.dayIndex}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

/** "T−23" style label; special cases race day and post-race. */
export const tMinus = (daysToRace: number) =>
    daysToRace > 0 ? `T−${daysToRace}` : daysToRace === 0 ? 'RACE DAY' : 'POST-RACE';
