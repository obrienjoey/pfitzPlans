import type { RenderedWorkout, Distance } from '../types';
import clsx from 'clsx';
import { formatPlanLabel } from '../lib/formatters';

const KM_PER_MILE = 1.60934;

const convert = (val: number, toMetric: boolean) => {
    if (toMetric) return Math.round(val * KM_PER_MILE * 10) / 10;
    return val; // Assuming source is miles for now, as per Pfitz plans
};

const formatDistance = (dist?: Distance, units: 'mi' | 'km' = 'mi') => {
    if (dist === undefined) return null;

    const isMetric = units === 'km';
    const label = units;

    if (typeof dist === 'number') {
        return `${convert(dist, isMetric)} ${label}`;
    }
    return `${convert(dist[0], isMetric)}–${convert(dist[1], isMetric)} ${label}`;
};

export const DayCard = ({ workout, units }: { workout: RenderedWorkout; units: 'mi' | 'km' }) => {
    const isRest = workout.tags?.includes('Rest') || workout.title.toLowerCase().includes('rest');
    const isRace = workout.tags?.includes('Race');
    const isLongRun = workout.tags?.includes('Long Run');

    // Clean the title based on units
    const displayTitle = formatPlanLabel(workout.title, units);

    return (
        <div className={clsx(
            "relative p-4 rounded-xl border transition-all hover:shadow-lg group min-h-[140px] flex flex-col",
            isRest
                ? "bg-slate-900/30 border-slate-800/50 text-slate-500"
                : "bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60 text-slate-200",
            isRace && "border-rose-500/50 bg-rose-500/10 hover:bg-rose-500/20 ring-1 ring-rose-500/20",
            isLongRun && "border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10"
        )}>
            {/* Date Header */}
            <div className="flex justify-between items-start mb-3">
                <div className="text-xs font-semibold uppercase tracking-wider opacity-60">
                    {workout.date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
                {workout.distance && (
                    <div className={clsx(
                        "text-sm font-bold font-mono px-2 py-0.5 rounded",
                        isRest ? "bg-slate-800" : "bg-slate-700 text-white",
                        isRace && "bg-rose-500 text-white",
                        isLongRun && "bg-amber-500/20 text-amber-200"
                    )}>
                        {formatDistance(workout.distance, units)}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1">
                <h4 className={clsx("font-semibold mb-1 leading-snug", isRest ? "text-slate-500" : "text-white")}>
                    {displayTitle}
                </h4>
                {workout.description && (
                    <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors leading-relaxed">
                        {formatPlanLabel(workout.description, units)}
                    </p>
                )}
            </div>

            {/* Tags */}
            {workout.tags && workout.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                    {workout.tags.map(tag => (
                        <span key={tag} className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400 border border-slate-600/30">
                            {tag}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};
