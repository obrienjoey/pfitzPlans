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
import { TodayBand } from './TodayBand';

/**
 * PROTOTYPE Variant A — 'Log Table'. The whole plan as one dense table,
 * the way the plan appears in the book: rows = weeks, columns = Mon–Sun.
 */
const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const DayCell = ({
    workout,
    units,
    paces,
    isRace,
}: {
    workout: RenderedWorkout;
    units: 'mi' | 'km';
    paces?: TrainingPaces;
    isRace: boolean;
}) => {
    const isRest = workout.tags?.includes('Rest') || workout.title.toLowerCase().includes('rest');
    const zone = getPaceZone(workout.title, workout.tags, workout.zone as never);
    const zc = zoneColor(zone);

    if (isRest && !workout.distance) {
        return (
            <td className="px-2 py-2 align-top border-l dp-border-rule">
                <span className="dp-pencil text-xs">Rest</span>
            </td>
        );
    }

    return (
        <td
            className="px-2 py-2 align-top border-l dp-border-rule"
            style={isRace ? { background: 'var(--dp-marker)', color: 'var(--dp-paper)' } : undefined}
        >
            <div className="flex items-baseline gap-1.5">
                {workout.distance && (
                    <span className="dp-data text-[13px] font-bold whitespace-nowrap">
                        {fmtDist(workout.distance, units)}
                    </span>
                )}
            </div>
            <div
                className="text-[11px] leading-snug mt-0.5 line-clamp-2"
                style={{ borderLeft: !isRace && zc ? `2px solid ${zc}` : undefined, paddingLeft: !isRace && zc ? 5 : undefined }}
            >
                {formatPlanLabel(workout.title, units)}
            </div>
            {!isRace && zone && (
                <div className="mt-0.5">
                    <PaceText zone={zone} paces={paces} units={units} className="text-[10px]" />
                </div>
            )}
        </td>
    );
};

export const DesignVariantA = ({
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

    return (
        <div className="dp-root dp-paper min-h-full pb-28">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
                {/* Masthead */}
                <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b-2 pb-4" style={{ borderColor: 'var(--dp-ink)' }}>
                    <div>
                        <div className="dp-data text-[11px] uppercase tracking-[0.2em] dp-pencil mb-1">Training schedule</div>
                        <h1 className="dp-display dp-ink uppercase text-4xl sm:text-5xl leading-[0.95]">{planName}</h1>
                        {planSource && <p className="dp-pencil text-sm mt-1">{planSource}</p>}
                    </div>
                    <div className="text-left sm:text-right">
                        <div className="dp-data text-[11px] uppercase tracking-[0.2em] dp-pencil">Race day</div>
                        <div className="dp-display dp-ink uppercase text-3xl leading-none">{format(schedule.raceDate, 'MMM d yyyy')}</div>
                        <div className="dp-data text-xs dp-pencil">{format(schedule.raceDate, 'EEEE')}</div>
                    </div>
                </header>

                <TodayBand schedule={schedule} units={units} paces={paces} size="hero" />

                {/* The table */}
                <div className="dp-card overflow-x-auto">
                    <table className="w-full border-collapse min-w-[880px]">
                        <thead>
                            <tr className="border-b dp-border-rule">
                                <th className="dp-data text-[10px] uppercase tracking-[0.15em] dp-pencil text-left px-3 py-2 w-[90px] font-medium">Week</th>
                                {DAY_HEADERS.map((d) => (
                                    <th key={d} className="dp-data text-[10px] uppercase tracking-[0.15em] dp-pencil text-left px-2 py-2 font-medium">
                                        {d}
                                    </th>
                                ))}
                                <th className="dp-data text-[10px] uppercase tracking-[0.15em] dp-pencil text-right px-3 py-2 w-[80px] font-medium">Vol</th>
                            </tr>
                        </thead>
                        <tbody>
                            {schedule.weeks.map((week, wIdx) => {
                                const isCurrent = ctx.weekIndex === wIdx;
                                const vol = calculateWeeklyVolume(week, units);
                                const label =
                                    week.weeksToGoal < 1 ? 'Recovery' : week.weeksToGoal === 1 ? 'Race wk' : `${week.weeksToGoal} to go`;
                                return (
                                    <tr
                                        key={week.weekNumber}
                                        className="border-b dp-border-rule last:border-b-0"
                                        style={isCurrent ? { background: 'var(--dp-marker-soft)', boxShadow: 'inset 3px 0 0 var(--dp-marker)' } : undefined}
                                    >
                                        <td className="px-3 py-2 align-top">
                                            <div className="dp-display dp-ink text-2xl leading-none">WK {week.weekNumber}</div>
                                            <div className="dp-data text-[10px] dp-pencil mt-0.5 whitespace-nowrap">
                                                {label} · {format(week.weekStart, 'MMM d')}
                                            </div>
                                        </td>
                                        {week.workouts.map((w) => {
                                            const isRace = w.tags?.includes('Race') || w.title.toLowerCase().includes('goal race');
                                            const isRaceDay = new Date(w.date).toDateString() === new Date(schedule.raceDate).toDateString();
                                            return (
                                                <DayCell
                                                    key={w.dayOfWeek}
                                                    workout={w}
                                                    units={units}
                                                    paces={paces}
                                                    isRace={isRace || isRaceDay}
                                                />
                                            );
                                        })}
                                        <td className="px-3 py-2 text-right align-top">
                                            <span className="dp-data dp-ink font-bold text-sm whitespace-nowrap">{vol.formatted}</span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
