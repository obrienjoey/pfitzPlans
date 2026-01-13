import type { RenderedWeek } from '../types';
import { DayCard } from './DayCard';

import { usePlanStore } from '../store/usePlanStore';

export const WeekCard = ({ week }: { week: RenderedWeek }) => {
    const { units } = usePlanStore();
    const isMetric = units === 'km';
    const KM_PER_MILE = 1.60934;

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
            <div className="bg-slate-950/50 px-6 py-4 flex items-center justify-between border-b border-slate-800">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-3">
                        <span>Week {week.weekNumber}</span> {/* Just a label guess, or use weeksToGoal */}
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-xs rounded-full font-normal">
                            {week.weeksToGoal === 0 || week.weeksToGoal === 1 ? 'Race Week' : `${week.weeksToGoal} Weeks to Goal`}
                        </span>
                    </h3>
                    <div className="text-sm text-slate-500 mt-0.5">
                        {week.weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – {week.weekEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                </div>
                {totalDistSource > 0 && (
                    <div className="text-right">
                        <div className="text-2xl font-black text-slate-700">
                            {displayTotal}<span className="text-sm ml-1">{units}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Grid: Desktop 7 cols, Tablet 4 cols, Mobile 1 col */}
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
                {week.workouts.map(workout => (
                    <DayCard key={workout.dayOfWeek} workout={workout} units={units} />
                ))}
            </div>
        </div>
    );
};
