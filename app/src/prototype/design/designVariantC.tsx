import { useState } from 'react';
import { format } from 'date-fns';
import {
    DndContext,
    DragOverlay,
    closestCenter,
    useSensor,
    useSensors,
    MouseSensor,
    TouchSensor,
    KeyboardSensor,
    type DragEndEvent,
    type DragStartEvent,
    type DragOverEvent,
} from '@dnd-kit/core';
import { useSortable, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { RenderedPlan, RenderedWorkout } from '../../types';
import type { TrainingPaces } from '../../lib/paceCalculator';
import { getPaceZone, parseTimeString } from '../../lib/paceCalculator';
import { calculateWeeklyVolume } from '../../lib/calculator';
import { formatPlanLabel } from '../../lib/formatters';
import { getTodayContext } from '../../lib/todayContext';
import { usePlanStore } from '../../store/usePlanStore';
import { zoneColor, fmtDist } from './tokens';
import { PaceText } from './shared';
import { TodayBand } from './TodayBand';

/**
 * PROTOTYPE Variant C — 'Session Sheet' + bib hero. Coach's clipboard rows
 * (giant week numerals, one ruled line per day) with working drag-to-reschedule
 * (mouse, touch, and keyboard) and a live settings strip wired to the real store.
 */

const parseWorkoutId = (id: string) => {
    const parts = id.split('-');
    return { week: parseInt(parts[1], 10), day: parseInt(parts[3], 10) };
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

const DayRowContent = ({
    workout,
    units,
    paces,
    isToday,
    isRaceDay,
    isOver,
    dimmed,
    overlay,
}: {
    workout: RenderedWorkout;
    units: 'mi' | 'km';
    paces?: TrainingPaces;
    isToday: boolean;
    isRaceDay: boolean;
    isOver?: boolean;
    dimmed?: boolean;
    overlay?: boolean;
}) => {
    const isRest = workout.tags?.includes('Rest') || workout.title.toLowerCase().includes('rest');
    const zone = getPaceZone(workout.title, workout.tags, workout.zone as never);
    const zc = zoneColor(zone);

    return (
        <div
            className={`relative flex items-center gap-3 px-4 sm:px-5 py-2 border-b dp-border-rule last:border-b-0 ${
                overlay ? 'dp-card shadow-2xl' : ''
            }`}
            style={{
                background: overlay
                    ? 'var(--dp-card)'
                    : isOver
                        ? 'var(--dp-marker-soft)'
                        : isRaceDay
                            ? 'var(--dp-marker-soft)'
                            : undefined,
                boxShadow: isOver && !overlay ? 'inset 0 2px 0 var(--dp-marker), inset 0 -2px 0 var(--dp-marker)' : undefined,
                opacity: dimmed ? 0.35 : undefined,
            }}
        >
            {isToday && !overlay && (
                <span aria-hidden="true" className="dp-circle pointer-events-none absolute inset-x-2 -inset-y-0.5" />
            )}
            <div className={`dp-data text-[11px] uppercase tracking-wider w-14 flex-none ${isToday ? 'dp-marker font-bold' : 'dp-pencil'}`}>
                {format(workout.date, 'EEE d')}
            </div>
            <div className="flex-1 min-w-0 flex items-baseline gap-2">
                <span
                    className="text-sm truncate"
                    style={{
                        color: isRest ? 'var(--dp-pencil)' : 'var(--dp-ink)',
                        fontStyle: isRest ? 'italic' : undefined,
                        borderLeft: !isRest && zc ? `2px solid ${zc}` : undefined,
                        paddingLeft: !isRest && zc ? 6 : 0,
                        fontWeight: isRaceDay ? 700 : undefined,
                    }}
                >
                    {formatPlanLabel(workout.title, units)}
                </span>
                {isRaceDay && <span className="dp-marker dp-data text-[10px] uppercase font-bold flex-none">Race</span>}
            </div>
            <div className="flex-none flex items-center gap-3">
                {workout.distance ? (
                    <span className="dp-data dp-ink text-sm font-bold whitespace-nowrap">{fmtDist(workout.distance, units)}</span>
                ) : (
                    <span className="dp-data dp-pencil text-sm">—</span>
                )}
                <span className="w-[104px] text-right hidden sm:block">
                    <PaceText zone={zone} paces={paces} units={units} />
                </span>
                <span
                    title="Drag to reschedule"
                    className="flex-none w-5 flex justify-center dp-pencil cursor-grab active:cursor-grabbing hover:dp-ink"
                >
                    <GripIcon />
                </span>
            </div>
        </div>
    );
};

const SortableDayRow = ({
    workout,
    units,
    paces,
    isToday,
    isRaceDay,
    rowId,
    isOver,
    dimmed,
}: {
    workout: RenderedWorkout;
    units: 'mi' | 'km';
    paces?: TrainingPaces;
    isToday: boolean;
    isRaceDay: boolean;
    rowId: string;
    isOver?: boolean;
    dimmed?: boolean;
}) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: rowId });

    return (
        <div
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
                touchAction: isDragging ? 'none' : 'auto',
            }}
        >
            <DayRowContent
                workout={workout}
                units={units}
                paces={paces}
                isToday={isToday}
                isRaceDay={isRaceDay}
                isOver={isOver}
                dimmed={dimmed || isDragging}
            />
        </div>
    );
};

