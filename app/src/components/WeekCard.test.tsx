import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WeekCard } from './WeekCard';
import type { RenderedWeek } from '../types';

vi.mock('../store/usePlanStore', () => ({
    usePlanStore: () => ({
        units: 'km'
    })
}));

describe('WeekCard', () => {
    it('renders single volume when all workouts have fixed numbers', () => {
        const week: RenderedWeek = {
            weekStart: new Date('2026-06-01'),
            weekEnd: new Date('2026-06-07'),
            weeksToGoal: 4,
            weekNumber: 1,
            originalWeek: { workouts: [] },
            workouts: [
                { title: 'Easy Run', distance: 10, date: new Date('2026-06-01'), dayOfWeek: 0 },
                { title: 'Tempo Run', distance: 15, date: new Date('2026-06-02'), dayOfWeek: 1 }
            ]
        };

        render(<WeekCard week={week} weekIndex={0} />);
        expect(screen.getByText('40.2')).toBeInTheDocument();
        expect(screen.getByText('km')).toBeInTheDocument();
    });

    it('renders volume range when workouts have distance ranges', () => {
        const week: RenderedWeek = {
            weekStart: new Date('2026-06-01'),
            weekEnd: new Date('2026-06-07'),
            weeksToGoal: 4,
            weekNumber: 1,
            originalWeek: { workouts: [] },
            workouts: [
                { title: 'LT Run', distance: [12.9, 14.5], date: new Date('2026-06-01'), dayOfWeek: 0 },
                { title: 'Easy Run', distance: 10, date: new Date('2026-06-02'), dayOfWeek: 1 }
            ]
        };

        render(<WeekCard week={week} weekIndex={0} />);
        expect(screen.getByText('36.9 - 39.4')).toBeInTheDocument();
        expect(screen.getByText('km')).toBeInTheDocument();
    });
});
