import { format } from 'date-fns';
import type { RenderedPlan, Distance } from '../types';
import { cleanPlanTitle } from '../lib/formatters';
import { getTodayContext } from '../lib/todayContext';
import { KM_PER_MILE } from '../lib/constants';

interface TodayBandProps {
    schedule: RenderedPlan;
    raceDate?: Date | null;
    planName?: string;
    planType?: string;
    units: 'mi' | 'km';
    peakVolume?: number;
    onJump?: () => void;
}

// Midpoint of a workout distance in display units. Ranges collapse to one
// number so all seven ribbon cells fit on a 360px phone; the full range
// stays available in the cell's accessible name.
const ribbonDistance = (dist: Distance | undefined, units: 'mi' | 'km'): string | null => {
    if (dist === undefined) return null;
    const raw = typeof dist === 'number' ? dist : (dist[0] + dist[1]) / 2;
    if (units === 'km') return `${Math.round(raw * KM_PER_MILE * 10) / 10}`;
    return `${Math.round(raw)}`;
};

/** Plan distances are stored in miles — convert each endpoint for display. */
const convertDistanceValue = (miValue: number, units: 'mi' | 'km'): number =>
    units === 'km' ? Math.round(miValue * KM_PER_MILE * 10) / 10 : Math.round(miValue);

/** Full range for accessible names/titles, e.g. [8,10] mi → "8–10 mi" or "12.9–16.1 km". */
const formatFullDistance = (dist: Distance | undefined, units: 'mi' | 'km'): string | null => {
    if (dist === undefined) return null;
    if (typeof dist === 'number') return `${convertDistanceValue(dist, units)} ${units}`;
    return `${convertDistanceValue(dist[0], units)}–${convertDistanceValue(dist[1], units)} ${units}`;
};

// Short ribbon labels so 7 cells fit a 360px phone without mid-word cuts.
// "General aerobic" → "Aerobic", "Marathon-pace run" → "MP", "Recovery" stays whole.
const ribbonLabel = (title: string): string => {
    const t = title.toLowerCase();
    if (t.includes('rest')) return 'Rest';
    if (t.includes('recovery')) return 'Recovery';
    if (t.includes('tune-up') || t.includes('tuneup')) return 'Tune-up';
    if (t.includes('goal race') || t === 'race') return 'Race';
    if (t.includes('marathon-pace') || t.includes('marathon pace') || t === 'mp') return 'MP';
    if (t.includes('med-long')) return 'Med-long';
    if (t.includes('long run')) return 'Long';
    if (t.includes('gen-aerobic') || t.includes('general aerobic')) return 'Aerobic';
    if (t.includes('lt') || t.includes('lactate') || t.includes('threshold')) return 'LT';
    if (t.includes('vo2') || t.includes('vo₂') || t.includes('interval') || t.includes('speed')) return 'VO2';
    if (t.includes('strides')) return 'Strides';
    return title.length > 9 ? `${title.slice(0, 8).trim()}…` : title;
};

/**
 * This week, at a glance. The thesis is the seven-day strip — today
 * red-pen circled — with today's workout and the race horizon in one
 * quiet line underneath. Pace targets live where they're used: the
 * day rows and the pace ladder below.
 */
