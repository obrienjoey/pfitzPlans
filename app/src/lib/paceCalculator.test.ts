import { describe, it, expect } from 'vitest';
import { calculateTrainingPaces, equivalentTimes, to10KEquivalent, formatTime, formatTimeHMS, parseTimeString, getPaceZone } from './paceCalculator';

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
            expect(formatTime(3605)).toBe('60:05');
        });
    });
    
    describe('formatTimeHMS', () => {
        it('formats 5400 seconds as "1:30:00"', () => {
            expect(formatTimeHMS(5400)).toBe('1:30:00');
        });
        it('formats 180 seconds as "3:00"', () => {
            expect(formatTimeHMS(180)).toBe('3:00');
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
    });

    describe('pace calculations', () => {
        it('calculates 10K equivalent correctly', () => {
            const t10 = to10KEquivalent({ distance: '5K', timeSeconds: 1200 });
            expect(t10).toBeCloseTo(1200 / 0.4808, 1);
        });
        
        it('calculates marathon training paces', () => {
            const res = calculateTrainingPaces({ distance: '10K', timeSeconds: 2400 }, 'Marathon');
            expect(res.t10).toBe(2400);
            
            // 40:00 10K = 4:00/km
            expect(res.paces['Marathon'].min).toBeCloseTo((2400 * 4.68) / 42.195, 1);
            
            expect(res.paces['Lactate Threshold'].min).toBeCloseTo(2400 / 10 + 10, 1);
            expect(res.paces['Lactate Threshold'].max).toBeCloseTo(2400 / 10 + 15, 1);
        });
    });
});
