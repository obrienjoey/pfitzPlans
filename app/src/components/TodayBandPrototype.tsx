import { format } from 'date-fns';
import type { RenderedPlan, Distance } from '../types';
import type { TrainingPaces, PaceZone } from '../lib/paceCalculator';
import { getPaceZone } from '../lib/paceCalculator';
import { formatPaceRange, cleanPlanTitle, formatPlanLabel } from '../lib/formatters';
import { getTodayContext } from '../lib/todayContext';
import { KM_PER_MILE } from '../lib/constants';
import { zoneColor } from '../lib/zoneColors';

/**
 * PROTOTYPE — micro-label inflation exploration (throwaway).
 * Question: the ~15 repeated 10px mono uppercase eyebrows flatten hierarchy.
 * Can cutting/restyling them (kept to a few true structural markers) restore
 * the coach's-log hierarchy? Three structurally-different treatments of the
 * TodayBand label system, toggled via ?variant=A|B|C.
 */

interface TodayBandProps {
    schedule: RenderedPlan;
    raceDate?: Date | null;
    planName?: string;
    planSource?: string;
    planType?: string;
    units: 'mi' | 'km';
    paces?: TrainingPaces;
    peakVolume?: number;
    onJump?: () => void;
}

const convert = (val: number, toMetric: boolean) =>
    toMetric ? Math.round(val * KM_PER_MILE * 10) / 10 : val;

const formatDistance = (dist: Distance, units: 'mi' | 'km'): string => {
    const metric = units === 'km';
    if (typeof dist === 'number') return `${convert(dist, metric)} ${units}`;
    return `${convert(dist[0], metric)}–${convert(dist[1], metric)} ${units}`;
};

const useBand = (props: TodayBandProps) => {
    const { schedule, raceDate, planName, planSource, planType, units, paces, peakVolume, onJump } = props;
    const ctx = getTodayContext(schedule);
    const workout = ctx.workout;
    const isRaceDay = ctx.daysToRace === 0;
    const isRest = !workout || workout.tags?.includes('Rest') || workout.title.toLowerCase().includes('rest');
    const zone = workout ? getPaceZone(workout.title, workout.tags, workout.zone as PaceZone) : null;
    const paceRange = zone && paces ? paces[zone] : null;
    const zc = zoneColor(zone);
    const distanceLabel = workout?.distance ? formatDistance(workout.distance, units) : null;
    const currentWeekNumber = ctx.currentWeekNumber ?? (ctx.weekIndex >= 0 ? ctx.weekIndex + 1 : 1);
    const totalWeeks = schedule.weeks.length;
    const resolvedRaceDate = raceDate || schedule.raceDate;
    const resolvedPlanName = planName || schedule.originalPlan?.name || 'Training Plan';
    const resolvedPlanType = planType || schedule.originalPlan?.type || 'Race';
    return { ctx, workout, isRaceDay, isRest, zone, paceRange, zc, distanceLabel, currentWeekNumber, totalWeeks, resolvedRaceDate, resolvedPlanName, resolvedPlanType, units, onJump, peakVolume, planSource };
};

/* ------------------------------------------------------------
   A — "Signal, not wallpaper": delete most eyebrows. Keep only
   the three true section markers (TODAY / CYCLE STATUS / GOAL
   RACE). Masthead stats and progress sub-labels drop to plain,
   non-shouting text. Hierarchy returns by removing.
   ------------------------------------------------------------ */
