import { useState, useEffect } from 'react';
import type { RenderedWorkout, Distance } from '../types';
import clsx from 'clsx';
import { formatPlanLabel, formatPaceRange } from '../lib/formatters';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getPaceZone, type TrainingPaces, type PaceZone } from '../lib/paceCalculator';
import { KM_PER_MILE } from '../lib/constants';
import { zoneColor } from '../lib/zoneColors';
import { usePlanStore, type WorkoutStatus } from '../store/usePlanStore';

const convert = (val: number, toMetric: boolean) => {
    if (toMetric) return Math.round(val * KM_PER_MILE * 10) / 10;
    return val;
};

const formatDistance = (dist?: Distance, units: 'mi' | 'km' = 'mi') => {
    if (dist === undefined) return null;
    const isMetric = units === 'km';
    if (typeof dist === 'number') {
        return `${convert(dist, isMetric)} ${units}`;
    }
    return `${convert(dist[0], isMetric)}–${convert(dist[1], isMetric)} ${units}`;
};

const GripIcon = () => (
    <svg viewBox="0 0 10 16" fill="currentColor" className="w-3 h-4" aria-hidden="true">
        <circle cx="2.5" cy="2.5" r="1.4" />
        <circle cx="7.5" cy="2.5" r="1.4" />
        <circle cx="2.5" cy="8" r="1.4" />
        <circle cx="7.5" cy="8" r="1.4" />
        <circle cx="2.5" cy="13.5" r="1.4" />
        <circle cx="7.5" cy="13.5" r="1.4" />
    </svg>
);

