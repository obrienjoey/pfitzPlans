import { describe, it, expect } from 'vitest';
import { formatPlanLabel } from './formatters';

describe('formatters', () => {
    describe('formatPlanLabel', () => {
        it('replaces ranges with miles', () => {
            const input = 'Run {8:13} miles';
            expect(formatPlanLabel(input, 'mi')).toBe('Run 8 miles');
        });
        it('replaces ranges with km', () => {
            const input = 'Run {8:13} miles';
            expect(formatPlanLabel(input, 'km')).toBe('Run 13 miles');
        });
        it('handles multiple replacements', () => {
            const input = '{5:8} to {10:16}';
            expect(formatPlanLabel(input, 'mi')).toBe('5 to 10');
            expect(formatPlanLabel(input, 'km')).toBe('8 to 16');
        });
        it('leaves text without patterns alone', () => {
            expect(formatPlanLabel('Rest Day', 'mi')).toBe('Rest Day');
        });
    });
});