const VariantA = (props: TodayBandProps) => {
    const b = useBand(props);
    const { ctx } = b;
    const todayLabel = `TODAY · ${format(new Date(), 'EEEE, MMM d')}`;
    const paceRange = b.paceRange;
    return (
        <section aria-label="Training Command Center" className="bg-card border border-rule transition-colors shadow-sm">
            <div className="px-4 sm:px-5 py-2 bg-paper/60 border-b border-rule flex items-center justify-between gap-2">
                <span className="text-xs text-pencil truncate">{b.resolvedPlanName}{b.planSource ? ` · ${b.planSource}` : ''}</span>
                <span className="text-xs text-pencil shrink-0">{b.totalWeeks} weeks · {b.peakVolume !== undefined && b.peakVolume > 0 ? `peak ${b.peakVolume} ${b.units}` : ''}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-rule">
                {/* Bay 1 */}
                <div className="md:col-span-5 p-4 sm:p-5 flex flex-col justify-between gap-3">
                    <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="font-data text-[10px] uppercase font-bold tracking-[0.18em] text-marker flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-marker animate-pulse" />
                                <span>{todayLabel}</span>
                            </span>
                            {b.onJump && <span className="text-xs text-pencil hidden sm:inline">View in schedule →</span>}
                        </div>
                        <h3 className="font-display font-bold uppercase text-2xl sm:text-3xl text-ink leading-tight">
                            {b.isRest ? 'No workout scheduled today' : cleanPlanTitle(b.workout!.title)}
                        </h3>
                        {b.workout?.description && !b.isRest && (
                            <p className="text-xs text-pencil mt-1 max-w-md line-clamp-2">{formatPlanLabel(b.workout.description, b.units)}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                        {b.distanceLabel && !b.isRest && (
                            <span className="font-data font-bold text-sm text-ink bg-paper border border-rule px-2.5 py-1">{b.distanceLabel}</span>
                        )}
                        {paceRange && b.zone && !b.isRest && (
                            <span className="font-data text-xs font-semibold px-2.5 py-1 bg-paper border text-ink flex items-center gap-1.5" style={{ borderLeft: `3px solid ${b.zc ?? 'var(--pencil)'}` }}>
                                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: b.zc ?? 'var(--pencil)' }} />
                                <span>
                                    {b.zone === 'Recovery' ? `> ${formatPaceRange({ min: paceRange.min, max: paceRange.min }, b.units)}` : formatPaceRange(paceRange, b.units)}
                                </span>
                                <span className="text-pencil text-[10px]">/{b.units}</span>
                                <span className="text-pencil text-[10px] ml-0.5">({b.zone})</span>
                            </span>
                        )}
                    </div>
                </div>

                {/* Bay 2 */}
                <div className="md:col-span-4 p-4 sm:p-5 bg-paper/30 flex flex-col justify-between gap-3">
                    <div>
                        <div className="font-data text-[10px] uppercase font-bold tracking-[0.18em] text-pencil mb-1">CYCLE STATUS</div>
                        <div className="flex items-baseline justify-between gap-2">
                            <span className="font-display font-bold text-2xl sm:text-3xl text-ink uppercase leading-none">
                                Week {String(b.currentWeekNumber).padStart(2, '0')}
                                <span className="text-pencil font-normal text-base"> / {b.totalWeeks}</span>
                            </span>
                            <span className="font-data text-xs font-bold text-marker">{ctx.elapsedPct}% done</span>
                        </div>
                    </div>
                    <div>
                        <div className="w-full bg-paper border border-rule h-2 relative overflow-hidden flex">
                            <div className="bg-marker h-full transition-all duration-300" style={{ width: `${Math.max(2, Math.min(100, ctx.elapsedPct))}%` }} />
                        </div>
                        <div className="flex justify-between text-[10px] text-pencil mt-1">
                            <span>Base Build</span>
                            {b.peakVolume !== undefined && b.peakVolume > 0 ? <span>Peak ({b.peakVolume} {b.units})</span> : <span>Peak</span>}
                            <span>Taper</span>
                        </div>
                    </div>
                </div>

                {/* Bay 3 */}
                <div className="md:col-span-3 p-4 sm:p-5 flex flex-col justify-between sm:text-center md:text-left">
                    <div>
                        <div className="font-data text-[10px] uppercase font-bold tracking-[0.18em] text-pencil mb-1">GOAL RACE</div>
                        <div className="font-display font-bold uppercase text-3xl sm:text-4xl text-ink leading-none">
                            {b.isRaceDay ? <span className="text-marker">RACE DAY</span> : <span>T−{ctx.daysToRace}</span>}
                        </div>
                    </div>
                    <div className="pt-2 border-t border-rule/60 text-xs">
                        <div className="font-bold text-ink truncate">
                            <span>{b.resolvedRaceDate && format(b.resolvedRaceDate, 'MMM d')}</span>
                            <span className="text-pencil/50"> · </span>
                            <span className="text-pencil font-normal">{b.resolvedRaceDate && format(b.resolvedRaceDate, 'yyyy')}</span>
                        </div>
                        <div className="text-pencil text-[10px] truncate">{b.resolvedRaceDate && format(b.resolvedRaceDate, 'EEEE')}</div>
                    </div>
                </div>
            </div>
        </section>
    );
};

/* ------------------------------------------------------------
   B — "Margin-rail": move the three section labels to a narrow
   left index rail (a table-of-contents column), so the bays
   become content-only. Structurally different placement: labels
   no longer float above values.
   ------------------------------------------------------------ */