export interface DayCardProps {
    workout: RenderedWorkout;
    units: 'mi' | 'km';
    id?: string;
    paces?: TrainingPaces;
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    attributes?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    isRaceDay,
    weekIndex,
    dayIndex,
    setNodeRef,
    style,
    attributes,
    listeners
}: DayCardContentProps) => {
    const isRest = workout.tags?.includes('Rest') || workout.title.toLowerCase().includes('rest');
    const isRace = workout.tags?.includes('Race') || workout.title.toLowerCase().includes('goal race');
    const displayDate = date || workout.date;
    const today = new Date();
    const isToday = today.toDateString() === new Date(displayDate).toDateString();
    const isRaceDayCard = isRace || isRaceDay === true;
    const displayTitle = formatPlanLabel(workout.title, units);

    const zone = getPaceZone(workout.title, workout.tags, workout.zone as PaceZone);
    const paceRange = (paces && zone) ? paces[zone] : null;
    const zc = zoneColor(zone);

    const paceString = (paceRange && zone === 'Recovery')
        ? `> ${formatPaceRange({ min: paceRange.min, max: paceRange.min }, units, false)}`
        : paceRange ? formatPaceRange(paceRange, units, false) : null;

    const status = usePlanStore(state => {
        if (weekIndex === undefined || dayIndex === undefined) return 'none';
        const key = `${state.selectedPlanId}-w${weekIndex}-d${dayIndex}`;
        return state.workoutLogs[key] || 'none';
    });
    const setWorkoutStatus = usePlanStore(state => state.setWorkoutStatus);

    const [menuOpen, setMenuOpen] = useState(false);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        if (!menuOpen) return;
        const handleOutside = () => setMenuOpen(false);
        const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
        document.addEventListener('click', handleOutside);
        document.addEventListener('keydown', handleEsc);
        return () => {
            document.removeEventListener('click', handleOutside);
            document.removeEventListener('keydown', handleEsc);
        };
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

    const expandable = !isRest;
    const toggleExpand = () => {
        if (!expandable) return;
        setExpanded(v => !v);
    };

    const wrapperProps = setNodeRef ? { ref: setNodeRef, style, ...attributes, ...listeners } : {};

    return (
        <div
            id={id}
            {...wrapperProps}
            className={clsx(
                "group border-b border-rule last:border-b-0 select-none transition-colors",
                isRest && "text-pencil",
                isRaceDayCard && "bg-marker/5",
                status === 'skipped' && "opacity-45 hover:opacity-60",
                isOver && !isActive && "bg-marker/5 shadow-[inset_0_2px_0_var(--marker),inset_0_-2px_0_var(--marker)]",
                isActive && "opacity-20"
            )}
        >
            {/* Header row */}
            <div
                onClick={expandable ? toggleExpand : undefined}
                className={clsx(
                    "relative flex items-center gap-3 px-3 sm:px-4 py-2 hover:bg-ink/[0.02] transition-colors",
                    expandable && "cursor-pointer"
                )}
            >
                {/* Date with neat pen circle for today */}
                <div className="w-14 flex-none flex items-center">
                    <span className={clsx(
                        "font-data text-[11px] uppercase tracking-wider relative inline-block px-1 py-0.5",
                        isToday ? "text-marker font-bold" : "text-pencil"
                    )}>
                        {isToday && (
                            <span aria-hidden="true" className="pen-circle pointer-events-none absolute inset-0 -m-0.5" />
                        )}
                        {new Date(displayDate).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
                    </span>
                </div>

                {/* Title */}
                <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                    <div className="flex items-baseline gap-2 min-w-0">
                        <h4
                            className={clsx(
                                "text-sm truncate",
                                status === 'skipped' && "line-through opacity-60"
                            )}
                            style={{
                                color: isRest ? 'var(--pencil)' : 'var(--ink)',
                                fontStyle: isRest ? 'italic' : undefined,
                                borderLeft: !isRest && zc ? `2px solid ${zc}` : undefined,
                                paddingLeft: !isRest && zc ? 6 : 0,
                                fontWeight: isRaceDayCard ? 700 : undefined,
                            }}
                        >
                            {displayTitle}
                        </h4>
                        {isRaceDayCard && (
                            <span className="text-marker font-data text-[10px] uppercase font-bold flex-none">Race</span>
                        )}
                    </div>
                    {workout.description && (
                        <p
                            className={clsx(
                                "text-xs text-pencil truncate",
                                status === 'skipped' && "line-through opacity-60"
                            )}
                        >
                            {formatPlanLabel(workout.description, units)}
                        </p>
                    )}
                </div>

                {/* Distance & Action triggers */}
                <div className="flex-none flex items-center gap-3">
                    {paceString && !isRest && zone && (
                        <span
                            className="hidden lg:inline font-data text-xs whitespace-nowrap"
                            style={{ color: zc ?? 'var(--pencil)' }}
                        >
                            {paceString}
                        </span>
                    )}
                    <span className={clsx(
                        "font-data text-sm font-bold whitespace-nowrap w-[76px] text-right",
                        isRest ? "text-pencil font-normal" : "text-ink",
                        isRaceDayCard && "text-marker"
                    )}>
                        {workout.distance ? formatDistance(workout.distance, units) : '—'}
                    </span>
                    {expandable && (
                        <span className={clsx(
                            "text-[10px] font-data font-bold uppercase tracking-wider px-1.5 py-0.5 border transition-colors",
                            expanded
                                ? "bg-ink text-paper border-ink"
                                : "text-pencil border-rule hover:border-pencil"
                        )}>
                            {expanded ? "Close" : "Details"}
                        </span>
                    )}
                    {weekIndex !== undefined && dayIndex !== undefined && (
                        <div className="relative shrink-0">
                            <button
                                onClick={toggleMenu}
                                onMouseDown={(e) => e.stopPropagation()}
                                className={clsx(
                                    "w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200",
                                    status === 'completed' && "bg-ink text-paper font-extrabold",
                                    status === 'skipped' && "border border-pencil/60 text-pencil font-extrabold",
                                    status === 'modified' && "bg-marker text-paper font-extrabold",
                                    status === 'none' && "border border-rule hover:border-pencil/60"
                                )}
                                title="Mark workout status"
                            >
                                {status === 'completed' && <span className="text-[10px] font-bold">✓</span>}
                                {status === 'skipped' && <span className="text-[10px] font-bold">✗</span>}
                                {status === 'modified' && <span className="text-[10px] font-bold">✎</span>}
                                {status === 'none' && <span className="opacity-0 group-hover:opacity-100 text-[10px] text-pencil">✓</span>}
                            </button>
                            {menuOpen && (
                                <div
                                    onMouseDown={(e) => e.stopPropagation()}
                                    className="absolute right-0 top-6 z-30 w-32 bg-card border border-rule shadow-2xl p-1 flex flex-col gap-0.5 animate-in"
                                >
                                    <button onClick={(e) => selectStatus('completed', e)} className="px-2.5 py-1 text-[11px] font-bold text-ink hover:bg-ink/5 font-data text-left">✓ Completed</button>
                                    <button onClick={(e) => selectStatus('modified', e)} className="px-2.5 py-1 text-[11px] font-bold text-marker hover:bg-marker/10 font-data text-left">✎ Modified</button>
                                    <button onClick={(e) => selectStatus('skipped', e)} className="px-2.5 py-1 text-[11px] font-bold text-pencil hover:bg-ink/5 font-data text-left">✗ Skipped</button>
                                    {status !== 'none' && (
                                        <button onClick={(e) => selectStatus('none', e)} className="px-2.5 py-1 text-[11px] font-bold text-marker border-t border-rule mt-0.5 pt-1.5 font-data text-left">↺ Clear</button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    <span
                        className="flex-none w-5 flex justify-center text-pencil cursor-grab active:cursor-grabbing hover:text-ink"
                        title="Drag to reschedule"
                    >
                        <GripIcon />
                    </span>
                </div>
            </div>

            {/* Session Docket (Variant B) */}
            {expanded && expandable && (
                <div className="mx-3 sm:mx-4 mb-3 p-3 bg-paper border border-rule shadow-sm animate-in">
                    <div className="flex items-center justify-between gap-2 border-b border-rule pb-2 mb-2.5">
                        <div className="flex items-center gap-2">
                            <span
                                className="w-2.5 h-2.5 rounded-full flex-none"
                                style={{ backgroundColor: zc ?? 'var(--pencil)' }}
                            />
                            <span className="font-data text-xs font-bold uppercase tracking-wider text-ink">
                                {zone || 'Workout Target'}
                            </span>
                            {paceString && (
                                <span className="font-data text-xs font-bold px-2 py-0.5 bg-card border border-rule text-ink">
                                    {paceString} <span className="text-pencil font-normal text-[10px]">/{units}</span>
                                </span>
                            )}
                        </div>
                        {workout.distance && (
                            <span className="font-data text-xs text-pencil">
                                Target: <strong className="text-ink">{formatDistance(workout.distance, units)}</strong>
                            </span>
                        )}
                    </div>

                    {workout.description ? (
                        <p className="text-xs text-ink leading-relaxed">
                            {formatPlanLabel(workout.description, units)}
                        </p>
                    ) : (
                        <p className="text-xs text-pencil italic">Follow target pace zone guidance.</p>
                    )}

                    {/* Fast logging controls inside the docket */}
                    {weekIndex !== undefined && dayIndex !== undefined && (
                        <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-rule/60">
                            <span className="font-data text-[10px] uppercase text-pencil tracking-wider mr-1">Log:</span>
                            <button
                                onClick={() => setWorkoutStatus(weekIndex, dayIndex, 'completed')}
                                className={clsx(
                                    "px-2 py-1 text-[11px] font-data font-bold border transition-colors",
                                    status === 'completed'
                                        ? "bg-ink text-paper border-ink"
                                        : "bg-card border-rule text-ink hover:border-pencil"
                                )}
                            >
                                ✓ Completed
                            </button>
                            <button
                                onClick={() => setWorkoutStatus(weekIndex, dayIndex, 'modified')}
                                className={clsx(
                                    "px-2 py-1 text-[11px] font-data font-bold border transition-colors",
                                    status === 'modified'
                                        ? "bg-marker text-paper border-marker"
                                        : "bg-card border-rule text-marker hover:border-marker/50"
                                )}
                            >
                                ✎ Modified
                            </button>
                            <button
                                onClick={() => setWorkoutStatus(weekIndex, dayIndex, 'skipped')}
                                className={clsx(
                                    "px-2 py-1 text-[11px] font-data font-bold border transition-colors",
                                    status === 'skipped'
                                        ? "bg-pencil text-paper border-pencil"
                                        : "bg-card border-rule text-pencil hover:border-pencil"
                                )}
                            >
                                ✗ Skipped
                            </button>
                            {status !== 'none' && (
                                <button
                                    onClick={() => setWorkoutStatus(weekIndex, dayIndex, 'none')}
                                    className="ml-auto text-[10px] font-data text-pencil hover:text-marker"
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                    )}
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
