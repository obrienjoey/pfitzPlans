import { format } from 'date-fns';
import type { RenderedPlan } from '../../types';
import type { TrainingPaces } from '../../lib/paceCalculator';
import { getPaceZone } from '../../lib/paceCalculator';
import { getTodayContext } from '../../lib/todayContext';
import { formatPlanLabel } from '../../lib/formatters';
import { fmtDist } from './tokens';
import { PaceText } from './shared';

/**
 * PROTOTYPE signature element — today as a log-page entry.
 * `hero` scale opens variants A/B; `compact` opens variant C.
 * Pass `onJump` to make the whole band click/keyboard-activate a scroll to today's row.
 */
export const TodayBand = ({
    schedule,
    units,
    paces,
    size,
    onJump,
}: {
    schedule: RenderedPlan;
    units: 'mi' | 'km';
    paces?: TrainingPaces;
    size: 'hero' | 'compact';
    onJump?: () => void;
}) => {
    const ctx = getTodayContext(schedule);
    if (ctx.daysToRace < 0) return null;

    const workout = ctx.workout;
    const isRaceDay = ctx.daysToRace === 0;
    const isRest = !workout || workout.tags?.includes('Rest') || workout.title.toLowerCase().includes('rest');
    const zone = workout ? getPaceZone(workout.title, workout.tags, workout.zone as never) : null;
    const hero = size === 'hero';

    return (
        <section
            className={`dp-card relative flex items-stretch ${hero ? 'min-h-[150px]' : 'min-h-[92px]'} ${
                onJump ? 'cursor-pointer text-left w-full hover:bg-[var(--dp-marker-soft)] transition-colors' : ''
            }`}
            onClick={onJump}
            onKeyDown={
                onJump
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onJump();
                        }
                    }
                    : undefined
            }
            role={onJump ? 'button' : undefined}
            tabIndex={onJump ? 0 : undefined}
            aria-label={onJump ? "Jump to today's workout" : undefined}
        >
            {/* Left: the log entry */}
            <div className="flex-1 min-w-0 px-5 sm:px-7 py-4 flex flex-col justify-center gap-1">
                <div className="flex items-center gap-3">
                    <span className="dp-circle dp-marker dp-data text-[10px] font-bold uppercase tracking-[0.18em] px-2.5 py-1">
                        Today
                    </span>
                    <span className="dp-data text-[11px] uppercase tracking-[0.14em] dp-pencil">
                        {format(new Date(), 'EEE d MMM')}
                        {ctx.currentWeekNumber !== null && ` · week ${ctx.currentWeekNumber}`}
                    </span>
                </div>

                {isRest ? (
                    <p className={`dp-display dp-pencil uppercase ${hero ? 'text-3xl sm:text-4xl' : 'text-xl'}`}>
                        Rest or cross-train
                    </p>
                ) : (
                    <p className={`dp-display dp-ink uppercase leading-none ${hero ? 'text-4xl sm:text-5xl' : 'text-2xl'}`}>
                        {formatPlanLabel(workout!.title, units)}
                    </p>
                )}

                <div className="flex items-center gap-3 flex-wrap">
                    {workout?.distance && (
                        <span className={`dp-data dp-ink font-bold ${hero ? 'text-lg' : 'text-sm'}`}>
                            {fmtDist(workout.distance, units)}
                        </span>
                    )}
                    {workout && <PaceText zone={zone} paces={paces} units={units} className="text-sm" />}
                    {workout?.description && (
                        <span className="dp-pencil text-xs hidden sm:inline truncate max-w-[320px]">
                            {formatPlanLabel(workout.description, units)}
                        </span>
                    )}
                </div>
            </div>

            {/* Right: T-minus block */}
            <div
                className={`flex-none flex flex-col items-center justify-center px-5 sm:px-7 border-l dp-border-rule ${
                    isRaceDay ? 'bg-[var(--dp-marker-soft)]' : ''
                }`}
            >
                <span className="dp-data text-[10px] uppercase tracking-[0.2em] dp-pencil mb-0.5">
                    {isRaceDay ? 'Race day' : 'To race'}
                </span>
                <span
                    className={`dp-display leading-none ${
                        isRaceDay ? 'dp-marker' : 'dp-ink'
                    } ${hero ? 'text-6xl sm:text-7xl' : 'text-4xl'}`}
                    style={{ fontWeight: 700 }}
                >
                    {isRaceDay ? 'RACE' : `T−${ctx.daysToRace}`}
                </span>
                <span className="dp-data text-[10px] dp-pencil mt-1">{ctx.elapsedPct}% of plan done</span>
            </div>
        </section>
    );
};
