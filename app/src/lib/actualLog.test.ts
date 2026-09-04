import { describe, it, expect } from 'vitest';
import {
    dateToKey,
    parseTimeToSeconds,
    formatSecondsToTime,
    convertDistance,
    dayStatus,
    sumDistanceForRange,
    completedVolumeForWeek,
    logKey,
    type ActualLogEntry
} from './actualLog';
import { calculateWeeklyVolume } from './calculator';
import type { RenderedWeek } from '../types';

describe('actualLog domain helpers', () => {
    describe('dateToKey', () => {
        it('zero-pads month and day into yyyy-MM-dd', () => {
            expect(dateToKey(new Date(2026, 0, 5))).toBe('2026-01-05');
            expect(dateToKey(new Date(2026, 6, 30))).toBe('2026-07-30');
        });

        it('produces a lexicographically sortable key for a real workout date', () => {
            expect(dateToKey(new Date(2026, 5, 8))).toBe('2026-06-08');
        });
    });

    describe('parseTimeToSeconds', () => {
        it('parses MM:SS', () => {
            expect(parseTimeToSeconds('30:00')).toBe(1800);
            expect(parseTimeToSeconds('0:45')).toBe(45);
        });

        it('parses H:MM:SS', () => {
            expect(parseTimeToSeconds('1:30:00')).toBe(5400);
        });

        it('returns null for unparseable input', () => {
            expect(parseTimeToSeconds('abc')).toBeNull();
            expect(parseTimeToSeconds('45')).toBeNull();
            expect(parseTimeToSeconds('')).toBeNull();
        });
    });

    describe('formatSecondsToTime', () => {
        it('formats sub-hour times as M:SS', () => {
            expect(formatSecondsToTime(90)).toBe('1:30');
        });

        it('formats hour-long times as H:MM:SS', () => {
            expect(formatSecondsToTime(5400)).toBe('1:30:00');
            expect(formatSecondsToTime(3600)).toBe('1:00:00');
        });
    });

    describe('convertDistance', () => {
        it('converts miles to km (1.609344 factor)', () => {
            expect(convertDistance(5, 'mi', 'km')).toBe(8);
        });

        it('converts km to miles', () => {
            expect(convertDistance(8.04672, 'km', 'mi')).toBe(5);
        });

        it('returns the value unchanged and rounded when units match', () => {
            expect(convertDistance(6.25, 'mi', 'mi')).toBe(6.3);
        });
    });

    describe('dayStatus', () => {
        const logs: ActualLogEntry[] = [
            { date: '2026-06-08', distance: 8, distanceUnit: 'mi', timeSeconds: 2700 }
        ];

        it('derives completed from a logged actual', () => {
            expect(dayStatus(logs, [], '2026-06-08')).toBe('completed');
        });

        it('reports skipped for a deliberately skipped day', () => {
            expect(dayStatus(logs, ['2026-06-09'], '2026-06-09')).toBe('skipped');
        });

        it('reports none for an unlogged, unskipped day', () => {
            expect(dayStatus(logs, [], '2026-06-10')).toBe('none');
        });
    });

    describe('sumDistanceForRange', () => {
        const logs: ActualLogEntry[] = [
            { date: '2026-06-08', distance: 5, distanceUnit: 'mi', timeSeconds: 1800 },
            { date: '2026-06-10', distance: 10, distanceUnit: 'mi', timeSeconds: 3600 },
            { date: '2026-06-15', distance: 5, distanceUnit: 'mi', timeSeconds: 1800 } // outside range
        ];

        it('sums only logs within the date range, converted to display units', () => {
            // 5 mi + 10 mi = 15 mi; 15 mi in km = 15 * 1.609344 = 24.14 -> 24.1
            expect(sumDistanceForRange(logs, new Date(2026, 5, 8), new Date(2026, 5, 14), 'km')).toBe(24.1);
            expect(sumDistanceForRange(logs, new Date(2026, 5, 8), new Date(2026, 5, 14), 'mi')).toBe(15);
        });
    });

    describe('completedVolumeForWeek', () => {
        const week = {
            weekStart: new Date('2026-06-01'),
            weekEnd: new Date('2026-06-07'),
            weeksToGoal: 2,
            weekNumber: 1,
            workouts: [
                { title: 'LT Run', distance: [12, 14], date: new Date('2026-06-01'), dayOfWeek: 0 },
                { title: 'Easy Run', distance: 10, date: new Date('2026-06-02'), dayOfWeek: 1 },
                { title: 'Rest', date: new Date('2026-06-03'), dayOfWeek: 2 },
            ],
        } as RenderedWeek;

        it('builds the same key format as usePlanStore.setWorkoutStatus', () => {
            expect(logKey('planA', 0, 0)).toBe('planA-w0-d0');
        });

        it('sums planned distance for completed and modified workouts only', () => {
            const logs = {
                [logKey('planA', 0, 0)]: 'completed',
                [logKey('planA', 0, 1)]: 'modified',
            } as Record<string, 'completed' | 'modified'>;
            // (12+14)/2 + 10 = 23 mi
            expect(completedVolumeForWeek(week, 0, 'planA', logs, 'mi')).toBe(23);
        });

        it('ignores skipped and untoggled workouts', () => {
            const logs = { [logKey('planA', 0, 0)]: 'skipped' } as Record<string, 'skipped'>;
            expect(completedVolumeForWeek(week, 0, 'planA', logs, 'mi')).toBe(0);
            expect(completedVolumeForWeek(week, 0, 'planA', {}, 'mi')).toBe(0);
        });

        it('converts to display units like the planned totals', () => {
            const logs = { [logKey('planA', 0, 1)]: 'completed' } as Record<string, 'completed'>;
            // 10 mi -> km
            expect(completedVolumeForWeek(week, 0, 'planA', logs, 'km')).toBe(16.1);
        });

        it('matches the planned average when the whole week is logged', () => {
            const logs = {
                [logKey('planA', 0, 0)]: 'completed',
                [logKey('planA', 0, 1)]: 'completed',
            } as Record<string, 'completed'>;
            expect(completedVolumeForWeek(week, 0, 'planA', logs, 'mi'))
                .toBe(calculateWeeklyVolume(week, 'mi').average);
        });
    });
});
