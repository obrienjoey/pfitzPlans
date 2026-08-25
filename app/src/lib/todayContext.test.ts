import { describe, it, expect } from 'vitest';
import { getTodayContext } from './todayContext';
import type { RenderedPlan } from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;

const buildSchedule = (keepDay?: number): RenderedPlan => {
    // Two weeks: Mon 2026-03-02 → Sun 2026-03-15 (race day).
    const weeks = [0, 1].map((w) => {
        const weekStart = new Date(2026, 2, 2 + w * 7);
        const workouts = Array.from({ length: 7 }, (_, d) => {
            const date = new Date(weekStart.getTime() + d * DAY_MS);
            return {
                title: `W${w + 1} D${d + 1}`,
                description: undefined,
                distance: [5, 8] as [number, number],
                tags: undefined,
                zone: undefined,
                date,
                dayOfWeek: date.getDay()
            };
        }).filter((_, d) => keepDay === undefined || w * 7 + d === keepDay);
        return {
            weekStart,
            weekEnd: new Date(weekStart.getTime() + 6 * DAY_MS),
            weeksToGoal: 2 - w,
            weekNumber: w + 1,
            workouts
        };
    });

    return {
        originalPlan: undefined,
        raceDate: new Date(2026, 2, 15),
        startDate: new Date(2026, 2, 2),
        weeks,
        fp: { planId: 'test_plan', raceDateKey: '2026-03-15' }
    };
};

describe('getTodayContext', () => {
    it('locates today mid-plan and computes countdown and progress', () => {
        const ctx = getTodayContext(buildSchedule(), new Date(2026, 2, 4, 10, 30));
        expect(ctx.weekIndex).toBe(0);
        expect(ctx.dayIndex).toBe(2);
        expect(ctx.workout?.title).toBe('W1 D3');
        expect(ctx.currentWeekNumber).toBe(1);
        expect(ctx.daysToRace).toBe(11);
        expect(ctx.elapsedPct).toBe(15); // 2 of 13 calendar days elapsed
    });

    it('reports race day as T-0 at full progress', () => {
        const ctx = getTodayContext(buildSchedule(), new Date(2026, 2, 15));
        expect(ctx.daysToRace).toBe(0);
        expect(ctx.elapsedPct).toBe(100);
        expect(ctx.weekIndex).toBe(1);
        expect(ctx.dayIndex).toBe(6);
    });

    it('falls outside the plan cleanly before the start date', () => {
        const ctx = getTodayContext(buildSchedule(), new Date(2026, 1, 20));
        expect(ctx.weekIndex).toBe(-1);
        expect(ctx.dayIndex).toBe(-1);
        expect(ctx.workout).toBeNull();
        expect(ctx.currentWeekNumber).toBeNull();
        expect(ctx.elapsedPct).toBe(0);
        expect(ctx.daysToRace).toBeGreaterThan(0);
    });

    it('goes negative once the race has passed', () => {
        const ctx = getTodayContext(buildSchedule(), new Date(2026, 2, 20));
        expect(ctx.daysToRace).toBeLessThan(0);
    });

    it('flags an unscheduled day inside the plan without losing week context', () => {
        // Keep only Monday's workout while "today" is Wednesday.
        const ctx = getTodayContext(buildSchedule(0), new Date(2026, 2, 4));
        expect(ctx.weekIndex).toBe(0);
        expect(ctx.dayIndex).toBe(-1);
        expect(ctx.workout).toBeNull();
        expect(ctx.currentWeekNumber).toBe(1);
    });
});
