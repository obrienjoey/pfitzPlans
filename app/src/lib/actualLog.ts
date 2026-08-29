import { KM_PER_MILE } from './constants';

/**
 * A single actual-day run log entry.
 *
 * Data model locked by wayfinder ticket "Lock the actual-run log data model":
 * keyed by calendar date (yyyy-MM-dd); distance stored as a number plus its own
 * unit flag (display converts via `convertDistance`); time stored as seconds;
 * pace is derived, never stored.
 */
export interface ActualLogEntry {
    /** The calendar day the run happened, as `yyyy-MM-dd`. */
    date: string;
    /** The distance value, in the units given by `distanceUnit`. */
    distance: number;
    distanceUnit: 'mi' | 'km';
    /** Elapsed time in whole seconds. */
    timeSeconds: number;
}

/** A deliberately-skipped day, keyed like a log entry by `yyyy-MM-dd`. */
export type SkippedDay = string;

export type LogDayStatus = 'completed' | 'skipped' | 'none';

/** Local date -> `yyyy-MM-dd`, zero-padded so keys sort lexicographically. */
export const dateToKey = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

/** `MM:SS` or `H:MM:SS` -> seconds; null when unparseable. */
export const parseTimeToSeconds = (input: string): number | null => {
    const trimmed = input.trim();
    if (!trimmed) return null;
    const parts = trimmed.split(':').map((p) => Number(p));
    if (parts.length === 0 || parts.some((p) => Number.isNaN(p))) return null;
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return null;
};

/** Seconds -> `M:SS` (sub-hour) or `H:MM:SS`. */
export const formatSecondsToTime = (totalSeconds: number): string => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const mm = String(m).padStart(2, '0');
    const ss = String(s).padStart(2, '0');
    return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
};

const round1 = (n: number): number => Math.round(n * 10) / 10;

/** Convert a distance between miles and km; a no-op (but rounded) when units match. */
export const convertDistance = (
    value: number,
    from: 'mi' | 'km',
    to: 'mi' | 'km'
): number => {
    if (from === to) return round1(value);
    return from === 'mi' ? round1(value * KM_PER_MILE) : round1(value / KM_PER_MILE);
};

/** Derive a day's status from its log presence and skipped marker. */
export const dayStatus = (
    logs: ActualLogEntry[],
    skipped: SkippedDay[],
    dateKey: string
): LogDayStatus => {
    if (skipped.includes(dateKey)) return 'skipped';
    if (logs.some((l) => l.date === dateKey)) return 'completed';
    return 'none';
};

/** Sum logged distance within an inclusive date range, converted to display units. */
export const sumDistanceForRange = (
    logs: ActualLogEntry[],
    start: Date,
    end: Date,
    to: 'mi' | 'km'
): number => {
    const startKey = dateToKey(start);
    const endKey = dateToKey(end);
    const total = logs
        .filter((l) => l.date >= startKey && l.date <= endKey)
        .reduce((sum, l) => sum + convertDistance(l.distance, l.distanceUnit, to), 0);
    return round1(total);
};
