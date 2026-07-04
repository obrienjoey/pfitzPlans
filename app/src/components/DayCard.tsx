import { useState, useEffect } from 'react';
import type { RenderedWorkout, Distance } from '../types';
import clsx from 'clsx';
import { formatPlanLabel, formatPaceRange } from '../lib/formatters';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getPaceZone, type TrainingPaces } from '../lib/paceCalculator';
import { KM_PER_MILE } from '../lib/constants';
import { usePlanStore, type WorkoutStatus } from '../store/usePlanStore';

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
    weekIndex?: number;
    dayIndex?: number;
}

interface DayCardContentProps extends DayCardProps {
    setNodeRef?: (node: HTMLElement | null) => void;
    style?: React.CSSProperties;
    attributes?: any;
    listeners?: any;
}

const DayCardContent = ({
    workout,
    units,
    id,
    date,
    paces,
    isOver,
    isActive,
    weekIndex,
    dayIndex,
    setNodeRef,
    style,
    attributes,
    listeners
}: DayCardContentProps) => {

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

    // Retrieve workout completion status from the store
    const status = usePlanStore(state => {
        if (weekIndex === undefined || dayIndex === undefined) return 'none';
        const key = `${state.selectedPlanId}-w${weekIndex}-d${dayIndex}`;
        return state.workoutLogs[key] || 'none';
    });
    const setWorkoutStatus = usePlanStore(state => state.setWorkoutStatus);

    const [menuOpen, setMenuOpen] = useState(false);

    // Close menu when clicking outside
    useEffect(() => {
        if (!menuOpen) return;
        const handleOutsideClick = () => {
            setMenuOpen(false);
        };
        document.addEventListener('click', handleOutsideClick);
        return () => document.removeEventListener('click', handleOutsideClick);
    }, [menuOpen]);

    const toggleMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setMenuOpen(!menuOpen);
    };

    const selectStatus = (newStatus: WorkoutStatus, e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (weekIndex !== undefined && dayIndex !== undefined) {
            setWorkoutStatus(weekIndex, dayIndex, newStatus);
        }
        setMenuOpen(false);
    };

    const renderStatusTrigger = () => {
        if (weekIndex === undefined || dayIndex === undefined) return null;

        let icon = null;
        let btnClass = "w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none";

        if (status === 'completed') {
            icon = <span className="text-[10px] font-black">✓</span>;
            btnClass += " bg-emerald-500 text-slate-950 font-extrabold shadow-sm shadow-emerald-500/20";
        } else if (status === 'skipped') {
            icon = <span className="text-[10px] font-black">✗</span>;
            btnClass += " bg-slate-700 text-slate-350 font-extrabold";
        } else if (status === 'modified') {
            icon = <span className="text-[10px] font-black">✎</span>;
            btnClass += " bg-amber-500 text-slate-950 font-extrabold shadow-sm shadow-amber-500/20";
        } else {
            icon = <span className="opacity-0 group-hover/status:opacity-100 text-[10px] text-slate-400 transition-opacity">✓</span>;
            btnClass += " border border-slate-700 hover:border-slate-500 bg-slate-950/50 group/status";
        }

        return (
            <div className="relative shrink-0">
                <button
                    onClick={toggleMenu}
                    onMouseDown={(e) => e.stopPropagation()}
                    className={btnClass}
                    title="Mark workout status"
                    aria-haspopup="true"
                    aria-expanded={menuOpen}
                >
                    {icon}
                </button>
                {menuOpen && (
                    <div
                        onMouseDown={(e) => e.stopPropagation()}
                        className="absolute right-0 top-6 z-30 w-32 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-1 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100"
                    >
                        <button
                            onClick={(e) => selectStatus('completed', e)}
                            onMouseDown={(e) => e.stopPropagation()}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-emerald-400 hover:bg-emerald-500/10 flex items-center gap-1.5 transition-colors"
                        >
                            <span>✓</span> Completed
                        </button>
                        <button
                            onClick={(e) => selectStatus('modified', e)}
                            onMouseDown={(e) => e.stopPropagation()}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-amber-400 hover:bg-amber-500/10 flex items-center gap-1.5 transition-colors"
                        >
                            <span>✎</span> Modified
                        </button>
                        <button
                            onClick={(e) => selectStatus('skipped', e)}
                            onMouseDown={(e) => e.stopPropagation()}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-slate-400 hover:bg-slate-750 flex items-center gap-1.5 transition-colors"
                        >
                            <span>✗</span> Skipped
                        </button>
                        {status !== 'none' && (
                            <button
                                onClick={(e) => selectStatus('none', e)}
                                onMouseDown={(e) => e.stopPropagation()}
                                className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-rose-400 hover:bg-rose-500/10 border-t border-slate-800/80 mt-0.5 pt-1.5 flex items-center gap-1.5 transition-colors"
                            >
                                <span>↺</span> Clear Status
                            </button>
                        )}
                    </div>
                )}
            </div>
        );
    };

    // If setNodeRef is passed, we bind the drag-and-drop properties
    const wrapperProps = setNodeRef ? { ref: setNodeRef, style, ...attributes, ...listeners } : {};

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
                
                // Status styles
                status === 'completed' && "border-emerald-500/40 bg-emerald-950/10 hover:bg-emerald-950/20",
                status === 'modified' && "border-amber-500/40 bg-amber-950/10 hover:bg-amber-950/20",
                status === 'skipped' && "opacity-45 hover:opacity-60",

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
                <div className="flex items-center gap-1.5">
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
                    {renderStatusTrigger()}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1">
                <h4 className={clsx("font-semibold mb-1 leading-snug", isRest ? "text-slate-500" : "text-white", status === 'skipped' && "line-through opacity-60")}>
                    {displayTitle}
                </h4>
                {workout.description && (
                    <p className={clsx("text-sm text-slate-400 group-hover:text-slate-300 transition-colors leading-relaxed", status === 'skipped' && "line-through opacity-60")}>
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

const DraggableDayCard = (props: DayCardProps & { id: string }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: props.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        zIndex: isDragging ? 10 : undefined,
        touchAction: isDragging ? 'none' : 'auto',
    };

    return (
        <DayCardContent
            {...props}
            setNodeRef={setNodeRef}
            style={style}
            attributes={attributes}
            listeners={listeners}
        />
    );
};

export const DayCard = (props: DayCardProps) => {
    if (props.id) {
        return <DraggableDayCard {...props} id={props.id} />;
    }
    return <DayCardContent {...props} />;
};
