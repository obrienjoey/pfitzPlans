import { render, screen } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { TodayBand } from './TodayBand';
import type { RenderedPlan } from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;

const buildSchedule = (): RenderedPlan => {
    const weekStart = new Date(2026, 2, 2);
    const workouts = Array.from({ length: 14 }, (_, i) => {
        const date = new Date(weekStart.getTime() + i * DAY_MS);
        return {
            title: 'LT Run',
            description: undefined,
            distance: [8, 10] as [number, number],
            tags: undefined,
            zone: undefined,
            date,
            dayOfWeek: date.getDay()
        };
    });
    const weeks = [0, 1].map((w) => ({
        weekStart: new Date(weekStart.getTime() + w * 7 * DAY_MS),
        weekEnd: new Date(weekStart.getTime() + (w * 7 + 6) * DAY_MS),
        weeksToGoal: 2 - w,
        weekNumber: w + 1,
        workouts: workouts.slice(w * 7, w * 7 + 7)
    }));

    return {
        originalPlan: undefined,
        raceDate: new Date(2026, 2, 15),
        startDate: new Date(2026, 2, 2),
        weeks,
        fp: { planId: 'test_plan', raceDateKey: '2026-03-15' }
    };
};

afterEach(() => {
    vi.useRealTimers();
});

describe('TodayBand', () => {
    it('shows today workout, progress, and countdown mid-plan', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 2, 4, 8, 0));

        render(<TodayBand schedule={buildSchedule()} units="km" />);

        expect(screen.getByText(/LT Run/)).toBeInTheDocument();
        // 8–10 mi in km, one decimal
        expect(screen.getByText('12.9–16.1 km')).toBeInTheDocument();
        expect(screen.getByText('T−11')).toBeInTheDocument();
        expect(screen.getByText('15% done')).toBeInTheDocument();
    });

    it('renders nothing once the race has passed', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 2, 20));

        const { container } = render(<TodayBand schedule={buildSchedule()} units="mi" />);
        expect(container).toBeEmptyDOMElement();
    });

    it('shows the rest message when today has no scheduled workout', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2025, 11, 1)); // well before the plan starts

        render(<TodayBand schedule={buildSchedule()} units="mi" />);
        expect(screen.getByText('No workout scheduled today')).toBeInTheDocument();
    });

    it('exposes a jump affordance when onJump is passed', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 2, 4, 8, 0));

        render(<TodayBand schedule={buildSchedule()} units="mi" onJump={() => {}} />);
        expect(screen.getByRole('button')).toBeInTheDocument();
    });
});
