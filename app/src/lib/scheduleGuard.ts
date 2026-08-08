import { startOfDay, format, isValid } from 'date-fns';
import type { RenderedPlan } from '../types';

/**
 * Guard predicate for durable schedule reuse (issue #14).
 *
 * A stored schedule is safe to keep showing iff, compared BY VALUE (never by a
 * live Date object), its fingerprint matches the current configuration — the same
 * plan AND the same normalised (yyyy-MM-dd) race date. Anything else (missing fp,
 * a different plan, a different date, or no schedule at all) is invalid and must be
 * regenerated from the canonical plan (a deliberate fresh start that resets reorders).
 */
export const scheduleMatchesValid = (
    schedule: RenderedPlan | null | undefined,
    selectedPlanId: string,
    raceDate: Date | string | null | undefined
): boolean => {
    if (!schedule || !schedule.fp) return false;
    if (!raceDate) return false;

    const d = raceDate instanceof Date ? raceDate : new Date(raceDate);
    if (!isValid(d)) return false;

    const raceDateKey = format(startOfDay(d), 'yyyy-MM-dd');
    return schedule.fp.planId === selectedPlanId && schedule.fp.raceDateKey === raceDateKey;
};
