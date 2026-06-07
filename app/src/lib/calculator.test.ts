import { describe, it, expect } from 'vitest';
import { calculateSchedule } from './calculator';
import type { Plan } from '../types';
import { startOfDay } from 'date-fns';

describe('calculateSchedule', () => {
    it('aligns start date to last day of plan if no goal race workout is found', () => {
        const mockPlan: Plan = {
            id: 'test_no_goal',
            name: 'No Goal Plan',
            type: 'Marathon',
            units: 'mi',
            schedule: [
                { workouts: [{ title: 'Easy Run', distance: 5 }] },
                { workouts: [{ title: 'Long Run', distance: 10 }] }
            ]
        };
        const raceDate = new Date('2026-06-15'); // local date
        const normalizedRaceDate = startOfDay(raceDate);
        const schedule = calculateSchedule(mockPlan, raceDate);

        // Since total weeks = 2, and no goal race is found, it defaults to aligning the last day (Sunday of last week) to the raceDate.
        // goalWeekIndex = 1, goalDayIndex = 6.
        // daysToGoal = (1 * 7) + 6 = 13.
        // programStartDate = raceDate - 13 days = June 2.
        const expectedStartDate = new Date('2026-06-02');
        expect(schedule.startDate.toISOString()).toBe(startOfDay(expectedStartDate).toISOString());
        expect(schedule.weeks[0].weekStart.toISOString()).toBe(startOfDay(expectedStartDate).toISOString());
        expect(schedule.weeks[1].workouts[0].date.toISOString()).toBe(startOfDay(new Date('2026-06-09')).toISOString());
    });

    it('aligns start date to the specific workout that is the goal race', () => {
        const mockPlan: Plan = {
            id: 'test_with_goal',
            name: 'With Goal Plan',
            type: '10K',
            units: 'mi',
            schedule: [
                { workouts: [{ title: 'Easy Run', distance: 5 }] },
                { workouts: [
                    { title: '8K or 10K goal race {11:18}', distance: 11 },
                    { title: 'Recovery Run', distance: 3 }
                ] },
                { workouts: [{ title: 'Post-race Recovery', distance: 4 }] }
            ]
        };
        const raceDate = new Date('2026-06-15'); // local date
        const normalizedRaceDate = startOfDay(raceDate);
        const schedule = calculateSchedule(mockPlan, raceDate);

        // Goal race is at weekIndex = 1, dayIndex = 0 ('8K or 10K goal race {11:18}').
        // daysToGoal = (1 * 7) + 0 = 7.
        // programStartDate = raceDate - 7 days = June 8.
        // So the goal race workout should fall exactly on raceDate (June 15).
        const expectedStartDate = new Date('2026-06-08');
        expect(schedule.weeks[1].workouts[0].title).toBe('8K or 10K goal race {11:18}');
        expect(schedule.weeks[1].workouts[0].date.toISOString()).toBe(normalizedRaceDate.toISOString());
        expect(schedule.weeks[2].workouts[0].date.toISOString()).toBe(startOfDay(new Date('2026-06-22')).toISOString());

        // Check weeksToGoal values
        expect(schedule.weeks[0].weeksToGoal).toBe(2); // 1 week before goal week
        expect(schedule.weeks[1].weeksToGoal).toBe(1); // Goal week (Race Week)
        expect(schedule.weeks[2].weeksToGoal).toBe(0); // Post-race week
    });
});
