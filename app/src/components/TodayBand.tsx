import { format } from 'date-fns';
import type { RenderedPlan, Distance } from '../types';
import type { TrainingPaces, PaceZone } from '../lib/paceCalculator';
import { getPaceZone } from '../lib/paceCalculator';
import { formatPaceRange, cleanPlanTitle, formatPlanLabel } from '../lib/formatters';
import { getTodayContext } from '../lib/todayContext';
import { KM_PER_MILE } from '../lib/constants';
import { zoneColor } from '../lib/zoneColors';

interface TodayBandProps {
    schedule: RenderedPlan;
    raceDate?: Date | null;
    planName?: string;
    planSource?: string;
    planType?: string;
    units: 'mi' | 'km';
    paces?: TrainingPaces;
    peakVolume?: number;
    onJump?: () => void;
}

const convert = (val: number, toMetric: boolean) =>
    toMetric ? Math.round(val * KM_PER_MILE * 10) / 10 : val;

const formatDistance = (dist: Distance, units: 'mi' | 'km'): string => {
    const metric = units === 'km';
    if (typeof dist === 'number') return `${convert(dist, metric)} ${units}`;
    return `${convert(dist[0], metric)}–${convert(dist[1], metric)} ${units}`;
};

/**
 * The Command Center & Today's Telemetry HUD
 * Unified high-density 3-bay console showing:
 * 1. Today's workout assignment & pace split targets
 * 2. Training cycle phase & mileage progress
 * 3. Goal race countdown & target horizon
 */
