import type { RenderedPlan, RenderedWorkout } from '../../types';
import type { TrainingPaces } from '../../lib/paceCalculator';
import { formatPlanLabel } from '../../lib/formatters';
import { Row, Sheet, paceFor, weeksIsCurrent, isRestWorkout, isTodayWorkout } from './shared';

/**
 * PROTOTYPE Variant A — Inline accordion. Tapping a day expands the row in
 * place: a pace line + the full description appear beneath the title, and the
 * list reflows.
 */
const InlineReveal = ({ workout, units, paces }: { workout: RenderedWorkout; units: 'mi' | 'km'; paces?: TrainingPaces }) => {
    const pace = paceFor(workout, paces, units);
    return (
        <div className="px-3 sm:px-4 pb-2.5 -mt-1">
            <div className="pl-5 border-l-2" style={{ borderColor: pace?.color ?? 'var(--rule)' }}>
                {pace && (
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-data text-sm font-bold" style={{ color: pace.color }}>{pace.text}</span>
                        <span className="text-[10px] uppercase tracking-wider text-pencil font-data">{pace.zone}</span>
                    </div>
                )}
                {workout.description && (
                    <p className="text-xs text-ink leading-relaxed">{formatPlanLabel(workout.description, units)}</p>
                )}
            </div>
        </div>
    );
};

export const VariantA = ({ schedule, units, paces }: { schedule: RenderedPlan; units: 'mi' | 'km'; paces?: TrainingPaces }) => {
    return (
        <div className="space-y-5">
            {schedule.weeks.map((week) => (
                <Sheet key={week.weekNumber} week={week} isCurrent={weeksIsCurrent(week)} row={(w) => (
                    <Row key={w.dayOfWeek} workout={w} units={units} isToday={isTodayWorkout(w)} expandable={!isRestWorkout(w)} reveal={<InlineReveal workout={w} units={units} paces={paces} />} />
                )} />
            ))}
        </div>
    );
};
