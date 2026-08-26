import { format } from 'date-fns';
import type { RenderedWeek } from '../types';
import { DayCard } from './DayCard';
import { usePlanStore } from '../store/usePlanStore';
import type { TrainingPaces } from '../lib/paceCalculator';
import { calculateWeeklyVolume } from '../lib/calculator';

/**
 * A week as a coach's session sheet: giant week numeral, the date range and
 * countdown label, the week's volume, then one ruled line per day.
 */
export const WeekCard = ({
    week,
    weekIndex,
    paces,
    activeId,
    overId
}: {
    week: RenderedWeek,
    weekIndex: number,
    paces?: TrainingPaces,
    activeId?: string,
    overId?: string
}) => {
    const { units } = usePlanStore();
    const today = new Date();
    const isCurrentWeek = today >= new Date(week.weekStart) && today <= new Date(week.weekEnd);

    const displayTotal = calculateWeeklyVolume(week, units);
    const label =
        week.weeksToGoal < 1
            ? 'Recovery week'
            : week.weeksToGoal === 1
                ? 'Race week'
                : `${week.weeksToGoal} weeks to go`;

    return (
        <section
            id={`week-card-${weekIndex}`}
            className="scroll-mt-24 bg-card border border-rule"
            style={isCurrentWeek ? { boxShadow: '0 0 0 1.5px rgb(var(--marker))' } : undefined}
        >
            {/* Sheet header */}
            <div
                className="flex items-center gap-4 px-3 sm:px-5 py-2.5 border-b border-rule"
                style={isCurrentWeek ? { background: 'rgb(var(--marker) / 0.06)' } : undefined}
            >
                <div className="font-display font-bold text-ink text-3xl sm:text-4xl leading-none w-14 sm:w-16 flex-none">
                    {String(week.weekNumber).padStart(2, '0')}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-data text-[10px] uppercase tracking-[0.18em] text-pencil">
                        {format(week.weekStart, 'MMM d')} – {format(week.weekEnd, 'MMM d')}
                        {isCurrentWeek && <span className="text-marker font-bold"> · this week</span>}
                    </div>
                    <div className="text-xs text-pencil">{label}</div>
                </div>
                {displayTotal.average > 0 && (
                    <div className="text-right flex-none">
                        <span className="font-data text-ink font-bold text-lg leading-none">{displayTotal.formatted}</span>
                        <span className="font-data text-[10px] text-pencil ml-1">{units}</span>
                    </div>
                )}
            </div>

            {/* Day rows */}
            <div>
                {week.workouts.map((workout, dayIndex) => {
                    const dayId = `week-${weekIndex}-day-${dayIndex}`;
                    return (
                        <DayCard
                            key={workout.dayOfWeek}
                            workout={workout}
                            units={units}
                            id={dayId}
                            weekIndex={weekIndex}
                            dayIndex={dayIndex}
                            paces={paces}
                            isOver={overId === dayId}
                            isActive={activeId === dayId}
                        />
                    );
                })}
            </div>
        </section>
    );
};