export const TodayBand = ({
    schedule,
    raceDate,
    planName,
    planSource,
    planType,
    units,
    paces,
    peakVolume,
    onJump,
}: TodayBandProps) => {
    const ctx = getTodayContext(schedule);

    // The band has no meaning once the race is behind you
    if (ctx.daysToRace < 0) return null;

    const workout = ctx.workout;
    const isRaceDay = ctx.daysToRace === 0;
    const isRest = !workout || workout.tags?.includes('Rest') || workout.title.toLowerCase().includes('rest');
    const zone = workout ? getPaceZone(workout.title, workout.tags, workout.zone as PaceZone) : null;
    const paceRange = zone && paces ? paces[zone] : null;
    const zc = zoneColor(zone);
    const distanceLabel = workout?.distance ? formatDistance(workout.distance, units) : null;

    const currentWeekNumber = ctx.currentWeekNumber ?? (ctx.weekIndex >= 0 ? ctx.weekIndex + 1 : 1);
    const totalWeeks = schedule.weeks.length;
    const resolvedRaceDate = raceDate || schedule.raceDate;
    const resolvedPlanName = planName || schedule.originalPlan?.name || 'Training Plan';
    const resolvedPlanType = planType || schedule.originalPlan?.type || 'Race';

    return (
        <section
            aria-label="Training Command Center"
            className="bg-card border border-rule transition-colors shadow-sm"
        >
            {/* Masthead Eyebrow */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-2 bg-paper/60 border-b border-rule font-data text-[10px] uppercase tracking-[0.16em] text-pencil">
                <div className="flex items-center gap-2 truncate">
                    <span className="font-bold text-ink truncate">{resolvedPlanName}</span>
                    {planSource && <span className="hidden sm:inline text-pencil/70 truncate">· {planSource}</span>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <span>{totalWeeks} WEEKS</span>
                    {peakVolume !== undefined && peakVolume > 0 && (
                        <>
                            <span className="text-pencil/40">/</span>
                            <span>PEAK {peakVolume} {units}</span>
                        </>
                    )}
                    <span className="text-pencil/40">/</span>
                    <span className="text-marker font-bold">{resolvedPlanType}</span>
                </div>
            </div>

            {/* 3-Bay Cockpit Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-rule">
                {/* Bay 1: Today's Assignment (5 cols) */}
                <div
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
                    className={`md:col-span-5 p-4 sm:p-5 flex flex-col justify-between gap-3 text-left transition-colors ${
                        onJump ? 'cursor-pointer hover:bg-ink/[0.015]' : ''
                    }`}
                    role={onJump ? 'button' : undefined}
                    tabIndex={onJump ? 0 : undefined}
                    aria-label={onJump ? "Jump to today's workout in schedule" : "Today's workout"}
                >
                    <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                            <span className="font-data text-[10px] uppercase font-bold tracking-[0.18em] text-marker flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-marker animate-pulse" />
                                <span>TODAY · {format(new Date(), 'EEEE, MMM d')}</span>
                            </span>
                            {onJump && (
                                <span className="font-data text-[10px] text-pencil hover:text-marker hidden sm:inline">
                                    [View in schedule →]
                                </span>
                            )}
                        </div>

                        <h3 className="font-display font-bold uppercase text-2xl sm:text-3xl text-ink leading-tight">
                            {isRest ? 'No workout scheduled today' : cleanPlanTitle(workout!.title)}
                        </h3>

                        {workout?.description && !isRest && (
                            <p className="text-xs text-pencil mt-1 max-w-md line-clamp-2">
                                {formatPlanLabel(workout.description, units)}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap pt-1">
                        {distanceLabel && !isRest && (
                            <span className="font-data font-bold text-sm text-ink bg-paper border border-rule px-2.5 py-1">
                                {distanceLabel}
                            </span>
                        )}
                        {paceRange && zone && !isRest && (
                            <span
                                className="font-data text-xs font-semibold px-2.5 py-1 bg-paper border text-ink flex items-center gap-1.5"
                                style={{ borderLeft: `3px solid ${zc ?? 'var(--pencil)'}` }}
                            >
                                <span
                                    className="w-1.5 h-1.5 rounded-full shrink-0"
                                    style={{ backgroundColor: zc ?? 'var(--pencil)' }}
                                />
                                <span>
                                    {zone === 'Recovery'
                                        ? `> ${formatPaceRange({ min: paceRange.min, max: paceRange.min }, units)}`
                                        : formatPaceRange(paceRange, units)}
                                </span>
                                <span className="text-pencil text-[10px]">/{units}</span>
                                <span className="text-pencil text-[10px] uppercase ml-0.5">({zone})</span>
                            </span>
                        )}
                    </div>
                </div>

                {/* Bay 2: Microcycle Progress (4 cols) */}
                <div className="md:col-span-4 p-4 sm:p-5 bg-paper/30 flex flex-col justify-between gap-3 text-left">
                    <div>
                        <div className="font-data text-[10px] uppercase font-bold tracking-[0.18em] text-pencil mb-1">
                            CYCLE STATUS
                        </div>
                        <div className="flex items-baseline justify-between gap-2">
                            <span className="font-display font-bold text-2xl sm:text-3xl text-ink uppercase leading-none">
                                Week {String(currentWeekNumber).padStart(2, '0')}
                                <span className="text-pencil font-normal text-base"> / {totalWeeks}</span>
                            </span>
                            <span className="font-data text-xs font-bold text-marker">
                                {ctx.elapsedPct}% done
                            </span>
                        </div>
                    </div>

                    {/* Segmented Progress Bar */}
                    <div>
                        <div className="w-full bg-paper border border-rule h-2 relative overflow-hidden flex">
                            <div
                                className="bg-marker h-full transition-all duration-300"
                                style={{ width: `${Math.max(2, Math.min(100, ctx.elapsedPct))}%` }}
                            />
                        </div>
                        <div className="flex justify-between font-data text-[9px] text-pencil mt-1 uppercase tracking-wider">
                            <span>Base Build</span>
                            {peakVolume !== undefined && peakVolume > 0 ? (
                                <span>Peak ({peakVolume} {units})</span>
                            ) : (
                                <span>Peak</span>
                            )}
                            <span>Taper</span>
                        </div>
                    </div>
                </div>

                {/* Bay 3: Race Target & Horizon (3 cols) */}
                <div className="md:col-span-3 p-4 sm:p-5 flex flex-col justify-between text-left sm:text-center md:text-left">
                    <div>
                        <div className="font-data text-[10px] uppercase font-bold tracking-[0.18em] text-pencil mb-1">
                            GOAL RACE
                        </div>
                        <div className="font-display font-bold uppercase text-3xl sm:text-4xl text-ink leading-none">
                            {isRaceDay ? (
                                <span className="text-marker">RACE DAY</span>
                            ) : (
                                <span>T−{ctx.daysToRace}</span>
                            )}
                        </div>
                    </div>

                    <div className="pt-2 border-t border-rule/60 font-data text-xs">
                        <div className="font-bold text-ink truncate">
                            {resolvedRaceDate && format(resolvedRaceDate, 'MMM d, yyyy')}
                        </div>
                        <div className="text-pencil text-[10px] uppercase tracking-wider truncate">
                            {resolvedRaceDate && format(resolvedRaceDate, 'EEEE')}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
