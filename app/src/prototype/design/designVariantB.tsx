import { useState } from 'react';
import { format } from 'date-fns';
import type { RenderedPlan, RenderedWorkout } from '../../types';
import type { TrainingPaces } from '../../lib/paceCalculator';
import { getPaceZone } from '../../lib/paceCalculator';
import { calculateWeeklyVolume } from '../../lib/calculator';
import { formatPlanLabel } from '../../lib/formatters';
import { getTodayContext } from '../../lib/todayContext';
import { zoneColor } from './tokens';
import { fmtDist } from './tokens';
import { PaceText } from './shared';

/**
 * PROTOTYPE Variant B — 'Bib & Splits'. Race-bib hero, then the plan as a
 * timeline of week lanes: one bar per day, height = distance, color = zone.
 * Lanes expand to the day detail.
 */
export const DesignVariantB = ({
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
    const [openWeek, setOpenWeek] = useState<number | null>(ctx.weekIndex >= 0 ? ctx.weekIndex : null);

    const volumes = schedule.weeks.map((w) => calculateWeeklyVolume(w, units).average);
    const maxDayDist = Math.max(
        ...schedule.weeks.flatMap((w) => w.workouts.map((w2) => (typeof w2.distance === 'number' ? w2.distance : Array.isArray(w2.distance) ? w2.distance[1] : 0))),
        1
    );
    const peakWeekIdx = volumes.indexOf(Math.max(...volumes));

    const dayDist = (w: RenderedWorkout) =>
        typeof w.distance === 'number' ? w.distance : Array.isArray(w.distance) ? w.distance[1] : 0;

    return (
        <div className="dp-root dp-paper min-h-full pb-28">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
                {/* Bib hero */}
                <section className="dp-card flex items-stretch max-w-2xl">
                    <div className="flex-1 px-6 sm:px-8 py-6">
                        <div className="dp-data text-[11px] uppercase tracking-[0.25em] dp-pencil">{planName}</div>
                        <div className="dp-display dp-ink uppercase leading-[0.85] text-7xl sm:text-8xl mt-2" style={{ fontWeight: 700 }}>
                            {format(schedule.raceDate, 'MMM d')}
                        </div>
                        <div className="dp-data dp-pencil text-sm mt-2 tracking-[0.15em] uppercase">
                            {format(schedule.raceDate, 'yyyy · EEEE')}
                        </div>
                        <div className="dp-data dp-pencil text-xs mt-3 uppercase tracking-[0.12em]">
                            {schedule.weeks.length} weeks · peak {Math.round(Math.max(...volumes))} {units}
                        </div>
                        {planSource && <div className="dp-pencil text-xs mt-3">{planSource}</div>}
                    </div>
                    {/* Tear-off stub */}
                    <div
                        className="flex-none w-[130px] sm:w-[160px] flex flex-col items-center justify-center px-4 border-l-2 border-dashed"
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
                            style={{ fontWeight: 700, fontSize: '3.2rem' }}
                        >
                            {ctx.daysToRace === 0 ? 'RACE' : ctx.daysToRace}
                        </span>
                        <span className="dp-data text-[10px] dp-pencil mt-1">days out</span>
                    </div>
                </section>

                {/* Lanes */}
                <div className="space-y-1.5">
                    {schedule.weeks.map((week, wIdx) => {
                        const isCurrent = ctx.weekIndex === wIdx;
                        const isOpen = openWeek === wIdx;
                        const vol = calculateWeeklyVolume(week, units);
                        return (
                            <div key={week.weekNumber} className="dp-card">
                                <button
                                    onClick={() => setOpenWeek(isOpen ? null : wIdx)}
                                    aria-expanded={isOpen}
                                    className="w-full flex items-center gap-3 sm:gap-4 px-3 sm:px-5 py-2.5 text-left hover:bg-[var(--dp-marker-soft)] transition-colors"
                                    style={isCurrent ? { boxShadow: 'inset 3px 0 0 var(--dp-marker)' } : undefined}
                                >
                                    <div className="flex-none w-14 sm:w-16">
                                        <div className="dp-display dp-ink text-3xl leading-none">{week.weekNumber}</div>
                                        <div className="dp-data text-[9px] dp-pencil uppercase">
                                            {week.weeksToGoal < 1 ? 'recov' : week.weeksToGoal === 1 ? 'race' : `−${week.weeksToGoal} wk`}
                                        </div>
                                    </div>

                                    {/* 7 day ticks */}
                                    <div className="flex-1 flex items-end gap-1 h-10" aria-hidden="true">
                                        {week.workouts.map((w) => {
                                            const zone = getPaceZone(w.title, w.tags, w.zone as never);
                                            const zc = zoneColor(zone);
                                            const d = dayDist(w);
                                            const h = d === 0 ? 4 : 8 + (d / maxDayDist) * 32;
                                            const isToday = new Date(w.date).toDateString() === new Date().toDateString();
                                            return (
                                                <div key={w.dayOfWeek} className="flex-1 flex flex-col justify-end items-stretch h-full">
                                                    {d === 0 ? (
                                                        <div className="mx-auto w-full" style={{ height: 2, background: 'var(--dp-rule)' }} />
                                                    ) : (
                                                        <div
                                                            className="rounded-t-[2px]"
                                                            style={{
                                                                height: h,
                                                                background: zc ?? 'var(--dp-pencil)',
                                                                opacity: isToday ? 1 : 0.85,
                                                                outline: isToday ? '2px solid var(--dp-marker)' : undefined,
                                                                outlineOffset: 1,
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="flex-none flex items-center gap-2">
                                        {wIdx === peakWeekIdx && (
                                            <span className="dp-data text-[9px] dp-marker font-bold uppercase tracking-wider hidden sm:inline">Peak</span>
                                        )}
                                        <span className="dp-data dp-ink font-bold text-sm whitespace-nowrap">{vol.formatted}</span>
                                        <span
                                            className={`dp-data text-xs dp-pencil transition-transform ${isOpen ? 'rotate-90' : ''}`}
                                            aria-hidden="true"
                                        >
                                            ›
                                        </span>
                                    </div>
                                </button>

                                {isOpen && (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-px border-t dp-border-rule" style={{ background: 'var(--dp-rule)' }}>
                                        {week.workouts.map((w) => {
                                            const zone = getPaceZone(w.title, w.tags, w.zone as never);
                                            const zc = zoneColor(zone);
                                            const isRest = w.tags?.includes('Rest') || w.title.toLowerCase().includes('rest');
                                            return (
                                                <div key={w.dayOfWeek} className="px-3 py-2.5" style={{ background: 'var(--dp-card)' }}>
                                                    <div className="dp-data text-[10px] uppercase tracking-wider dp-pencil">
                                                        {format(w.date, 'EEE d')}
                                                    </div>
                                                    <div
                                                        className="text-xs leading-snug mt-1"
                                                        style={{ color: isRest ? 'var(--dp-pencil)' : 'var(--dp-ink)', borderLeft: zc ? `2px solid ${zc}` : undefined, paddingLeft: zc ? 5 : 0 }}
                                                    >
                                                        {formatPlanLabel(w.title, units)}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                        {w.distance && <span className="dp-data text-xs font-bold dp-ink">{fmtDist(w.distance, units)}</span>}
                                                        <PaceText zone={zone} paces={paces} units={units} className="text-[10px]" />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