const SettingsStrip = ({ raceDate }: { raceDate: Date }) => {
    const { selectedPlanId, setPlanId, setUnits, setRaceDate, availablePlans } = usePlanStore();
    const units = usePlanStore((s) => s.units);
    const raceInput = usePlanStore((s) => s.raceInput);

    const label = 'dp-data text-[10px] uppercase tracking-[0.15em] dp-pencil block mb-1';
    const field =
        'dp-data text-sm px-2.5 py-1.5 dp-card dp-ink dp-border-rule border rounded-none outline-none focus:border-[var(--dp-marker)] w-full';

    return (
        <section className="dp-card px-4 sm:px-5 py-3">
            <div className="dp-data text-[10px] uppercase tracking-[0.2em] dp-pencil mb-2.5">Settings</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <div className="col-span-2 sm:col-span-1 lg:col-span-2">
                    <label className={label} htmlFor="dp-plan">Plan</label>
                    <select id="dp-plan" className={field} value={selectedPlanId} onChange={(e) => setPlanId(e.target.value)}>
                        {availablePlans.map((p) => (
                            <option key={p.id} value={p.id}>{p.type} · {p.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <span className={label}>Units</span>
                    <div className="flex">
                        {(['mi', 'km'] as const).map((u) => (
                            <button
                                key={u}
                                onClick={() => setUnits(u)}
                                aria-pressed={units === u}
                                className={`dp-data flex-1 text-sm px-2.5 py-1.5 border dp-border-rule -ml-px first:ml-0 ${
                                    u === units ? 'dp-ink font-bold' : 'dp-pencil'
                                }`}
                                style={u === units ? { background: 'var(--dp-marker-soft)', borderColor: 'var(--dp-marker)', zIndex: 1 } : undefined}
                            >
                                {u}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className={label} htmlFor="dp-date">Race day</label>
                    <input
                        id="dp-date"
                        type="date"
                        className={field}
                        value={format(raceDate, 'yyyy-MM-dd')}
                        onChange={(e) => {
                            const parsed = e.target.value ? new Date(`${e.target.value}T00:00:00`) : null;
                            if (parsed && !isNaN(parsed.getTime())) setRaceDate(parsed);
                        }}
                    />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className={label} htmlFor="dp-dist">Race</label>
                        <select
                            id="dp-dist"
                            className={field}
                            value={raceInput?.distance || '10K'}
                            onChange={(e) => {
                                const state = usePlanStore.getState();
                                const val = e.target.value as '5K' | '10K' | '15K' | 'Half Marathon' | 'Marathon';
                                state.setRaceInput(state.raceInput ? { ...state.raceInput, distance: val } : { distance: val, time: '0:45:00' });
                            }}
                        >
                            <option>5K</option>
                            <option>10K</option>
                            <option>15K</option>
                            <option>Half Marathon</option>
                            <option>Marathon</option>
                        </select>
                    </div>
                    <div>
                        <label className={label} htmlFor="dp-time">Time</label>
                        <input
                            id="dp-time"
                            type="text"
                            inputMode="numeric"
                            placeholder="h:mm:ss"
                            className={`${field} w-full`}
                            value={raceInput?.time || ''}
                            onChange={(e) => {
                                const state = usePlanStore.getState();
                                const val = e.target.value;
                                if (parseTimeString(val)) {
                                    state.setRaceInput(state.raceInput ? { ...state.raceInput, time: val } : { distance: '10K', time: val });
                                }
                            }}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

export const DesignVariantC = ({
    schedule,
    units,
    paces,
    planName,
    planSource,
}: {
    schedule: RenderedPlan;
    units: 'mi' | 'km';
    paces?: TrainingPaces;
    planName: string;
    planSource?: string;
}) => {
    const ctx = getTodayContext(schedule);
    const moveWorkout = usePlanStore((s) => s.moveWorkout);

    const [activeId, setActiveId] = useState<string | null>(null);
    const [overId, setOverId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);
    const handleDragOver = (event: DragOverEvent) => setOverId((event.over?.id as string) || null);
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        setOverId(null);
        if (!over || active.id === over.id) return;
        const src = parseWorkoutId(active.id as string);
        const dest = parseWorkoutId(over.id as string);
        moveWorkout(src.week, src.day, dest.week, dest.day);
    };

    const activeWorkout =
        activeId && (() => {
            const { week, day } = parseWorkoutId(activeId);
            return schedule.weeks[week]?.workouts[day];
        })();

    const jumpToToday = () => {
        if (ctx.weekIndex >= 0 && ctx.dayIndex >= 0) {
            document.getElementById(`week-${ctx.weekIndex}-day-${ctx.dayIndex}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const volumes = schedule.weeks.map((w) => calculateWeeklyVolume(w, units).average);
    const peakVol = Math.round(Math.max(...volumes));

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="dp-root dp-paper min-h-full pb-28">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 space-y-5">
                    <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b-2 pb-3" style={{ borderColor: 'var(--dp-ink)' }}>
                        <div>
                            <div className="dp-data text-[11px] uppercase tracking-[0.2em] dp-pencil mb-1">Session sheet</div>
                            <h1 className="dp-display dp-ink uppercase text-3xl sm:text-4xl leading-none">{planName}</h1>
                            {planSource && <p className="dp-pencil text-xs mt-1">{planSource}</p>}
                        </div>
                    </header>

                    {/* Bib hero */}
                    <section className="dp-card flex items-stretch">
                        <div className="flex-1 px-6 sm:px-8 py-5">
                            <div className="dp-data text-[11px] uppercase tracking-[0.25em] dp-pencil">Race day</div>
                            <div className="dp-display dp-ink uppercase leading-[0.85] text-6xl sm:text-7xl mt-1.5" style={{ fontWeight: 700 }}>
                                {format(schedule.raceDate, 'MMM d')}
                            </div>
                            <div className="dp-data dp-pencil text-sm mt-2 tracking-[0.15em] uppercase">
                                {format(schedule.raceDate, 'yyyy · EEEE')} · {schedule.weeks.length} weeks · peak {peakVol} {units}
                            </div>
                        </div>
                        <div
                            className="flex-none w-[120px] sm:w-[150px] flex flex-col items-center justify-center px-4 border-l-2 border-dashed"
                            style={{
                                borderColor: 'var(--dp-rule)',
                                background: ctx.daysToRace === 0 ? 'var(--dp-marker-soft)' : undefined,
                            }}
                        >
                            <span className="dp-data text-[10px] uppercase tracking-[0.2em] dp-pencil">
                                {ctx.daysToRace === 0 ? 'Go' : 'Countdown'}
                            </span>
                            <span
                                className={`dp-display leading-none ${ctx.daysToRace === 0 ? 'dp-marker' : 'dp-ink'}`}
                                style={{ fontWeight: 700, fontSize: '2.8rem' }}
                            >
                                {ctx.daysToRace === 0 ? 'RACE' : ctx.daysToRace}
                            </span>
                            <span className="dp-data text-[10px] dp-pencil mt-1">days out</span>
                        </div>
                    </section>

                    <TodayBand schedule={schedule} units={units} paces={paces} size="compact" onJump={jumpToToday} />

                    <SettingsStrip raceDate={schedule.raceDate} />

                    {schedule.weeks.map((week, wIdx) => {
                        const isCurrent = ctx.weekIndex === wIdx;
                        const vol = calculateWeeklyVolume(week, units);
                        const label =
                            week.weeksToGoal < 1 ? 'Recovery week' : week.weeksToGoal === 1 ? 'Race week' : `${week.weeksToGoal} weeks to go`;
                        return (
                            <section
                                key={week.weekNumber}
                                className="dp-card"
                                style={isCurrent ? { boxShadow: '0 0 0 1.5px var(--dp-marker)' } : undefined}
                            >
                                <div
                                    className="flex items-center gap-4 px-4 sm:px-5 py-2.5 border-b dp-border-rule"
                                    style={isCurrent ? { background: 'var(--dp-marker-soft)' } : undefined}
                                >
                                    <div className="dp-display dp-ink text-4xl leading-none w-16 flex-none" style={{ fontWeight: 700 }}>
                                        {String(week.weekNumber).padStart(2, '0')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="dp-data text-[10px] uppercase tracking-[0.18em] dp-pencil">
                                            {format(week.weekStart, 'MMM d')} – {format(week.weekEnd, 'MMM d')}
                                            {isCurrent && <span className="dp-marker font-bold"> · this week</span>}
                                        </div>
                                        <div className="text-xs dp-pencil">{label}</div>
                                    </div>
                                    <div className="text-right flex-none">
                                        <span className="dp-data dp-ink font-bold text-lg leading-none">{vol.formatted}</span>
                                        <span className="dp-data text-[10px] dp-pencil ml-1">{units}</span>
                                    </div>
                                </div>

                                {week.workouts.map((w, dIdx) => {
                                    const isToday = new Date(w.date).toDateString() === new Date().toDateString();
                                    const isRaceDay = new Date(w.date).toDateString() === new Date(schedule.raceDate).toDateString();
                                    const rowId = `week-${wIdx}-day-${dIdx}`;
                                    return (
                                        <div key={rowId} id={rowId} className="scroll-mt-6">
                                            <SortableDayRow
                                                workout={w}
                                                units={units}
                                                paces={paces}
                                                isToday={isToday}
                                                isRaceDay={isRaceDay}
                                                rowId={rowId}
                                                isOver={overId === rowId && activeId !== rowId}
                                                dimmed={activeId === rowId}
                                            />
                                        </div>
                                    );
                                })}
                            </section>
                        );
                    })}
                </div>
            </div>

            <DragOverlay>
                {activeWorkout ? (
                    <div style={{ width: 'min(90vw, 56rem)', cursor: 'grabbing' }}>
                        <DayRowContent
                            workout={activeWorkout}
                            units={units}
                            paces={paces}
                            isToday={false}
                            isRaceDay={false}
                            overlay
                        />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};
