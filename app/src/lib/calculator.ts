import { addDays, startOfDay } from 'date-fns';
import type { Plan, RenderedPlan, RenderedWeek, RenderedWorkout } from '../types';

export const calculateSchedule = (plan: Plan, raceDate: Date): RenderedPlan => {
    // Normalize race date to start of day to avoid time zone weirdness
    const normalizedRaceDate = startOfDay(raceDate);

    const totalWeeks = plan.schedule.length;
    // Assumption: The plan ends on Race Day, and Race Day is the last day (Sunday) of the plan.
    // Last Week End = Race Date.
    // Last Week Start = Race Date - 6 days.
    // First Week Start = Race Date - 6 days - (N-1) weeks.
    // Or simply: First Week Start = Race Date - (TotalWeeks * 7) + 1?
    // Let's do it by week index.
    // Week N-1 (last week) ends on RaceDate.
    // Week 0 starts at: RaceDate - (TotalWeeks * 7 - 1) days?
    // Example: 1 week plan. Ends on Sunday (Race).
    // Starts on Monday. Days = 7.
    // Start = Race - 6 days.
    // 1 week * 7 = 7. Race - 7 + 1 = Race - 6. Correct.

    // So StartDate (Monday of week 1) = RaceDate - (totalWeeks * 7) + 1 day
    const programStartDate = addDays(normalizedRaceDate, -(totalWeeks * 7) + 1);

    const weeks: RenderedWeek[] = plan.schedule.map((week, weekIndex) => {
        const weekStart = addDays(programStartDate, weekIndex * 7);
        const weekEnd = addDays(weekStart, 6);
        const weeksToGoal = totalWeeks - weekIndex; // 1-based "weeks to go"? Or 0 based? Usually "18 weeks to go" at start.
        // Actually "Weeks to Goal" usually means "X weeks remaining".
        // If I am in week 1 of 18, I have 17 weeks "to go" after this?
        // Let's use `totalWeeks - weekIndex` -> Week 1 = 18. Last week = 1.

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
