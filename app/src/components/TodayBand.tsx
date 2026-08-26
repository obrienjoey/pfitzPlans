import { format } from 'date-fns';
import type { RenderedPlan } from '../types';
import type { Distance } from '../types';
import type { TrainingPaces, PaceZone } from '../lib/paceCalculator';
import { getPaceZone } from '../lib/paceCalculator';
import { formatPaceRange } from '../lib/formatters';
import { getTodayContext } from '../lib/todayContext';
import { formatPlanLabel } from '../lib/formatters';
import { KM_PER_MILE } from '../lib/constants';
import { zoneColor } from '../lib/zoneColors';

const convert = (val: number, toMetric: boolean) =>
    toMetric ? Math.round(val * KM_PER_MILE * 10) / 10 : val;

const formatDistance = (dist: Distance, units: 'mi' | 'km'): string => {
    const metric = units === 'km';
    if (typeof dist === 'number') return `${convert(dist, metric)} ${units}`;
    return `${convert(dist[0], metric)}–${convert(dist[1], metric)} ${units}`;
};

/**
 * The page's signature element — today as a log-page entry. Opens the plan view:
 * what you're running today, and how long until the race. Optionally clickable,
 * scrolling to today's workout in the calendar.
 */
export const TodayBand = ({
    schedule,
    units,
    paces,
    onJump,
}: {
    schedule: RenderedPlan;
    units: 'mi' | 'km';
    paces?: TrainingPaces;
    onJump?: () => void;
}) => {
    const ctx = getTodayContext(schedule);

    // The band has no meaning once the race is behind you.
    if (ctx.daysToRace < 0) return null;

    const workout = ctx.workout;
    const isRaceDay = ctx.daysToRace === 0;
    const isRest =
        !workout || workout.tags?.includes('Rest') || workout.title.toLowerCase().includes('rest');
    const zone = workout ? getPaceZone(workout.title, workout.tags, workout.zone as PaceZone) : null;
    const paceRange = zone && paces ? paces[zone] : null;

    const distanceLabel = workout?.distance ? formatDistance(workout.distance, units) : null;

    return (
        <section
            className={`bg-card border border-rule relative flex items-stretch min-h-[92px] ${
                onJump
                    ? 'cursor-pointer w-full text-left hover:bg-marker/5 transition-colors'
                    : ''
            }`}
            onClick={onJump}
            onKeyDown={
                onJump
                    ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              onJump();
                          }
                      }
                    : undefined
            }
            role={onJump ? 'button' : undefined}
            tabIndex={onJump ? 0 : undefined}
            aria-label={onJump ? "Jump to today's workout" : undefined}
        >
            {/* The log entry */}
            <div className="flex-1 min-w-0 px-5 sm:px-7 py-4 flex flex-col justify-center gap-1">
                <div className="flex items-center gap-3 flex-wrap">
                    <span className="pen-circle text-marker font-data text-[10px] font-bold uppercase tracking-[0.18em] px-2.5 py-1">
                        Today
                    </span>
                    <span className="font-data text-[11px] uppercase tracking-[0.14em] text-pencil">
                        {format(new Date(), 'EEE d MMM')}
                        {ctx.currentWeekNumber !== null && ` · week ${ctx.currentWeekNumber}`}
                    </span>
                </div>

                {isRest ? (
                    <p className="font-display text-pencil uppercase text-xl sm:text-2xl leading-none">
                        No workout scheduled today
                    </p>
                ) : (
                    <p className="font-display text-ink uppercase text-2xl sm:text-3xl leading-none">
                        {formatPlanLabel(workout!.title, units)}
                    </p>
                )}

                <div className="flex items-center gap-3 flex-wrap">
                    {distanceLabel && (
                        <span className="font-data text-ink font-bold text-sm">{distanceLabel}</span>
                    )}
                    {paceRange && zone && (
                        <span
                            className="font-data text-xs whitespace-nowrap"
                            style={{ color: zoneColor(zone) ?? 'var(--pencil)' }}
                        >
                            {zone === 'Recovery'
                                ? `> ${formatPaceRange({ min: paceRange.min, max: paceRange.min }, units)}`
                                : formatPaceRange(paceRange, units)}
                            <span className="text-pencil">/{units}</span>
                        </span>
                    )}
                    {workout?.description && (
                        <span className="text-pencil text-xs hidden md:inline truncate max-w-[320px]">
                            {formatPlanLabel(workout.description, units)}
                        </span>
                    )}
                </div>
            </div>

            {/* Countdown block */}
            <div
                className={`flex-none flex flex-col items-center justify-center px-5 sm:px-7 border-l border-rule ${
                    isRaceDay ? 'bg-marker/10' : ''
                }`}
            >
                <span className="font-data text-[10px] uppercase tracking-[0.2em] text-pencil mb-0.5">
                    {isRaceDay ? 'Race day' : 'To race'}
                </span>
                <span
                    className={`font-display leading-none font-bold ${
                        isRaceDay ? 'text-marker' : 'text-ink'
                    } text-4xl sm:text-5xl`}
                >
                    {isRaceDay ? 'RACE' : `T−${ctx.daysToRace}`}
                </span>
                <span className="font-data text-[10px] text-pencil mt-1">{ctx.elapsedPct}% done</span>
            </div>
        </section>
    );
};
