import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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

    it('renders TimeInput within Header without font-mono styling', () => {
        usePlanStore.getState().setRaceDate(new Date('2026-10-01'));
        render(<Header />);
        const input = screen.getByRole('textbox', { name: /race result time/i });
        expect(input.className).not.toContain('font-mono');
    });
});