const VariantB = (props: TodayBandProps) => {
    const b = useBand(props);
    const { ctx } = b;
    const paceRange = b.paceRange;
    const rail = [
        { k: 'TODAY', v: b.isRest ? 'Rest day' : cleanPlanTitle(b.workout!.title) },
        { k: 'CYCLE', v: `Week ${String(b.currentWeekNumber).padStart(2, '0')} of ${b.totalWeeks} · ${ctx.elapsedPct}% done` },
        { k: 'RACE', v: b.isRaceDay ? 'RACE DAY' : `T−${ctx.daysToRace} · ${b.resolvedRaceDate ? format(b.resolvedRaceDate, 'MMM d, yyyy') : ''}` },
    ];
    return (
        <section aria-label="Training Command Center" className="bg-card border border-rule transition-colors shadow-sm">
            <div className="flex">
                {/* Left index rail */}
                <div className="w-14 sm:w-16 flex-none bg-paper/60 border-r border-rule flex flex-col">
                    {rail.map((r, i) => (
                        <div key={r.k} className={`flex-1 flex flex-col items-center justify-center gap-1 px-1 ${i > 0 ? 'border-t border-rule' : ''}`}>
                            <span className="font-data text-[9px] uppercase font-bold tracking-[0.18em] text-marker">{r.k}</span>
                            <span className="font-data text-[9px] text-pencil uppercase tracking-wide text-center leading-tight">{r.v}</span>
                        </div>
                    ))}
                </div>

                {/* Content column */}
                <div className="flex-1 min-w-0">
                    <div className="px-4 sm:px-5 py-2 bg-paper/60 border-b border-rule flex items-center justify-between gap-2">
                        <span className="text-xs text-pencil truncate">{b.resolvedPlanName}</span>
                        <span className="text-xs text-pencil shrink-0">{b.peakVolume !== undefined && b.peakVolume > 0 ? `peak ${b.peakVolume} ${b.units}` : `${b.totalWeeks} weeks`}</span>
                    </div>

                    <div className="p-4 sm:p-5">
                        <div className="flex flex-wrap items-center gap-2">
                            {b.distanceLabel && !b.isRest && (
                                <span className="font-data font-bold text-sm text-ink bg-paper border border-rule px-2.5 py-1">{b.distanceLabel}</span>
                            )}
                            {paceRange && b.zone && !b.isRest && (
                                <span className="font-data text-xs font-semibold px-2.5 py-1 bg-paper border text-ink flex items-center gap-1.5" style={{ borderLeft: `3px solid ${b.zc ?? 'var(--pencil)'}` }}>
                                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: b.zc ?? 'var(--pencil)' }} />
                                    <span>{b.zone === 'Recovery' ? `> ${formatPaceRange({ min: paceRange.min, max: paceRange.min }, b.units)}` : formatPaceRange(paceRange, b.units)}</span>
                                    <span className="text-pencil text-[10px]">/{b.units}</span>
                                    <span className="text-pencil text-[10px] ml-0.5">({b.zone})</span>
                                </span>
                            )}
                        </div>

                        <h3 className="font-display font-bold uppercase text-2xl sm:text-3xl text-ink leading-tight mt-3">
                            {b.isRest ? 'No workout scheduled today' : cleanPlanTitle(b.workout!.title)}
                        </h3>
                        {b.workout?.description && !b.isRest && (
                            <p className="text-xs text-pencil mt-1 max-w-md line-clamp-2">{formatPlanLabel(b.workout.description, b.units)}</p>
                        )}

                        <div className="mt-4">
                            <div className="w-full bg-paper border border-rule h-2 relative overflow-hidden flex">
                                <div className="bg-marker h-full transition-all duration-300" style={{ width: `${Math.max(2, Math.min(100, ctx.elapsedPct))}%` }} />
                            </div>
                            <div className="flex justify-between text-[10px] text-pencil mt-1">
                                <span>Base Build</span>
                                <span>Peak ({b.peakVolume} {b.units})</span>
                                <span>Taper</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

/* ------------------------------------------------------------
   C — "Coach's margin notes": keep eyebrows but treat them as
   genuine pen annotations — smaller, lighter pencil, hand-note
   weight, so content reads louder. Hierarchy via weight/colour
   contrast rather than removal.
   ------------------------------------------------------------ */
