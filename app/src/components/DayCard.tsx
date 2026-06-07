import type { RenderedWorkout, Distance } from '../types';
import clsx from 'clsx';
import { formatPlanLabel, formatPaceRange } from '../lib/formatters';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getPaceZone, type TrainingPaces } from '../lib/paceCalculator';
import { KM_PER_MILE } from '../lib/constants';

const convert = (val: number, toMetric: boolean) => {
    if (toMetric) return Math.round(val * KM_PER_MILE * 10) / 10;
    return val;
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

interface DayCardProps {
    workout: RenderedWorkout;
    units: 'mi' | 'km';
    id?: string;
    paces?: TrainingPaces;
    // Optional overrides for DragOverlay when not fully hydrated
    date?: Date;
    isRaceDay?: boolean;
    isOver?: boolean;
    isActive?: boolean;
}

export const DayCard = ({ workout, units, id, date, paces, isOver, isActive }: DayCardProps) => {
    // If id is provided, we hook into useSortable. If not (e.g. DragOverlay), we just render.
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: id || '' }); // fallback empty string if no id (shouldn't happen for active items)

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        zIndex: isDragging ? 10 : undefined,
        touchAction: isDragging ? 'none' : 'auto',
    };

    const isRest = workout.tags?.includes('Rest') || workout.title.toLowerCase().includes('rest');
    const isRace = workout.tags?.includes('Race');
    const isLongRun = workout.tags?.includes('Long Run');

    const displayDate = date || workout.date;
    const today = new Date();
    const isToday = today.toDateString() === new Date(displayDate).toDateString();

    const displayTitle = formatPlanLabel(workout.title, units);

    // Pace Calculation Logic
    const zone = getPaceZone(workout.title, workout.tags);
    const paceRange = (paces && zone) ? paces[zone] : null;

    const paceString = (paceRange && zone === 'Recovery')
        ? `> ${formatPaceRange({ min: paceRange.min, max: paceRange.min }, units, false)}`
        : paceRange ? formatPaceRange(paceRange, units, false) : null;

    // If no ID is passed, this is likely the DragOverlay copy, so we render a "clean" div without ref/listeners
    const wrapperProps = id ? { ref: setNodeRef, style, ...attributes, ...listeners } : {};

    return (
        <div
            {...wrapperProps}
            className={clsx(
                "relative p-3 sm:p-4 rounded-xl border transition-all hover:shadow-lg group min-h-0 sm:min-h-[140px] flex flex-col select-none",
                isRest
                    ? "bg-slate-900/30 border-slate-800/50 text-slate-500"
                    : "bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60 text-slate-200",
                isRace && "border-rose-500/50 bg-rose-500/10 hover:bg-rose-500/20 ring-1 ring-rose-500/20",
                isLongRun && "border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10",
                isToday && "border-indigo-500 bg-slate-850 ring-2 ring-indigo-500/30 scale-[1.01] hover:scale-[1.03] shadow-xl shadow-indigo-950/40 z-10 text-white",
                isOver && !isActive && "ring-2 ring-indigo-500 bg-slate-800/80 scale-[1.02] shadow-2xl z-10 border-indigo-500/50",
                isActive && "opacity-20 grayscale-[0.5]"
            )}
        >
            {isToday && (
                <span className="absolute -top-2.5 left-3 px-2 py-0.5 bg-indigo-500 text-white font-extrabold text-[8px] rounded shadow-md tracking-wider animate-pulse z-20">
                    TODAY
                </span>
            )}

            {/* Date Header */}
            <div className="flex justify-between items-start mb-3">
                <div className="text-xs font-semibold uppercase tracking-wider opacity-60 flex items-center gap-1.5">
                    {new Date(displayDate).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
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
                {paceString && (
                    <div className={clsx(
                        "mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-tight border shadow-sm",
                        zone === 'Marathon' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                        zone === 'Lactate Threshold' && "bg-orange-500/10 text-orange-400 border-orange-500/20",
                        zone === 'VO2 Max' && "bg-rose-500/10 text-rose-400 border-rose-500/20",
                        zone === 'Long Run' && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                        zone === 'General Aerobic' && "bg-slate-700/30 text-slate-300 border-slate-600/30",
                        zone === 'Recovery' && "bg-slate-800/50 text-slate-400 border-slate-700/30"
                    )}>
                        <span className="opacity-70">🎯</span> {paceString}/{units}
                    </div>
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
