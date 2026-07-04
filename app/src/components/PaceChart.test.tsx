import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PaceChart } from './PaceChart';
import type { TrainingPaces, EquivalentTimes } from '../lib/paceCalculator';
import type { RaceInputState } from '../store/usePlanStore';

describe('PaceChart Component', () => {
    const mockPaces: TrainingPaces = {
        'VO2 Max': { min: 240, max: 250 },
        'Lactate Threshold': { min: 270, max: 280 },
        'General Aerobic': { min: 300, max: 320 },
        'Long Run': { min: 310, max: 340 },
        'Marathon': { min: 290, max: 300 },
        'Recovery': { min: 340, max: 370 },
    };

    const mockEquivalents: EquivalentTimes = {
        '5K': 1200,
        '10K': 2480,
        '15K': 3800,
        '10 Miles': 4200,
        'Half Marathon': 5500,
        'Marathon': 11800,
    };

    const mockRaceInput: RaceInputState = {
        distance: '10K',
        time: '0:41:20',
    };

    it('returns null if paces is not provided', () => {
        const { container } = render(
            <PaceChart
                units="km"
                raceInput={mockRaceInput}
                planType="Marathon"
            />
        );
        expect(container.firstChild).toBeNull();
    });

    it('renders pace chart header and sections when paces are provided', () => {
        render(
            <PaceChart
                paces={mockPaces}
                equivalents={mockEquivalents}
                units="km"
                raceInput={mockRaceInput}
                planType="Marathon"
            />
        );

        expect(screen.getByText('Training Paces')).toBeInTheDocument();
        expect(screen.getByText(/Based on 0:41:20 10K race/)).toBeInTheDocument();
        expect(screen.getByText('Race Paces')).toBeInTheDocument();
        expect(screen.getByText('Training Zones')).toBeInTheDocument();
    });

    it('excludes Marathon pace zone for FRR plans', () => {
        render(
            <PaceChart
                paces={mockPaces}
                equivalents={mockEquivalents}
                units="km"
                raceInput={mockRaceInput}
                planType="5K"
            />
        );

        expect(screen.getByText('Recovery')).toBeInTheDocument();
        expect(screen.getByText('General Aerobic')).toBeInTheDocument();
        // Marathon (for training zones list) should be filtered out
        const marathonElements = screen.queryAllByText('Marathon');
        // It might be in the race paces section but not as a training zone
        // Check if there is no element with the training zone class text color
        const marathonZone = marathonElements.find(el => el.classList.contains('text-emerald-400'));
        expect(marathonZone).toBeUndefined();
    });

    it('formats ranges in miles correctly when units is mi', () => {
        render(
            <PaceChart
                paces={mockPaces}
                equivalents={mockEquivalents}
                units="mi"
                raceInput={mockRaceInput}
                planType="Marathon"
            />
        );

        expect(screen.getAllByText(/\/mi/)[0]).toBeInTheDocument();
    });
});
