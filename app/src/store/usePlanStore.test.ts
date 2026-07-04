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

    it('swaps raceInput when race type changes', () => {
        const { setPlanId } = usePlanStore.getState();

        // Start with marathon plan selected
        usePlanStore.setState({ selectedPlanId: 'pfitz_18_55_4th', raceInput: { distance: 'Marathon', time: '3:30:00' } });

        // Switch to half marathon plan
        setPlanId('pfitz_half_12_63');
        expect(usePlanStore.getState().raceInput?.distance).toBe('Half Marathon');
        expect(usePlanStore.getState().raceInput?.time).toBe('1:45:00');
        expect(usePlanStore.getState().selectedPlanId).toBe('pfitz_half_12_63');

        // Switch to 5K plan
        setPlanId('frr_5k_01');
        expect(usePlanStore.getState().raceInput?.distance).toBe('5K');
        expect(usePlanStore.getState().raceInput?.time).toBe('0:20:00');
        expect(usePlanStore.getState().selectedPlanId).toBe('frr_5k_01');

        // Switch back to marathon plan
        setPlanId('pfitz_18_70_4th');
        expect(usePlanStore.getState().raceInput?.distance).toBe('Marathon');
        expect(usePlanStore.getState().raceInput?.time).toBe('3:30:00');
        expect(usePlanStore.getState().selectedPlanId).toBe('pfitz_18_70_4th');

        // Switch to another marathon plan (should not change customized race input)
        usePlanStore.setState({ raceInput: { distance: '15K', time: '1:10:00' } });
        setPlanId('pfitz_18_55_4th');
        expect(usePlanStore.getState().raceInput?.distance).toBe('15K');
        expect(usePlanStore.getState().raceInput?.time).toBe('1:10:00');
    });

    it('sets workout completion status', () => {
        const { setWorkoutStatus } = usePlanStore.getState();
        
        // Initially empty
        usePlanStore.setState({ workoutLogs: {} });
        expect(usePlanStore.getState().workoutLogs).toEqual({});

        // Set status
        setWorkoutStatus(0, 0, 'completed');
        const planId = usePlanStore.getState().selectedPlanId;
        expect(usePlanStore.getState().workoutLogs[`${planId}-w0-d0`]).toBe('completed');

        // Reset/clear status
        setWorkoutStatus(0, 0, 'none');
        expect(usePlanStore.getState().workoutLogs[`${planId}-w0-d0`]).toBeUndefined();
    });

    it('swaps workout completion status when moveWorkout is called', () => {
        const { setWorkoutStatus, moveWorkout } = usePlanStore.getState();
        const planId = usePlanStore.getState().selectedPlanId;

        usePlanStore.setState({ workoutLogs: {} });
        setWorkoutStatus(0, 0, 'completed');
        setWorkoutStatus(0, 1, 'skipped');

        // Swap workouts
        moveWorkout(0, 0, 0, 1);

        const state = usePlanStore.getState();
        expect(state.workoutLogs[`${planId}-w0-d0`]).toBe('skipped');
        expect(state.workoutLogs[`${planId}-w0-d1`]).toBe('completed');
    });
});