export const TodayBand = ({
    schedule,
    raceDate,
    planName,
    planType,
    units,
    peakVolume,
    onJump,
}: TodayBandProps) => {
    const ctx = getTodayContext(schedule);

    // The band has no meaning once the race is behind you
    if (ctx.daysToRace < 0) return null;

    const week = ctx.weekIndex >= 0 ? schedule.weeks[ctx.weekIndex] : null;
    const workout = ctx.workout;
    const isRest = !workout || workout.tags?.includes('Rest') || workout.title.toLowerCase().includes('rest');
    const todayLabel = !workout ? 'No workout scheduled today' : isRest ? 'Rest' : cleanPlanTitle(workout.title);

    const totalWeeks = schedule.weeks.length;
    const resolvedRaceDate = raceDate || schedule.raceDate;
    const resolvedPlanName = planName || schedule.originalPlan?.name || 'Training Plan';
    const resolvedPlanType = planType || schedule.originalPlan?.type || 'Race';

    const jumpToDay = (dayIndex: number) => {
        // Day rows carry ids of the form `week-{w}-day-{d}` (see WeekCard).
        const el = document.getElementById(`week-${ctx.weekIndex}-day-${dayIndex}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            onJump?.();
        }
    };

    return (
        <section
            aria-label="This week"
            className="bg-card border border-rule transition-colors shadow-sm"
        >
            {/* Quiet meta line: which plan, how long, how big */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-2 bg-paper/60 border-b border-rule">
                <div className="flex items-center gap-2 truncate">
                    <h2 className="text-xs text-ink truncate" title={resolvedPlanName} data-testid="today-plan-name">
                        {resolvedPlanName.includes(':') ? resolvedPlanName.slice(resolvedPlanName.indexOf(':') + 1).trim() : resolvedPlanName}
                    </h2>
                </div>
                <div className="text-xs text-pencil shrink-0">
                    {totalWeeks} weeks{peakVolume !== undefined && peakVolume > 0 ? ` · peak ${peakVolume} ${units}` : ''} · {resolvedPlanType}
                </div>
            </div>

            <div className="p-4 sm:p-5">
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <h3 className="font-data text-[10px] uppercase tracking-[0.18em] text-pencil">
                        This week{ctx.currentWeekNumber !== null ? ` · Week ${String(ctx.currentWeekNumber).padStart(2, '0')} of ${totalWeeks}` : ''}
                    </h3>
                    {onJump && (
                        <button
                            onClick={onJump}
                            className="font-data text-xs underline underline-offset-4 text-pencil hover:text-marker"
                        >
                            Jump to current week ↓
                        </button>
                    )}
                </div>

                {week && (
                    <ol className="grid grid-cols-7 gap-1 mt-3" aria-label="This week's workouts">
                        {week.workouts.map((day, dayIndex) => {
                            const isToday = ctx.dayIndex === dayIndex;
                            const dayDist = formatFullDistance(day.distance, units) ?? 'no distance set';
                            const title = cleanPlanTitle(day.title);
                            return (
                                <li key={dayIndex}>
                                    <button
                                        onClick={() => jumpToDay(dayIndex)}
                                        aria-label={`${format(day.date, 'EEEE, MMM d')} — ${title}, ${dayDist}`}
                                        aria-current={isToday ? 'date' : undefined}
                                        title={`${title} · ${dayDist}`}
                                        className="w-full text-center border border-rule bg-paper py-2 px-1 relative transition-colors hover:border-pencil/60"
                                    >
                                        <span className="block font-data text-[10px] uppercase text-ink/60">
                                            {format(day.date, 'EEE')}
                                        </span>
                                        <span className="relative inline-block mt-1">
                                            {isToday && (
                                                <span aria-hidden="true" className="pen-circle pointer-events-none absolute -inset-1" />
                                            )}
                                            <span className={`font-data font-bold text-sm ${isToday ? 'text-marker' : 'text-ink'}`}>
                                                {ribbonDistance(day.distance, units) ?? '–'}
                                            </span>
                                        </span>
                                        <span className="block font-data text-[10px] text-ink/60 truncate mt-0.5 px-0.5">
                                            {ribbonLabel(title)}
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                    </ol>
                )}

                <p className="text-xs text-pencil mt-3">
                    Today: <strong className="text-ink">{todayLabel}</strong>
                    {' · '}
                    {ctx.daysToRace === 0 ? (
                        <span className="text-marker font-bold">Race day — good luck</span>
                    ) : (
                        <span>{ctx.daysToRace} days to race{resolvedRaceDate ? ` (${format(resolvedRaceDate, 'EEE, MMM d')})` : ''}</span>
                    )}
                    {' · '}
                    <span>{ctx.elapsedPct}% of plan done</span>
                </p>
            </div>
        </section>
    );
};
