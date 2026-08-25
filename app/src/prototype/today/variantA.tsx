import type { TodayState } from './todayShared';

/**
 * PROTOTYPE variant A — "Ambient". Countdown is a small stat line placed to
 * pair visually with the Race Date block. No new surfaces; the existing
 * DayCard ring does all the today-marking.
 */
export const VariantA = ({ state }: { state: TodayState }) => {
    if (state.daysToRace < 0) return null;

    return (
        <div className="flex justify-end -mt-4 mb-2 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 text-sm">
                {state.currentWeekNumber != null && (
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                        Week{' '}
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                            {state.currentWeekNumber}
                        </span>{' '}
                        of {state.totalDays > 0 ? Math.ceil(state.totalDays / 7) : '—'}
                    </span>
                )}
                <span
                    className={
                        state.daysToRace === 0
                            ? 'px-2.5 py-1 rounded-full bg-rose-500 text-white font-bold shadow-md shadow-rose-500/30'
                            : 'px-2.5 py-1 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold tabular-nums'
                    }
                >
                    🏁 {state.daysToRace === 0 ? 'RACE DAY' : `${state.daysToRace} days to race`}
                </span>
            </div>
        </div>
    );
};
