import { describe, it, expect, beforeEach } from 'vitest';
import { usePlanStore } from './usePlanStore';
import type { RenderedPlan } from '../types';

describe('usePlanStore', () => {
    const mockPlan: RenderedPlan = {
        originalPlan: { id: 'test', name: 'Test Plan', type: 'Marathon', units: 'mi', schedule: [] },
        raceDate: new Date('2026-01-01'),
        startDate: new Date('2025-12-01'),
        weeks: [
            {
                weekStart: new Date('2025-12-01'),
                weekEnd: new Date('2025-12-07'),
                weekNumber: 1,
                weeksToGoal: 4,
                originalWeek: { workouts: [] },
                workouts: [
                    { title: 'Run A', date: new Date('2025-12-01'), dayOfWeek: 1 },
                    { title: 'Run B', date: new Date('2025-12-02'), dayOfWeek: 2 }
                ]
            }
        ]
    };

    beforeEach(() => {
        usePlanStore.setState({
            currentSchedule: structuredClone(mockPlan),
            units: 'mi'
        });
    });

    it('swaps workouts between two days while preserving dates', () => {
        const { moveWorkout } = usePlanStore.getState();

        // Move from day 0 to day 1
        moveWorkout(0, 0, 0, 1);

        const state = usePlanStore.getState();
        const workouts = state.currentSchedule!.weeks[0].workouts;

        // Titles should be swapped
        expect(workouts[0].title).toBe('Run B');
        expect(workouts[1].title).toBe('Run A');

        // Dates should REMAIN the same
        expect(workouts[0].date.toISOString()).toBe(new Date('2025-12-01').toISOString());
        expect(workouts[1].date.toISOString()).toBe(new Date('2025-12-02').toISOString());
    });

    it('swaps goal time when race type changes', () => {
        const { setPlanId } = usePlanStore.getState();

        // Start with marathon plan selected, goal time is default "4:00:00"
        usePlanStore.setState({ selectedPlanId: 'pfitz_18_55_4th', goalTime: '4:00:00' });

        // Switch to half marathon plan
        setPlanId('pfitz_half_12_63');
        expect(usePlanStore.getState().goalTime).toBe('1:45:00');
        expect(usePlanStore.getState().selectedPlanId).toBe('pfitz_half_12_63');

        // Switch back to marathon plan
        setPlanId('pfitz_18_70_4th');
        expect(usePlanStore.getState().goalTime).toBe('4:00:00');
        expect(usePlanStore.getState().selectedPlanId).toBe('pfitz_18_70_4th');

        // Switch to another marathon plan (should not change customized goal time)
        usePlanStore.setState({ goalTime: '3:30:00' });
        setPlanId('pfitz_18_55_4th');
        expect(usePlanStore.getState().goalTime).toBe('3:30:00');
    });
});
