import { addDays, startOfDay } from 'date-fns';
import type { Plan, RenderedPlan, RenderedWeek, RenderedWorkout } from '../types';

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

    // Days from program start to the goal race workout
    const daysToGoal = (goalWeekIndex * 7) + goalDayIndex;
    const programStartDate = addDays(normalizedRaceDate, -daysToGoal);

    const weeks: RenderedWeek[] = plan.schedule.map((week, weekIndex) => {
        const weekStart = addDays(programStartDate, weekIndex * 7);
        const weekEnd = addDays(weekStart, 6);
        
        // weeksToGoal is relative to the actual goal week (1 for goal week, 2 for the week before, etc.)
        // post-race weeks will have values <= 0.
        const weeksToGoal = goalWeekIndex - weekIndex + 1;

        const renderedWorkouts: RenderedWorkout[] = week.workouts.map((workout, dayIndex) => {
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
            originalWeek: week,
            workouts: renderedWorkouts
        };
    });

    return {
        originalPlan: plan,
        raceDate: normalizedRaceDate,
        startDate: programStartDate,
        weeks
    };
};
