import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MileageChart } from './MileageChart';
import type { RenderedWeek } from '../types';

describe('MileageChart', () => {
    it('renders weekly progression chart with range formatted tooltip', () => {
        const weeks: RenderedWeek[] = [
            {
                weekStart: new Date('2026-06-01'),
                weekEnd: new Date('2026-06-07'),
                weeksToGoal: 2,
                weekNumber: 1,
                originalWeek: { workouts: [] },
                workouts: [
                    { title: 'LT Run', distance: [12.9, 14.5], date: new Date('2026-06-01'), dayOfWeek: 0 },
                    { title: 'Easy Run', distance: 10, date: new Date('2026-06-02'), dayOfWeek: 1 }
                ]
            }
        ];

        render(<MileageChart weeks={weeks} units="km" />);
        expect(screen.getByText('Weekly Volume Progression')).toBeInTheDocument();
        expect(screen.getByText('W1')).toBeInTheDocument();
    });
});
