import { addDays, startOfDay, format } from 'date-fns';
import type { Plan, RenderedPlan, RenderedWeek, RenderedWorkout, Week, WeeklyVolume } from '../types';
import { KM_PER_MILE } from './constants';

export const calculateSchedule = (plan: Plan, raceDate: Date): RenderedPlan => {
    // Normalize race date to start of day to avoid time zone weirdness
    const normalizedRaceDate = startOfDay(raceDate);

    const totalWeeks = plan.schedule.length;

    // Find the goal race workout to align the raceDate.
    // Search the weeks and workouts for a title containing "goal race" or "goal marathon" (case-insensitive).
    let goalWeekIndex = totalWeeks - 1; // default to last week
    let goalDayIndex = 6; // default to Sunday (day 6 of week)
    let foundGoal = false;

    for (let w = 0; w < totalWeeks; w++) {
        const week = plan.schedule[w];
        for (let d = 0; d < week.workouts.length; d++) {
            const workout = week.workouts[d];
            const title = workout.title.toLowerCase();
            if (title.includes('goal race') || title.includes('goal marathon')) {
                goalWeekIndex = w;
                goalDayIndex = d;
                foundGoal = true;
                break;
            }
        }
        if (foundGoal) {
            break;
        }
    }

    // Anchor every workout RELATIVE to race day: the goal-race workout lands
    // exactly on raceDate and each plan week keeps its internal rhythm (long
    // runs stay a fixed number of days before the race), whatever weekday the
    // race falls on. Week boundaries therefore ride onto the race weekday
    // (e.g. Sun–Sat weeks for a Saturday marathon).
    //
    // This replaces the earlier Monday-grid + goal-week-swap anchoring, which
    // left mid-plan long runs 6/13/20… days out when racing on a Saturday.
    // Validated against real plan data via scripts/race-anchor-proto (primary
    // source archived on branch prototype/race-anchor-tui); for Sunday races
    // with the goal race in the last slot it produces identical output.
    const weeks: RenderedWeek[] = plan.schedule.map((planWeek, weekIndex) => {
        const weekStart = addDays(normalizedRaceDate, (weekIndex - goalWeekIndex) * 7 - goalDayIndex);
        const weekEnd = addDays(weekStart, 6);

        // weeksToGoal is relative to the actual goal week (1 for goal week, 2 for the week before, etc.)
        // post-race weeks will have values <= 0.
        const weeksToGoal = goalWeekIndex - weekIndex + 1;

        const renderedWorkouts: RenderedWorkout[] = planWeek.workouts.map((workout, dayIndex) => {
            const date = addDays(weekStart, dayIndex);
            return {
                ...workout,
                date,
                dayOfWeek: dayIndex
            };
        });

        return {
            weekStart,
            weekEnd,
            weeksToGoal,
            weekNumber: weekIndex + 1,
            originalWeek: planWeek,
            workouts: renderedWorkouts
        };
    });

    return {
        originalPlan: plan,
        raceDate: normalizedRaceDate,
        startDate: weeks[0]?.weekStart ?? normalizedRaceDate,
        weeks,
        // Fingerprint of the configuration this schedule was generated for — guards durable local reuse.
        fp: {
            planId: plan.id,
            raceDateKey: format(normalizedRaceDate, 'yyyy-MM-dd')
        }
    };
};



export const calculateWeeklyVolume = (week: Week | RenderedWeek, units: 'mi' | 'km'): WeeklyVolume => {
    let minDistSource = 0;
    let maxDistSource = 0;

    for (const day of week.workouts) {
        if (!day.distance) continue;
        if (typeof day.distance === 'number') {
            minDistSource += day.distance;
            maxDistSource += day.distance;
        } else {
            minDistSource += day.distance[0];
            maxDistSource += day.distance[1];
        }
    }

    const formatValue = (val: number): number => {
        return units === 'km'
            ? Math.round(val * KM_PER_MILE * 10) / 10
            : Math.round(val);
    };

    const min = formatValue(minDistSource);
    const max = formatValue(maxDistSource);
    const average = Math.round(((min + max) / 2) * 10) / 10;
    const formatted = min === max ? `${min}` : `${min} - ${max}`;

    return {
        min,
        max,
        average,
        formatted
    };
};

