import { describe, it, expect } from 'vitest';
import { scheduleMatchesValid } from './scheduleGuard';
import type { RenderedPlan } from '../types';

const makeSchedule = (planId: string, raceDateKey: string): RenderedPlan => ({
    originalPlan: { id: planId, name: 'Test', type: 'Marathon', units: 'mi', schedule: [] },
    raceDate: new Date('2026-06-07'),
    startDate: new Date('2026-06-01'),
    fp: { planId, raceDateKey },
    weeks: [],
});

describe('scheduleMatchesValid', () => {
    it('is true when both plan id and race date match by value', () => {
        expect(scheduleMatchesValid(makeSchedule('planA', '2026-06-07'), 'planA', new Date('2026-06-07'))).toBe(true);
    });

    it('is false when the plan id differs', () => {
        expect(scheduleMatchesValid(makeSchedule('planA', '2026-06-07'), 'planB', new Date('2026-06-07'))).toBe(false);
    });

    it('is false when the race date differs', () => {
        expect(scheduleMatchesValid(makeSchedule('planA', '2026-06-07'), 'planA', new Date('2026-08-01'))).toBe(false);
    });

    it('is false when there is no schedule to compare against', () => {
        expect(scheduleMatchesValid(null, 'planA', new Date('2026-06-07'))).toBe(false);
    });

    it('is false when there is no race date selected', () => {
        expect(scheduleMatchesValid(makeSchedule('planA', '2026-06-07'), 'planA', null)).toBe(false);
    });

    it('is false when the schedule carries no fingerprint (legacy data)', () => {
        const legacy = makeSchedule('planA', '2026-06-07');
        delete (legacy as Partial<RenderedPlan>).fp;
        expect(scheduleMatchesValid(legacy, 'planA', new Date('2026-06-07'))).toBe(false);
    });

    it('handles ISO string race dates safely', () => {
        expect(scheduleMatchesValid(makeSchedule('planA', '2026-06-07'), 'planA', '2026-06-07T00:00:00.000Z')).toBe(true);
    });

    it('is false when given an invalid date string', () => {
        expect(scheduleMatchesValid(makeSchedule('planA', '2026-06-07'), 'planA', 'invalid-date')).toBe(false);
    });
});
