import { differenceInCalendarDays } from 'date-fns';
import type { RenderedPlan, RenderedWorkout } from '../types';

/** Where "now" sits within a rendered schedule — drives the today strip. */
export interface TodayContext {
    /** Calendar days until race day (0 = race day, negative = past it). */
    daysToRace: number;
    /** Total calendar days from plan start to race day. */
    totalDays: number;
    /** How much of the plan has elapsed, 0–100. */
    elapsedPct: number;
    /** Week number containing today, or null when today is outside the plan. */
    currentWeekNumber: number | null;
    /** Index into schedule.weeks for today's week, or -1. */
    weekIndex: number;
    /** Index of today's workout within its week, or -1 when none is scheduled. */
    dayIndex: number;
    /** Today's scheduled workout, or null. */
    workout: RenderedWorkout | null;
}

const startOfDay = (d: Date) => {
    const c = new Date(d);
    c.setHours(0, 0, 0, 0);
    return c;
};

const endOfDay = (d: Date) => {
    const c = new Date(d);
    c.setHours(23, 59, 59, 999);
    return c;
};

export const getTodayContext = (
    schedule: RenderedPlan,
    now: Date = new Date()
): TodayContext => {
    const today = startOfDay(now);
    const start = startOfDay(schedule.startDate);
    const raceEnd = endOfDay(schedule.raceDate);

    const daysToRace = differenceInCalendarDays(startOfDay(schedule.raceDate), today);
    const totalDays = Math.max(1, differenceInCalendarDays(raceEnd, start));
    const rawPct = (differenceInCalendarDays(today, start) / totalDays) * 100;
    const elapsedPct = Math.min(100, Math.max(0, Math.round(rawPct)));

    let weekIndex = -1;
    let dayIndex = -1;
    schedule.weeks.forEach((week, wIdx) => {
        const ws = startOfDay(week.weekStart);
        const we = endOfDay(week.weekEnd);
        if (today >= ws && today <= we && weekIndex === -1) {
            weekIndex = wIdx;
            week.workouts.forEach((workout, dIdx) => {
                if (startOfDay(workout.date).getTime() === today.getTime()) {
                    dayIndex = dIdx;
                }
            });
        }
    });

    return {
        daysToRace,
        totalDays,
        elapsedPct,
        currentWeekNumber: weekIndex >= 0 ? schedule.weeks[weekIndex].weekNumber : null,
        weekIndex,
        dayIndex,
        workout: weekIndex >= 0 && dayIndex >= 0 ? schedule.weeks[weekIndex].workouts[dayIndex] : null
    };
};
