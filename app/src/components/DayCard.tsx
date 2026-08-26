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
    const label = units;

    if (typeof dist === 'number') {
        return `${convert(dist, isMetric)} ${label}`;
    }
    return `${convert(dist[0], isMetric)}–${convert(dist[1], isMetric)} ${label}`;
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

    // Pace Calculation Logic
    const zone = getPaceZone(workout.title, workout.tags, workout.zone as PaceZone);
    const paceRange = (paces && zone) ? paces[zone] : null;
    const zc = zoneColor(zone);

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
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setMenuOpen(false);
        };
        document.addEventListener('click', handleOutsideClick);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('click', handleOutsideClick);
            document.removeEventListener('keydown', handleEscape);
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

    const renderStatusTrigger = () => {
        if (weekIndex === undefined || dayIndex === undefined) return null;

        let icon = null;
        let btnClass = "w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200";

        if (status === 'completed') {
            icon = <span className="text-[10px] font-black">✓</span>;
            btnClass += " bg-ink text-paper font-extrabold";
        } else if (status === 'skipped') {
            icon = <span className="text-[10px] font-black">✗</span>;
            btnClass += " border border-pencil/60 text-pencil font-extrabold";
        } else if (status === 'modified') {
            icon = <span className="text-[10px] font-black">✎</span>;
            btnClass += " bg-marker text-paper font-extrabold";
        } else {
            icon = <span className="opacity-0 group-hover/status:opacity-100 text-[10px] text-pencil transition-opacity">✓</span>;
            btnClass += " border border-rule hover:border-pencil/60 group/status";
        }

        const menuItems: Array<{ status: WorkoutStatus; label: string; glyph: string; cls: string }> = [
            { status: 'completed', label: 'Completed', glyph: '✓', cls: 'text-ink hover:bg-ink/5' },
            { status: 'modified', label: 'Modified', glyph: '✎', cls: 'text-marker hover:bg-marker/10' },
            { status: 'skipped', label: 'Skipped', glyph: '✗', cls: 'text-pencil hover:bg-ink/5' },
        ];

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
                        className="absolute right-0 top-6 z-30 w-32 bg-card border border-rule shadow-2xl p-1 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100"
                    >
                        {menuItems.map(({ status: s, label, glyph, cls }) => (
                            <button
                                key={s}
                                onClick={(e) => selectStatus(s, e)}
                                onMouseDown={(e) => e.stopPropagation()}
                                className={clsx(
                                    "w-full text-left px-2.5 py-1.5 rounded-none text-[11px] font-bold flex items-center gap-1.5 transition-colors font-data",
                                    cls,
                                    status === s && "bg-ink/5"
                                )}
                            >
                                <span aria-hidden="true">{glyph}</span> {label}
                            </button>
                        ))}
                        {status !== 'none' && (
                            <button
                                onClick={(e) => selectStatus('none', e)}
                                onMouseDown={(e) => e.stopPropagation()}
                                className="w-full text-left px-2.5 py-1.5 text-[11px] font-bold text-marker hover:bg-marker/10 border-t border-rule mt-0.5 pt-1.5 flex items-center gap-1.5 transition-colors font-data"
                            >
                                <span aria-hidden="true">↺</span> Clear status
                            </button>
                        )}
                    </div>
                )}
            </div>
        );
    };

    // If setNodeRef is passed, we bind the drag-and-drop properties
    const wrapperProps = setNodeRef ? { ref: setNodeRef, style, ...attributes, ...listeners } : {};

    const expandable = !isRest;
    const [expanded, setExpanded] = useState(false);

    const toggleExpand = () => {
        if (!expandable) return;
        setExpanded(v => !v);
    };

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
            {/* Clickable row (tap to reveal pace + description on mobile; drag via grip) */}
            <div
                onClick={expandable ? toggleExpand : undefined}
                className={clsx(
                    "relative flex items-center gap-3 px-3 sm:px-4 py-2",
                    expandable && "cursor-pointer hover:bg-marker/5 transition-colors"
                )}
            >
                {isToday && (
                    <span aria-hidden="true" className="pen-circle pointer-events-none absolute inset-x-1.5 -inset-y-0.5" />
                )}

                {/* Date */}
                <div className={clsx(
                    "font-data text-[11px] uppercase tracking-wider w-14 flex-none",
                    isToday ? "text-marker font-bold" : "text-pencil"
                )}>
                    {new Date(displayDate).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
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

                {/* Distance + pace */}
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
                        <svg viewBox="0 0 20 20" fill="currentColor" className={clsx(
                            "w-4 h-4 text-pencil transition-transform flex-none",
                            expanded && "rotate-90"
                        )} aria-hidden="true">
                            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                        </svg>
                    )}
                    {renderStatusTrigger()}
                    <span
                        className="flex-none w-5 flex justify-center text-pencil cursor-grab active:cursor-grabbing hover:text-ink"
                        title="Drag to reschedule"
                    >
                        <GripIcon />
                    </span>
                </div>
            </div>

            {/* Reveal: pace + full description, indented under a zone rule */}
            {expanded && expandable && (
                <div className="px-3 sm:px-4 pb-2.5 -mt-1">
                    <div className="pl-5 border-l-2" style={{ borderColor: zc ?? 'var(--rule)' }}>
                        {paceString && zone && (
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-data text-sm font-bold" style={{ color: zc ?? 'var(--pencil)' }}>
                                    {paceString}
                                </span>
                                <span className="text-[10px] uppercase tracking-wider text-pencil font-data">{zone}</span>
                            </div>
                        )}
                        {workout.description && (
                            <p className="text-xs text-ink leading-relaxed">{formatPlanLabel(workout.description, units)}</p>
                        )}
                        {!paceString && !workout.description && (
                            <p className="text-xs text-pencil">No pacing targets for this workout.</p>
                        )}
                    </div>
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
