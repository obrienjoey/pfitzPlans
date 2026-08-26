import type { RenderedPlan, RenderedWorkout } from '../../types';
import type { TrainingPaces } from '../../lib/paceCalculator';
import { formatPlanLabel } from '../../lib/formatters';
import { Row, Sheet, paceFor, weeksIsCurrent } from './shared';

/**
 * PROTOTYPE Variant B — Sticky note. Tapping a day sticks a coach's paper note
 * beside the row. It overlays neighbours (no reflow); the date is written in
 * marker red on the note.
 */
const Note = ({ workout, units, paces }: { workout: RenderedWorkout; units: 'mi' | 'km'; paces?: TrainingPaces }) => {
    const pace = paceFor(workout, paces, units);
    const today = new Date(workout.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
    return (
        <div className="pointer-events-none absolute right-3 top-1/2 z-30 w-[200px] sm:w-[240px] -translate-y-1/2 rotate-1 bg-[#FBF3D5] border border-[#E4D9A8] shadow-lg p-3 animate-in fade-in zoom-in-95 duration-150">
            <div className="font-data text-[10px] uppercase tracking-wider text-[#B08936] mb-1">{today}</div>
            <div className="text-[13px] font-semibold text-ink leading-snug">{formatPlanLabel(workout.title, units)}</div>
            {pace && (
                <div className="mt-1.5 font-data text-sm font-bold" style={{ color: pace.color }}>{pace.text}</div>
            )}
            {workout.description && (
                <div className="mt-1 text-xs text-pencil leading-snug">{formatPlanLabel(workout.description, units)}</div>
            )}
        </div>
    );
};

export const VariantB = ({ schedule, units, paces }: { schedule: RenderedPlan; units: 'mi' | 'km'; paces?: TrainingPaces }) => {
    return (
        <div className="space-y-5">
            {schedule.weeks.map((week) => (
                <Sheet key={week.weekNumber} week={week} isCurrent={weeksIsCurrent(week)} row={(w) => (
                    <div key={w.dayOfWeek} className="relative">
                        <Row workout={w} units={units} isToday={false} reveal={<Note workout={w} units={units} paces={paces} />} />
                    </div>
                )} />
            ))}
        </div>
    );
};
