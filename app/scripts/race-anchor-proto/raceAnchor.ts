import { addDays, startOfDay, startOfWeek, differenceInCalendarDays } from 'date-fns';
import type { Plan, RenderedPlan, RenderedWeek, RenderedWorkout } from '../../src/types';

/**
 * PROTOTYPE — throwaway logic answering:
 *
 *   "When the user's race falls on a non-Sunday weekday, how should the
 *    weekly training grid re-anchor around it?"
 *
 * Two candidate strategies live here as pure functions:
 *
 *   swap  — (current behaviour) keep every week Mon–Sun; in the goal week only,
 *           swap the goal-race workout into the actual race weekday.
 *   shift — date every workout RELATIVE to the race so each plan-week keeps its
 *           internal rhythm (long runs land on the race weekday every week);
 *           week boundaries ride onto the race weekday (e.g. Sun–Sat).
 *
 * The TUI beside this file is throwaway. This module should be liftable into
 * lib/ once a winner is chosen — no I/O, no console code below this line.
 */

export interface GoalPlacement {
    weekIndex: number;
    dayIndex: number;
}

/** Locate the plan's goal-race workout ("goal race"/"goal marathon"), else last day of last week. */
export const findGoalPlacement = (plan: Plan): GoalPlacement => {
    const totalWeeks = plan.schedule.length;
    let goalWeekIndex = totalWeeks - 1;
    let goalDayIndex = 6;

    outer: for (let w = 0; w < totalWeeks; w++) {
        const workouts = plan.schedule[w].workouts;
        for (let d = 0; d < workouts.length; d++) {
            const t = workouts[d].title.toLowerCase();
            if (t.includes('goal race') || t.includes('goal marathon')) {
                goalWeekIndex = w;
                goalDayIndex = d;
                break outer;
            }
        }
    }
    return { weekIndex: goalWeekIndex, dayIndex: goalDayIndex };
};

const renderWeek = (
    planWeek: RenderedWeek['originalWeek'],
    weekIndex: number,
    weekStart: Date,
    goalWeekIndex: number
): RenderedWeek => {
    const workouts = [...(planWeek?.workouts ?? [])];
    const renderedWorkouts: RenderedWorkout[] = workouts.map((workout, dayIndex) => ({
        ...workout,
        date: addDays(weekStart, dayIndex),
        dayOfWeek: dayIndex
    }));
    return {
        weekStart,
        weekEnd: addDays(weekStart, 6),
        weeksToGoal: goalWeekIndex - weekIndex + 1,
        weekNumber: weekIndex + 1,
        originalWeek: planWeek,
        workouts: renderedWorkouts
    };
};

/** Strategy A — today's behaviour, extracted: Mon–Sun weeks, race swapped within goal week only. */
export const renderSwapAnchored = (plan: Plan, raceDate: Date): RenderedPlan => {
    const race = startOfDay(raceDate);
    const goal = findGoalPlacement(plan);
    const raceWeekMonday = startOfWeek(race, { weekStartsOn: 1 });
    const programStartDate = addDays(raceWeekMonday, -goal.weekIndex * 7);
    const targetDayIndex = (race.getDay() + 6) % 7;

    const weeks = plan.schedule.map((planWeek, weekIndex) => {
        const week = renderWeek(planWeek, weekIndex, addDays(programStartDate, weekIndex * 7), goal.weekIndex);
        if (weekIndex === goal.weekIndex && goal.dayIndex !== targetDayIndex) {
            const w = [...week.workouts];
            const tmp = w[goal.dayIndex];
            w[goal.dayIndex] = w[targetDayIndex];
            w[targetDayIndex] = tmp;
            week.workouts = w;
        }
        return week;
    });

    return {
        originalPlan: plan,
        raceDate: race,
        startDate: programStartDate,
        weeks,
        fp: { planId: plan.id, raceDateKey: race.toISOString().slice(0, 10) }
    };
};

/** Strategy B — shift the whole grid so every week keeps its rhythm relative to race weekday. */
export const renderShiftAnchored = (plan: Plan, raceDate: Date): RenderedPlan => {
    const race = startOfDay(raceDate);
    const goal = findGoalPlacement(plan);

    const weeks = plan.schedule.map((planWeek, weekIndex) => {
        const weekOffset = (weekIndex - goal.weekIndex) * 7;
        const weekStart = addDays(race, weekOffset - goal.dayIndex);
        return renderWeek(planWeek, weekIndex, weekStart, goal.weekIndex);
    });

    return {
        originalPlan: plan,
        raceDate: race,
        startDate: weeks[0]?.weekStart ?? race,
        weeks,
        fp: { planId: plan.id, raceDateKey: race.toISOString().slice(0, 10) }
    };
};

export interface AnchorStrategy {
    id: 'swap' | 'shift';
    label: string;
    render: (plan: Plan, raceDate: Date) => RenderedPlan;
}

export const ANCHOR_STRATEGIES: AnchorStrategy[] = [
    { id: 'swap', label: 'swap — Mon–Sun weeks, race swapped in goal week only', render: renderSwapAnchored },
    { id: 'shift', label: 'shift — whole grid rides on the race weekday', render: renderShiftAnchored }
];

const isLongRun = (w: RenderedWorkout) => {
    if (w.tags?.includes('Long Run')) return true;
    const t = w.title.toLowerCase();
    // YAML titles say "Long run …"; exclude "Med-long run" (Pfitz's second-longest day).
    return t.includes('long') && !t.includes('med-long') && !t.includes('medium');
};

export interface WeekAlignment {
    weekNumber: number;
    /** First three letters of the weekday the week starts on. */
    startDow: string;
    spanLabel: string;
    longRunLabel: string | null;
    /** Calendar days between this week's long run and race day (null = no long run). */
    longRunDaysBeforeRace: number | null;
    /** True when this week's long-run-to-race gap breaks the 7-day rhythm. */
    longRunMisaligned: boolean;
    hasGoalRace: boolean;
    /** Days of scheduled content sitting after race day inside the goal week. */
    postRaceDays: number;
}

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const describeAlignment = (rendered: RenderedPlan): WeekAlignment[] => {
    const race = startOfDay(rendered.raceDate);

    return rendered.weeks.map((week) => {
        const longRun = week.workouts.find(isLongRun);
        const longRunDaysBeforeRace =
            longRun != null ? differenceInCalendarDays(race, startOfDay(longRun.date)) : null;

        return {
            weekNumber: week.weekNumber,
            startDow: DOW[new Date(week.weekStart).getDay()],
            spanLabel: `${fmtShort(week.weekStart)} – ${fmtShort(week.weekEnd)}`,
            longRunLabel: longRun ? `${DOW[new Date(longRun.date).getDay()]} ${fmtShort(longRun.date)}` : null,
            longRunDaysBeforeRace,
            longRunMisaligned:
                longRunDaysBeforeRace != null &&
                longRunDaysBeforeRace > 0 &&
                longRunDaysBeforeRace % 7 !== 0,
            hasGoalRace: week.workouts.some(
                (w) => w.title.toLowerCase().includes('goal race') || w.title.toLowerCase().includes('goal marathon')
            ),
            postRaceDays: week.workouts.filter((w) => startOfDay(w.date) > race).length
        };
    });
};

const fmtShort = (d: Date | string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
