import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { Header } from './Header';
import { TimeInput } from './TimeInput';
import { usePlanStore } from '../store/usePlanStore';

describe('Header and TimeInput consistency', () => {
    beforeEach(() => {
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: (query: string) => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: () => {},
                removeListener: () => {},
                addEventListener: () => {},
                removeEventListener: () => {},
                dispatchEvent: () => false,
            }),
        });
    });

    it('does not apply font-mono to TimeInput display input', () => {
        render(<TimeInput value="0:45:00" onChange={() => {}} />);
        const input = screen.getByRole('textbox', { name: /race result time/i });
        expect(input.className).not.toContain('font-mono');
    });

    it('allows changing race date and race time from the mobile bottom drawer', () => {
        usePlanStore.getState().setRaceDate(new Date('2026-10-01'));
        usePlanStore.getState().setRaceInput({ distance: '10K', time: '0:45:00' });
        render(<Header />);
        
        // Open drawer
        const trigger = screen.getByRole('button', { name: /open plan settings/i });
        fireEvent.click(trigger);

        // Mobile drawer dialog should be open
        const drawer = screen.getByRole('dialog', { name: /training calibration settings/i });
        expect(drawer).toBeInTheDocument();

        // Find DatePicker input inside mobile drawer
        const dateInput = within(drawer).getByPlaceholderText('Select Race Date');
        fireEvent.mouseDown(dateInput);
        fireEvent.click(dateInput);

        // DatePicker dialog should be present in document
        const datePickerModal = screen.getByRole('dialog', { name: /choose a date/i });
        expect(datePickerModal).toBeInTheDocument();

        // Select a date day
        const day15 = screen.getByRole('button', { name: '15' });
        fireEvent.mouseDown(day15);
        fireEvent.click(day15);

        // Race date in store should have changed and drawer should remain open
        expect(usePlanStore.getState().raceDate?.getDate()).toBe(15);
        expect(screen.getByRole('dialog', { name: /training calibration settings/i })).toBeInTheDocument();

        // Find TimeInput inside mobile drawer and click it
        const timeInput = within(drawer).getByRole('textbox', { name: /race result time/i });
        fireEvent.mouseDown(timeInput);
        fireEvent.click(timeInput);

        // Click a quick select preset (e.g. 50:00 for 10K)
        const preset50 = screen.getByRole('button', { name: '50:00' });
        fireEvent.mouseDown(preset50);
        fireEvent.click(preset50);

        // Race finish time in store should have changed and drawer should remain open
        expect(usePlanStore.getState().raceInput?.time).toBe('0:50:00');
        expect(screen.getByRole('dialog', { name: /training calibration settings/i })).toBeInTheDocument();
    });
});