const VariantC = (props: TodayBandProps) => {
    const b = useBand(props);
    const { ctx } = b;
    const paceRange = b.paceRange;
    const eyebrow = "font-data text-[9px] uppercase tracking-[0.22em] text-pencil/70 font-medium";
    return (
        <section aria-label="Training Command Center" className="bg-card border border-rule transition-colors shadow-sm">
            <div className="px-4 sm:px-5 py-2 bg-paper/60 border-b border-rule flex items-center justify-between gap-2">
                <span className="font-data text-[10px] uppercase tracking-[0.22em] text-pencil/70">{b.resolvedPlanName}</span>
                <span className="font-data text-[10px] uppercase tracking-[0.22em] text-pencil/70">{b.totalWeeks} WKS · PEAK {b.peakVolume ?? ''} {b.units}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-rule">
                <div className="md:col-span-5 p-4 sm:p-5 flex flex-col justify-between gap-3">
                    <div>
                        <div className={`${eyebrow} mb-1.5 text-marker`}>{`TODAY · ${format(new Date(), 'EEEE, MMM d')}`}</div>
                        <h3 className="font-display font-bold uppercase text-2xl sm:text-3xl text-ink leading-tight">
                            {b.isRest ? 'No workout scheduled today' : cleanPlanTitle(b.workout!.title)}
                        </h3>
                        {b.workout?.description && !b.isRest && (
                            <p className="text-xs text-pencil mt-1 max-w-md line-clamp-2">{formatPlanLabel(b.workout.description, b.units)}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                        {b.distanceLabel && !b.isRest && (
                            <span className="font-data font-bold text-sm text-ink bg-paper border border-rule px-2.5 py-1">{b.distanceLabel}</span>
                        )}
                        {paceRange && b.zone && !b.isRest && (
                            <span className="font-data text-xs font-semibold px-2.5 py-1 bg-paper border text-ink flex items-center gap-1.5" style={{ borderLeft: `3px solid ${b.zc ?? 'var(--pencil)'}` }}>
                                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: b.zc ?? 'var(--pencil)' }} />
                                <span>{b.zone === 'Recovery' ? `> ${formatPaceRange({ min: paceRange.min, max: paceRange.min }, b.units)}` : formatPaceRange(paceRange, b.units)}</span>
                                <span className="text-pencil text-[10px]">/{b.units}</span>
                                <span className="text-pencil text-[10px] ml-0.5">({b.zone})</span>
                            </span>
                        )}
                    </div>
                </div>

                <div className="md:col-span-4 p-4 sm:p-5 bg-paper/30 flex flex-col justify-between gap-3">
                    <div>
                        <div className={`${eyebrow} mb-1.5`}>CYCLE STATUS</div>
                        <div className="flex items-baseline justify-between gap-2">
                            <span className="font-display font-bold text-2xl sm:text-3xl text-ink uppercase leading-none">
                                Week {String(b.currentWeekNumber).padStart(2, '0')}
                                <span className="text-pencil font-normal text-base"> / {b.totalWeeks}</span>
                            </span>
                            <span className="font-data text-xs font-bold text-marker">{ctx.elapsedPct}% done</span>
                        </div>
                    </div>
                    <div>
                        <div className="w-full bg-paper border border-rule h-2 relative overflow-hidden flex">
                            <div className="bg-marker h-full transition-all duration-300" style={{ width: `${Math.max(2, Math.min(100, ctx.elapsedPct))}%` }} />
                        </div>
                        <div className="flex justify-between text-[10px] text-pencil/70 mt-1">
                            <span>Base Build</span>
                            <span>Peak ({b.peakVolume} {b.units})</span>
                            <span>Taper</span>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-3 p-4 sm:p-5 flex flex-col justify-between sm:text-center md:text-left">
                    <div>
                        <div className={`${eyebrow} mb-1.5`}>GOAL RACE</div>
                        <div className="font-display font-bold uppercase text-3xl sm:text-4xl text-ink leading-none">
                            {b.isRaceDay ? <span className="text-marker">RACE DAY</span> : <span>T−{ctx.daysToRace}</span>}
                        </div>
                    </div>
                    <div className="pt-2 border-t border-rule/60 text-xs">
                        <div className="font-bold text-ink truncate">
                            <span>{b.resolvedRaceDate && format(b.resolvedRaceDate, 'MMM d')}</span>
                            <span className="text-pencil/50"> · </span>
                            <span className="text-pencil font-normal">{b.resolvedRaceDate && format(b.resolvedRaceDate, 'yyyy')}</span>
                        </div>
                        <div className="text-pencil text-[10px] truncate">{b.resolvedRaceDate && format(b.resolvedRaceDate, 'EEEE')}</div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export const TodayBandPrototype = (props: TodayBandProps & { variant: string }) => {
    const { variant, ...rest } = props;
    if (variant === 'A') return <VariantA {...rest} />;
    if (variant === 'B') return <VariantB {...rest} />;
    if (variant === 'C') return <VariantC {...rest} />;
    return null;
};
