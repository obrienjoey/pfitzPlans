import { describe, it, expect } from 'vitest';
import { calculatePaces, formatTime, parseTimeString, getPaceZone } from './paceCalculator';

describe('paceCalculator', () => {
    describe('parseTimeString', () => {
        it('parses "3:00" correctly', () => {
            expect(parseTimeString('3:00')).toBe(180);
        });
        it('parses "1:30:00" correctly', () => {
            expect(parseTimeString('1:30:00')).toBe(5400);
        });
        it('returns null for invalid strings', () => {
            expect(parseTimeString('invalid')).toBeNull();
        });
    });

    describe('formatTime', () => {
        it('formats 180 seconds as "3:00"', () => {
            expect(formatTime(180)).toBe('3:00');
        });
        it('formats 3605 seconds as "60:05"', () => {
            // Logic in formatTime is mins:seconds. 3600s = 60m.
            expect(formatTime(3605)).toBe('60:05');
        });
    });

    describe('getPaceZone', () => {
        it('identifies Recovery runs', () => {
            expect(getPaceZone('Recovery Run')).toBe('Recovery');
        });
        it('identifies General Aerobic runs', () => {
            expect(getPaceZone('General Aerobic + Speed')).toBe('General Aerobic');
        });
        it('identifies Long Runs', () => {
            expect(getPaceZone('Long Run 15 mi')).toBe('Long Run');
        });
        it('identifies Lactate Threshold', () => {
            expect(getPaceZone('Lactate Threshold interval')).toBe('Lactate Threshold');
        });
        it('identifies VO2 Max', () => {
            expect(getPaceZone('VO2Max Intervals')).toBe('VO2 Max');
        });
        it('identifies Marathon Pace', () => {
            expect(getPaceZone('12 mi w/ 8 mi @ MP')).toBe('Marathon');
        });
    });

    describe('calculatePaces', () => {
        it('calculates ranges correctly for 4:00/km (240s)', () => {
            const paces = calculatePaces(240);

            // Marathon: 240 * 1.0 = 240
            expect(paces['Marathon'].min).toBe(240);
            expect(paces['Marathon'].max).toBe(240);

            // Long Run: 240 * 1.10 = 264, 240 * 1.20 = 288
            expect(paces['Long Run'].min).toBe(264);
            expect(paces['Long Run'].max).toBe(288);
        });
    });
});
