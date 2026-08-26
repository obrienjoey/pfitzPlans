import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DayCard } from './DayCard';
import type { RenderedWorkout } from '../types';

describe('DayCard Component', () => {
    const defaultWorkout: RenderedWorkout = {
        title: 'General Aerobic',
        description: '8 mi GA',
        distance: 8,
        date: new Date('2026-06-08T00:00:00'),
        dayOfWeek: 1,
    };

    it('renders workout title and description', () => {
        render(
            <DayCard
                workout={defaultWorkout}
                units="mi"
                id="week-0-day-1"
            />
        );

        expect(screen.getByText('General Aerobic')).toBeInTheDocument();
        expect(screen.getByText('8 mi GA')).toBeInTheDocument();
        expect(screen.getByText('8 mi')).toBeInTheDocument();
    });

    it('renders rest day correctly', () => {
        const restWorkout: RenderedWorkout = {
            title: 'Rest',
            date: new Date('2026-06-08T00:00:00'),
            dayOfWeek: 1,
        };

        render(
            <DayCard
                workout={restWorkout}
                units="mi"
                id="week-0-day-1"
            />
        );

        expect(screen.getByText('Rest')).toBeInTheDocument();
        expect(screen.queryByText('mi')).not.toBeInTheDocument();
    });

    it('displays calculated pace string when paces are provided', () => {
        const gaWorkout: RenderedWorkout = {
            title: 'General Aerobic',
            date: new Date('2026-06-08T00:00:00'),
            dayOfWeek: 1,
        };
        const mockPaces = {
            'General Aerobic': { min: 300, max: 330 }, // 5:00 - 5:30 per km
            'VO2 Max': { min: 240, max: 250 },
            'Lactate Threshold': { min: 270, max: 280 },
            'Long Run': { min: 310, max: 350 },
            'Marathon': { min: 290, max: 300 },
            'Recovery': { min: 340, max: 370 },
        };

        render(
            <DayCard
                workout={gaWorkout}
                units="km"
                id="week-0-day-1"
                paces={mockPaces}
            />
        );

        // 300s is 5:00, 330s is 5:30 (handles en-dash separator)
        expect(screen.getByText(/5:00.*5:30/)).toBeInTheDocument();
    });

    it('renders the status trigger button when weekIndex and dayIndex are passed', () => {
        render(
            <DayCard
                workout={defaultWorkout}
                units="mi"
                id="week-0-day-1"
                weekIndex={0}
                dayIndex={1}
            />
        );

        const trigger = screen.getByTitle('Mark workout status');
        expect(trigger).toBeInTheDocument();
        // Status trigger lives inside the day row, next to the drag handle
        expect(trigger.closest('.relative.flex')).not.toBeNull();
        expect(screen.getByTitle('Drag to reschedule')).toBeInTheDocument();
    });

    it('reveals pace and full description when a workout row is tapped', () => {
        const desc = 'A longer description of this session that explains the workout.';
        const mockPaces = {
            'General Aerobic': { min: 300, max: 330 },
            'VO2 Max': { min: 240, max: 250 },
            'Lactate Threshold': { min: 270, max: 280 },
            'Long Run': { min: 310, max: 350 },
            'Marathon': { min: 290, max: 300 },
            'Recovery': { min: 340, max: 370 },
        };
        render(
            <DayCard
                workout={{ ...defaultWorkout, description: desc }}
                units="km"
                id="week-0-day-1"
                paces={mockPaces}
            />
        );

        // Before tapping: the description appears only once (inline).
        expect(screen.getAllByText(desc).length).toBe(1);

        fireEvent.click(screen.getByText('General Aerobic'));

        // After tapping: the description appears twice (inline + reveal),
        // and the reveal shows the zone-colored pace range.
        expect(screen.getAllByText(desc).length).toBe(2);
        expect(screen.getAllByText(/5:00.*5:30/).length).toBeGreaterThanOrEqual(1);
    });

    it('keeps rest days inert to tap (no reveal)', () => {
        const restDesc = 'Rest or cross-train easily.';
        const restWorkout: RenderedWorkout = {
            title: 'Rest',
            description: restDesc,
            date: new Date('2026-06-08T00:00:00'),
            dayOfWeek: 1,
        };
        render(<DayCard workout={restWorkout} units="mi" id="week-0-day-1" />);

        expect(screen.getAllByText(restDesc).length).toBe(1);

        fireEvent.click(screen.getByText('Rest'));

        // Rest rows never mount a reveal block, so the description stays single.
        expect(screen.getAllByText(restDesc).length).toBe(1);
        expect(screen.queryByText(/No pacing targets for this workout/)).not.toBeInTheDocument();
    });
});

