/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react';
import { format } from 'date-fns';
import type { RenderedWeek, RenderedWorkout, Distance } from '../../types';
import type { TrainingPaces } from '../../lib/paceCalculator';
import { getPaceZone } from '../../lib/paceCalculator';
import { formatPlanLabel, formatPaceRange } from '../../lib/formatters';
import { KM_PER_MILE } from '../../lib/constants';
import { zoneColor } from '../../lib/zoneColors';

const conv = (v: number, m: boolean) => (m ? Math.round(v * KM_PER_MILE * 10) / 10 : v);

export const fmtDist = (d: Distance, units: 'mi' | 'km') => {
    if (typeof d === 'number') return `${conv(d, units === 'km')} ${units}`;
    return `${conv(d[0], units === 'km')}–${conv(d[1], units === 'km')} ${units}`;
};

export const zoneFor = (w: RenderedWorkout) =>
    getPaceZone(w.title, w.tags, w.zone as never);

export const isRestWorkout = (w: RenderedWorkout) =>
    w.tags?.includes('Rest') || w.title.toLowerCase().includes('rest');

export const isTodayWorkout = (w: RenderedWorkout, now: Date = new Date()) =>
    now.toDateString() === new Date(w.date).toDateString();

export const paceFor = (w: RenderedWorkout, paces: TrainingPaces | undefined, units: 'mi' | 'km') => {
    const z = zoneFor(w);
    if (!z || !paces?.[z]) return null;
    const r = paces[z]!;
    const base =
        z === 'Recovery'
            ? `> ${formatPaceRange({ min: r.min, max: r.min }, units)}`
            : formatPaceRange(r, units);
    return { zone: z, text: `${base}/${units}`, color: zoneColor(z) ?? 'var(--pencil)' };
};

/**
 * PROTOTYPE presentational day row (read-only) with a configurable reveal slot.
 * The row itself is shared across variants; only the reveal differs.
 */
export const Row = ({
    workout,
    units,
    isToday,
    revealed,
    reveal,
    onToggle,
    onTap,
    expandable = true,
}: {
    workout: RenderedWorkout;
    units: 'mi' | 'km';
    isToday: boolean;
    revealed?: React.ReactNode;
    reveal?: React.ReactNode;
    onToggle?: () => void;
    onTap?: () => void;
    expandable?: boolean;
}) => {
    const isRest = workout.tags?.includes('Rest') || workout.title.toLowerCase().includes('rest');
    const zone = zoneFor(workout);
    const zc = zoneColor(zone);
    const isRace = workout.tags?.includes('Race') || workout.title.toLowerCase().includes('goal race');

    const [innerOpen, setInnerOpen] = useState(false);
    const open = onToggle !== undefined ? !!revealed : innerOpen;

    const interactive = expandable;
    const handleClick = () => {
        if (!interactive) return;
        if (onTap) return onTap();
        if (onToggle) return onToggle();
        setInnerOpen(!innerOpen);
    };

    return (
        <div className="border-b border-rule last:border-b-0">
            <div
                role={interactive ? 'button' : undefined}
                tabIndex={interactive ? 0 : undefined}
                onClick={handleClick}
                onKeyDown={(e) => {
                    if (interactive && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        handleClick();
                    }
                }}
                className={`relative flex items-center gap-3 px-3 sm:px-4 py-2.5 text-left select-none ${
                    interactive ? 'cursor-pointer hover:bg-marker/5 transition-colors' : 'cursor-default'
                }`}
            >
                {isToday && (
                    <span aria-hidden="true" className="pen-circle pointer-events-none absolute inset-x-1.5 -inset-y-0.5" />
                )}
                <div className={`font-data text-[11px] uppercase tracking-wider w-14 flex-none ${isToday ? 'text-marker font-bold' : 'text-pencil'}`}>
                    {format(workout.date, 'EEE d')}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                    <div className="flex items-baseline gap-2 min-w-0">
                        <span
                            className="text-sm truncate"
                            style={{
                                color: isRest ? 'var(--pencil)' : 'var(--ink)',
                                fontStyle: isRest ? 'italic' : undefined,
                                borderLeft: !isRest && zc ? `2px solid ${zc}` : undefined,
                                paddingLeft: !isRest && zc ? 6 : 0,
                                fontWeight: isRace ? 700 : undefined,
                            }}
                        >
                            {formatPlanLabel(workout.title, units)}
                        </span>
                        {isRace && <span className="text-marker font-data text-[10px] uppercase font-bold flex-none">Race</span>}
                    </div>
                    {workout.description && (
                        <p className="text-xs text-pencil truncate">{formatPlanLabel(workout.description, units)}</p>
                    )}
                </div>
                <div className="flex-none flex items-center gap-2.5">
                    <span className={`font-data text-sm font-bold whitespace-nowrap w-[76px] text-right ${isRest ? 'text-pencil font-normal' : 'text-ink'} ${isRace ? 'text-marker' : ''}`}>
                        {workout.distance ? fmtDist(workout.distance, units) : '—'}
                    </span>
                    {interactive && (
                        <svg viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 text-pencil transition-transform ${open ? 'rotate-90' : ''}`} aria-hidden="true">
                            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                        </svg>
                    )}
                </div>
            </div>
            {open && (reveal ?? null)}
        </div>
    );
};

/** Session-sheet scaffold reused by all three variants: numeral header + rows. */
export const Sheet = ({
    week,
    row,
    isCurrent,
}: {
    week: RenderedWeek;
    row: (w: RenderedWorkout, i: number) => React.ReactNode;
    isCurrent: boolean;
}) => {
    return (
        <section className="bg-card border border-rule" style={isCurrent ? { boxShadow: '0 0 0 1.5px rgb(var(--marker))' } : undefined}>
            <div className="flex items-center gap-4 px-3 sm:px-5 py-2.5 border-b border-rule" style={isCurrent ? { background: 'rgb(var(--marker) / 0.06)' } : undefined}>
                <div className="font-display font-bold text-ink text-3xl leading-none w-14 flex-none">{String(week.weekNumber).padStart(2, '0')}</div>
                <div className="flex-1 min-w-0">
                    <div className="font-data text-[10px] uppercase tracking-[0.18em] text-pencil">
                        {format(week.weekStart, 'MMM d')} – {format(week.weekEnd, 'MMM d')}
                        {isCurrent && <span className="text-marker font-bold"> · this week</span>}
                    </div>
                </div>
                <span className="text-xs text-pencil hidden sm:inline">{week.workouts.length} sessions</span>
            </div>
            <div>{week.workouts.map((w, i) => row(w, i))}</div>
        </section>
    );
};

export const weeksIsCurrent = (week: RenderedWeek) => {
    const t = new Date();
    return t >= new Date(week.weekStart) && t <= new Date(week.weekEnd);
};
