import { describe, it, expect } from 'vitest';
import { calculateSchedule, calculateWeeklyVolume } from './calculator';
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
        const raceDate = new Date('2026-06-15'); // local date, a Monday
        const schedule = calculateSchedule(mockPlan, raceDate);

        // No goal race found → goal defaults to last week's final slot (index 6).
        // The plan anchors relative to race day: week k starts at
        // raceDate + (k - goalWeek) * 7 - goalDayIndex.
        // startDate = Jun 15 - 7 - 6 = Tue Jun 2.
        const expectedStartDate = new Date('2026-06-02');
        expect(schedule.startDate.toISOString()).toBe(startOfDay(expectedStartDate).toISOString());
        expect(schedule.weeks[0].weekStart.toISOString()).toBe(startOfDay(expectedStartDate).toISOString());
        expect(schedule.weeks[1].weekStart.toISOString()).toBe(startOfDay(new Date('2026-06-09')).toISOString());
    });

    it('lands long runs on the race weekday for a Saturday marathon (7-day rhythm)', () => {
        // Pfitz-style plan: rest Monday … long run Sunday slot, goal marathon in the final slot.
        const trainingWeek = {
            workouts: [
                { title: 'Rest' },
                { title: 'LT run', distance: 8 },
                { title: 'Rest' },
                { title: 'Gen-aerobic', distance: 9 },
                { title: 'Rest' },
                { title: 'Recovery', distance: 5 },
                { title: 'Long run', distance: 16 }
            ]
        };
        const mockPlan: Plan = {
            id: 'test_sat_marathon',
            name: 'Sat Marathon Plan',
            type: 'Marathon',
            units: 'mi',
            schedule: [
                trainingWeek,
                trainingWeek,
                { workouts: [...trainingWeek.workouts.slice(0, 6), { title: 'Goal Marathon', tags: ['Race'] }] }
            ]
        };
        const raceDate = new Date('2026-12-19'); // a Saturday
        const schedule = calculateSchedule(mockPlan, raceDate);

        // The goal race must land exactly on race day.
        const goalWorkout = schedule.weeks[2].workouts.find(w => w.title === 'Goal Marathon');
        expect(goalWorkout?.date.toDateString()).toBe(raceDate.toDateString());

        // Every mid-plan long run sits exactly 7/14 days before the race —
        // i.e. also on a Saturday. This is the invariant the old Monday-grid
        // anchoring broke for non-Sunday races.
        const race = startOfDay(raceDate);
        const gaps = schedule.weeks.slice(0, 2).map(week => {
            const lr = week.workouts.find(w => w.title === 'Long run');
            return Math.round((race.getTime() - startOfDay(lr!.date).getTime()) / (24 * 60 * 60 * 1000));
        });
        expect(gaps).toEqual([14, 7]);

        // Week boundaries ride onto the race weekday: Sun–Sat weeks.
        expect(schedule.weeks[2].weekStart.getDay()).toBe(0); // Sunday
        expect(schedule.weeks[0].weekStart.getDay()).toBe(0);
    });

    it('keeps Monday-start weeks for a Sunday race (previous default behaviour)', () => {
        const mockPlan: Plan = {
            id: 'test_sun_regression',
            name: 'Sunday Regression Plan',
            type: 'Marathon',
            units: 'mi',
            schedule: [
                { workouts: [{ title: 'Easy Run', distance: 5 }] },
                { workouts: [
                    { title: 'Rest' }, { title: 'Easy' }, { title: 'Easy' }, { title: 'Easy' },
                    { title: 'Easy' }, { title: 'Easy' }, { title: 'Goal Marathon' }
                ] }
            ]
        };
        const raceDate = new Date('2026-06-21'); // a Sunday
        const schedule = calculateSchedule(mockPlan, raceDate);

        expect(schedule.weeks[1].weekStart.getDay()).toBe(1); // Monday
        expect(schedule.weeks[1].weekStart.toISOString()).toBe(startOfDay(new Date('2026-06-15')).toISOString());
        const goal = schedule.weeks[1].workouts[6];
        expect(goal.title).toBe('Goal Marathon');
        expect(goal.date.toISOString()).toBe(startOfDay(raceDate).toISOString());
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
        expect(schedule.weeks[1].workouts[0].title).toBe('8K or 10K goal race {11:18}');
        expect(schedule.weeks[1].workouts[0].date.toISOString()).toBe(normalizedRaceDate.toISOString());
        expect(schedule.weeks[2].workouts[0].date.toISOString()).toBe(startOfDay(new Date('2026-06-22')).toISOString());

        // Check weeksToGoal values
        expect(schedule.weeks[0].weeksToGoal).toBe(2); // 1 week before goal week
        expect(schedule.weeks[1].weeksToGoal).toBe(1); // Goal week (Race Week)
        expect(schedule.weeks[2].weeksToGoal).toBe(0); // Post-race week
    });

    it('stamps the schedule with the configuration it was generated for', () => {
        const mockPlan: Plan = {
            id: 'test_stamped',
            name: 'Stamped Plan',
            type: 'Marathon',
            units: 'mi',
            schedule: [{ workouts: [{ title: 'Easy Run' }] }]
        };
        const schedule = calculateSchedule(mockPlan, new Date('2026-11-01'));

        expect(schedule.fp).toEqual({ planId: 'test_stamped', raceDateKey: '2026-11-01' });
    });
});

describe('calculateWeeklyVolume', () => {
    it('calculates single volume when all workouts have fixed numbers', () => {
        const week = {
            workouts: [
                { title: 'Easy Run', distance: 10 },
                { title: 'Tempo Run', distance: 15 }
            ]
        };
        const volumeMi = calculateWeeklyVolume(week, 'mi');
        expect(volumeMi).toEqual({
            min: 25,
            max: 25,
            average: 25,
            formatted: '25'
        });

        const volumeKm = calculateWeeklyVolume(week, 'km');
        expect(volumeKm).toEqual({
            min: 40.2,
            max: 40.2,
            average: 40.2,
            formatted: '40.2'
        });
    });

    it('calculates volume ranges when workouts have distance ranges', () => {
        const week = {
            workouts: [
                { title: 'LT Run', distance: [12.9, 14.5] as [number, number] },
                { title: 'Easy Run', distance: 10 }
            ]
        };

        const volumeMi = calculateWeeklyVolume(week, 'mi');
        expect(volumeMi).toEqual({
            min: 23,
            max: 25,
            average: 24,
            formatted: '23 - 25'
        });

        const volumeKm = calculateWeeklyVolume(week, 'km');
        expect(volumeKm).toEqual({
            min: 36.9,
            max: 39.4,
            average: 38.2,
            formatted: '36.9 - 39.4'
        });
    });
});
