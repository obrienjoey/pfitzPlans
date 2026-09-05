import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
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
        expect(screen.getByText('Weekly volume')).toBeInTheDocument();
        expect(screen.getByText('W1')).toBeInTheDocument();
        // Single past week, nothing to collapse.
        expect(screen.queryByText(/Earlier weeks/)).toBeNull();
    });

    it('renders a logged-mileage marker when actual volumes are provided', () => {
        const weeks: RenderedWeek[] = [
            {
                weekStart: new Date('2026-06-01'),
                weekEnd: new Date('2026-06-07'),
                weeksToGoal: 2,
                weekNumber: 1,
                originalWeek: { workouts: [] },
                workouts: [
                    { title: 'Easy Run', distance: 10, date: new Date('2026-06-01'), dayOfWeek: 0 }
                ]
            }
        ];

        const { container, rerender } = render(<MileageChart weeks={weeks} units="mi" />);
        expect(container.querySelector('[data-logged-marker]')).toBeNull();

        rerender(<MileageChart weeks={weeks} units="mi" actualVolumes={[6]} />);
        const marker = container.querySelector('[data-logged-marker="W1"]');
        expect(marker).not.toBeNull();
        expect(marker?.textContent).toMatch(/6 logged/);
    });

    it('expands a row to reveal details and an Open week action', () => {
        const weeks: RenderedWeek[] = [
            {
                weekStart: new Date('2026-06-01'),
                weekEnd: new Date('2026-06-07'),
                weeksToGoal: 2,
                weekNumber: 1,
                originalWeek: { workouts: [] },
                workouts: [
                    { title: 'Easy Run', distance: 10, date: new Date('2026-06-01'), dayOfWeek: 0 }
                ]
            }
        ];

        render(<MileageChart weeks={weeks} units="mi" />);
        expect(screen.queryByText('Open week')).toBeNull();

        fireEvent.click(screen.getByRole('button', { name: /Week 1:/ }));
        expect(screen.getByText('Open week')).toBeInTheDocument();
    });

    it('collapses past weeks behind a disclosure mid-plan', () => {
        vi.useFakeTimers();
        try {
            vi.setSystemTime(new Date('2026-07-10T12:00:00'));
            const weeks: RenderedWeek[] = Array.from({ length: 8 }, (_, i) => {
                const start = new Date(2026, 5, 1 + i * 7);
                return {
                    weekStart: start,
                    weekEnd: new Date(start.getTime() + 6 * 864e5),
                    weeksToGoal: 8 - i,
                    weekNumber: i + 1,
                    originalWeek: { workouts: [] },
                    workouts: [
                        { title: 'Easy Run', distance: 10 + i, date: start, dayOfWeek: 0 }
                    ]
                };
            });

            render(<MileageChart weeks={weeks} units="mi" />);
            // Today falls in W6, so W1–W3 collapse and W4+ stays visible.
            expect(screen.getByText(/Earlier weeks \(W1.W3\)/)).toBeInTheDocument();
            expect(screen.getByText('W6')).toBeInTheDocument();
        } finally {
            vi.useRealTimers();
        }
    });
});
