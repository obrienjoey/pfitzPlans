import type { RenderedWorkout, Distance } from '../types';
import clsx from 'clsx';
import { formatPlanLabel } from '../lib/formatters';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getPaceZone, formatTime, type Paces } from '../lib/paceCalculator';

const KM_PER_MILE = 1.60934;

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

const KM_TO_MILE = 1.60934;

interface DayCardProps {
    workout: RenderedWorkout;
    units: 'mi' | 'km';
    id?: string;
    paces?: Paces;
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
    };

    const isRest = workout.tags?.includes('Rest') || workout.title.toLowerCase().includes('rest');
    const isRace = workout.tags?.includes('Race');
    const isLongRun = workout.tags?.includes('Long Run');

    const displayDate = date || workout.date;

    const displayTitle = formatPlanLabel(workout.title, units);

    // Pace Calculation Logic
    const zone = getPaceZone(workout.title, workout.tags);
    const paceRange = (paces && zone) ? paces[zone] : null;

    const formatPaceRange = (range: { min: number, max: number }) => {
        if (units === 'km') {
            if (range.min === range.max) return formatTime(range.min);
            return `${formatTime(range.min)}-${formatTime(range.max)}`;
        }
        const minMile = range.min * KM_TO_MILE;
        const maxMile = range.max * KM_TO_MILE;
        if (range.min === range.max) return formatTime(minMile);
        return `${formatTime(minMile)}-${formatTime(maxMile)}`;
    };

    const paceString = paceRange ? formatPaceRange(paceRange) : null;

    // If no ID is passed, this is likely the DragOverlay copy, so we render a "clean" div without ref/listeners
    const wrapperProps = id ? { ref: setNodeRef, style, ...attributes, ...listeners } : {};

    return (
        <div
            {...wrapperProps}
            className={clsx(
                "relative p-3 sm:p-4 rounded-xl border transition-all hover:shadow-lg group min-h-0 sm:min-h-[140px] flex flex-col select-none touch-none", // touch-none is key for mobile DnD
                isRest
                    ? "bg-slate-900/30 border-slate-800/50 text-slate-500"
                    : "bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60 text-slate-200",
                isRace && "border-rose-500/50 bg-rose-500/10 hover:bg-rose-500/20 ring-1 ring-rose-500/20",
                isLongRun && "border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10",
                isOver && !isActive && "ring-2 ring-indigo-500 bg-slate-800/80 scale-[1.02] shadow-2xl z-10 border-indigo-500/50",
                isActive && "opacity-20 grayscale-[0.5]"
            )}
        >
            {/* Drag Handle (visible on hover or always?) - simpler to make whole card draggable for now */}

            {/* Date Header */}
            <div className="flex justify-between items-start mb-3">
                <div className="text-xs font-semibold uppercase tracking-wider opacity-60">
                    {new Date(displayDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
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
