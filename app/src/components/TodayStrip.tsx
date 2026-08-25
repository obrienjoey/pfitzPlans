import { format } from 'date-fns';
import type { RenderedPlan } from '../types';
import type { Distance } from '../types';
import { KM_PER_MILE } from '../lib/constants';
import { getTodayContext } from '../lib/todayContext';

const convert = (val: number, toMetric: boolean) => {
    if (toMetric) return Math.round(val * KM_PER_MILE * 10) / 10;
    return val;
};

const formatDistance = (dist: Distance, units: 'mi' | 'km' = 'mi') => {
    const isMetric = units === 'km';
    if (typeof dist === 'number') return `${convert(dist, isMetric)} ${units}`;
    return `${convert(dist[0], isMetric)}–${convert(dist[1], isMetric)} ${units}`;
};

export const TodayStrip = ({ schedule, units }: { schedule: RenderedPlan; units: 'mi' | 'km' }) => {
    const ctx = getTodayContext(schedule);

    // The strip has no meaning once the race is behind you.
    if (ctx.daysToRace < 0) return null;

    const clickable = ctx.weekIndex >= 0 && ctx.dayIndex >= 0;

    const jumpToToday = () => {
        if (!clickable) return;
        document
            .getElementById(`week-${ctx.weekIndex}-day-${ctx.dayIndex}`)
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const distanceLabel =
        ctx.workout?.distance != null ? formatDistance(ctx.workout.distance, units) : null;

    return (
        <div className="sticky top-[68px] z-40 mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <button
                onClick={jumpToToday}
                disabled={!clickable}
                aria-label={clickable ? "Jump to today's workout" : undefined}
                className={
                    'w-full flex items-center gap-3 sm:gap-4 px-4 py-2.5 rounded-xl border shadow-lg text-left transition-all ' +
                    'bg-indigo-950/95 dark:bg-indigo-950/90 border-indigo-500/30 backdrop-blur-sm shadow-indigo-950/20 ' +
                    (clickable
                        ? 'cursor-pointer hover:border-indigo-400/50 hover:shadow-indigo-500/10'
                        : 'cursor-default')
                }
            >
                {/* Today block */}
                <div className="flex-none min-w-0">
                    <div className="text-[10px] font-black uppercase tracking-widest text-indigo-300/80">
                        Today · {format(new Date(), 'EEE d MMM')}
                    </div>
                    <div className="text-sm font-bold text-white truncate max-w-[180px] sm:max-w-xs">
                        {ctx.workout?.title ?? 'No workout scheduled today'}
                        {distanceLabel && (
                            <span className="ml-2 font-mono font-semibold text-indigo-200">
                                {distanceLabel}
                            </span>
                        )}
                    </div>
                </div>

                {/* Progress rail */}
                <div className="flex-1 hidden sm:block">
                    <div className="h-1.5 w-full rounded-full bg-indigo-900/80 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-rose-400"
                            style={{ width: `${ctx.elapsedPct}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-1 text-[9px] font-bold uppercase tracking-wider text-indigo-300/60">
                        <span>{ctx.elapsedPct}% done</span>
                        <span>race</span>
                    </div>
                </div>

                {/* T-minus pill */}
                <div
                    className={
                        'flex-none px-3 py-1.5 rounded-lg font-black tabular-nums text-lg leading-none ' +
                        (ctx.daysToRace === 0
                            ? 'bg-rose-500 text-white animate-pulse'
                            : 'bg-indigo-500/20 text-indigo-100 border border-indigo-400/30')
                    }
                >
                    {ctx.daysToRace === 0 ? 'RACE DAY' : `T−${ctx.daysToRace}`}
                </div>
            </button>
        </div>
    );
};
