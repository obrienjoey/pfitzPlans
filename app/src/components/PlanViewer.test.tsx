import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { PlanViewer } from './PlanViewer';
import { usePlanStore } from '../store/usePlanStore';
import { fetchPlan } from '../lib/parser';
import type { Plan } from '../types';
import type { PlanInfo } from '../config';

vi.mock('../lib/parser', () => ({
    fetchPlan: vi.fn(),
}));

const mockFetchPlan = vi.mocked(fetchPlan);

const plan: Plan = {
    id: 'test_plan',
    name: 'Test Plan',
    type: 'Marathon',
    units: 'mi',
    schedule: [{
        workouts: [
            { title: 'Run A' },
            { title: 'Run B' },
            { title: 'Run C' }
        ]
    }]
};

const planInfo: PlanInfo = { id: 'test_plan', name: 'Test Plan', description: 'Test Plan Description', type: 'Marathon', weeks: 1, path: 'plans/test_plan.yaml' };

const CANONICAL_ORDER = ['Run A', 'Run B', 'Run C'];

// Persist a schedule whose workouts are in a REORDERED order but whose fingerprint
// matches the current configuration (same plan, same race date).
const persistReorderedSchedule = (order: string[]) => {
    localStorage.setItem('plan-storage', JSON.stringify({
        state: {
            selectedPlanId: 'test_plan',
            raceDate: '2026-06-07',
            units: 'mi',
            raceInput: { distance: 'Marathon', time: '3:30:00' },
            currentSchedule: {
                originalPlan: {
                    id: 'test_plan',
                    name: 'Test Plan',
                    type: 'Marathon',
                    units: 'mi',
                    schedule: [{ workouts: [] }]
                },
                raceDate: '2026-06-07',
                startDate: '2026-06-01',
                weeks: [{
                    weekStart: '2026-06-01',
                    weekEnd: '2026-06-07',
                    weekNumber: 1,
                    weeksToGoal: 1,
                    workouts: order.map((title, i) => ({ title, date: `2026-06-0${i + 1}`, dayOfWeek: i }))
                }],
                fp: { planId: 'test_plan', raceDateKey: '2026-06-07' }
            },
            workoutLogs: {}
        },
        version: 0
    }));
};

describe('PlanViewer reseed guard', () => {
    beforeEach(() => {
        localStorage.clear();
        mockFetchPlan.mockReset();
        usePlanStore.setState({
            availablePlans: [planInfo],
            manifestLoaded: true,
            currentSchedule: null,
            selectedPlanId: 'test_plan',
            raceDate: null,
        });
    });

    it('keeps a reordered schedule across a same-config hydrate → remount → reseed', async () => {
        persistReorderedSchedule(['Run C', 'Run A', 'Run B']);
        await usePlanStore.persist.rehydrate();

        mockFetchPlan.mockResolvedValueOnce(plan);
        render(<PlanViewer />);

        await waitFor(() => expect(mockFetchPlan).toHaveBeenCalled());
        await waitFor(() => expect(usePlanStore.getState().currentSchedule).not.toBeNull());

        const order = usePlanStore.getState().currentSchedule!.weeks[0].workouts.map(w => w.title);
        expect(order).toEqual(['Run C', 'Run A', 'Run B']);
    });

    it('regenerates canonical order when the race date changes (fresh start)', async () => {
        persistReorderedSchedule(['Run C', 'Run A', 'Run B']);
        await usePlanStore.persist.rehydrate();

        usePlanStore.setState({ raceDate: new Date('2026-08-02') });

        mockFetchPlan.mockResolvedValueOnce(plan);
        render(<PlanViewer />);

        await waitFor(() => expect(mockFetchPlan).toHaveBeenCalled());
        await waitFor(() => {
            const order = usePlanStore.getState().currentSchedule?.weeks[0].workouts.map(w => w.title);
            expect(order).toEqual(CANONICAL_ORDER);
        });
    });

    it('regenerates canonical order when the plan changes (fresh start)', async () => {
        persistReorderedSchedule(['Run C', 'Run A', 'Run B']);
        await usePlanStore.persist.rehydrate();

        const plan2: Plan = { ...plan, id: 'test_plan2' };
        const planInfo2: PlanInfo = { id: 'test_plan2', name: 'Test Plan 2', description: 'Test Plan 2 Description', type: 'Marathon', weeks: 1, path: 'plans/test_plan2.yaml' };
        usePlanStore.getState().setAvailablePlans([planInfo, planInfo2]);
        usePlanStore.setState({ selectedPlanId: 'test_plan2' });

        mockFetchPlan.mockResolvedValueOnce(plan2);
        render(<PlanViewer />);

        await waitFor(() => expect(mockFetchPlan).toHaveBeenCalled());
        await waitFor(() => {
            const order = usePlanStore.getState().currentSchedule?.weeks[0].workouts.map(w => w.title);
            expect(order).toEqual(CANONICAL_ORDER);
        });
    });

    it('does not reset a saved reorder when initialized with URL params matching the stored plan and race date', async () => {
        persistReorderedSchedule(['Run C', 'Run A', 'Run B']);
        await usePlanStore.persist.rehydrate();

        // Simulate App component initializing state from URL params matching stored values
        usePlanStore.getState().setPlanId('test_plan');
        usePlanStore.getState().setRaceDate(new Date('2026-06-07'));

        mockFetchPlan.mockResolvedValueOnce(plan);
        render(<PlanViewer />);

        await waitFor(() => expect(mockFetchPlan).toHaveBeenCalled());
        await waitFor(() => expect(usePlanStore.getState().currentSchedule).not.toBeNull());

        const order = usePlanStore.getState().currentSchedule!.weeks[0].workouts.map(w => w.title);
        expect(order).toEqual(['Run C', 'Run A', 'Run B']);
    });
});
