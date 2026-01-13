import type { RenderedWeek } from '../types';
import { DayCard } from './DayCard';
import { usePlanStore } from '../store/usePlanStore';
import type { Paces } from '../lib/paceCalculator';

export const WeekCard = ({ week, weekIndex, paces }: { week: RenderedWeek, weekIndex: number, paces?: Paces }) => {
    const { units } = usePlanStore();
    const isMetric = units === 'km';
    const KM_PER_MILE = 1.60934;

    // UseDroppable context for this week (optional, but good for structure)
    // Actually, we drop onto specific days, so maybe not strictly needed on the week container 
    // unless we want to support dragging *between* weeks. 
    // For now, let's keep it simple.

    // Calculate total volume (in source units, likely miles)
    const totalDistSource = week.workouts.reduce((acc, day) => {
        if (!day.distance) return acc;
        if (typeof day.distance === 'number') return acc + day.distance;
        return acc + ((day.distance[0] + day.distance[1]) / 2); // Average for range
    }, 0);

    // Convert total if needed
    const displayTotal = isMetric
        ? Math.round(totalDistSource * KM_PER_MILE * 10) / 10
        : Math.round(totalDistSource);

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="bg-slate-950/50 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-slate-800">
                <div>
                    <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 sm:gap-3">
                        <span>Week {week.weekNumber}</span>
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] sm:text-xs rounded-full font-normal whitespace-nowrap">
                            {week.weeksToGoal === 0 || week.weeksToGoal === 1 ? 'Race Week' : `${week.weeksToGoal} Weeks to Goal`}
                        </span>
                    </h3>
                    <div className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        {new Date(week.weekStart).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – {new Date(week.weekEnd).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                </div>
                {totalDistSource > 0 && (
                    <div className="text-right">
                        <div className="text-xl sm:text-2xl font-black text-slate-700">
                            {displayTotal}<span className="text-xs sm:text-sm ml-1">{units}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Grid: Desktop 7 cols, Tablet 4 cols, Mobile 1 col */}
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
                {week.workouts.map((workout, dayIndex) => (
                    <DayCard
                        key={workout.dayOfWeek}
                        workout={workout}
                        units={units}
                        id={`week-${weekIndex}-day-${dayIndex}`}
                        paces={paces}
                    />
                ))}
            </div>
        </div>
    );
};
