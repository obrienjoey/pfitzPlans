import type { TodayState } from './todayShared';
import { scrollToToday, tMinus } from './todayShared';
import { format } from 'date-fns';

/**
 * PROTOTYPE variant B — "Today strip". A sticky elevated bar that pins under
 * the app header: today's workout, plan progress bar, T-minus pill. Clicking
 * it scrolls to today's card. The DayCard ring stays as-is (baseline).
 */
export const VariantB = ({ state }: { state: TodayState }) => {
    if (state.daysToRace < 0) return null;

    const clickable = state.weekIndex >= 0 && state.dayIndex >= 0;

    return (
        <div className="sticky top-[68px] z-40 mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <button
                onClick={() => clickable && scrollToToday(state)}
                disabled={!clickable}
                className={
                    'w-full flex items-center gap-3 sm:gap-4 px-4 py-2.5 rounded-xl border shadow-lg text-left transition-all ' +
                    'bg-indigo-950/95 dark:bg-indigo-950/90 border-indigo-500/30 backdrop-blur-sm shadow-indigo-950/20 ' +
                    (clickable ? 'cursor-pointer hover:border-indigo-400/50 hover:shadow-indigo-500/10' : 'cursor-default')
                }
            >
                {/* Today block */}
                <div className="flex-none min-w-0">
                    <div className="text-[10px] font-black uppercase tracking-widest text-indigo-300/80">
                        Today · {format(new Date(), 'EEE d MMM')}
                    </div>
                    <div className="text-sm font-bold text-white truncate max-w-[180px] sm:max-w-xs">
                        {state.title ?? 'Outside plan — rest or adjust'}
                        {state.distanceLabel && (
                            <span className="ml-2 font-mono font-semibold text-indigo-200">
                                {state.distanceLabel}
                            </span>
                        )}
                    </div>
                </div>

                {/* Progress rail */}
                <div className="flex-1 hidden sm:block">
                    <div className="h-1.5 w-full rounded-full bg-indigo-900/80 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-rose-400"
                            style={{ width: `${state.elapsedPct}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-1 text-[9px] font-bold uppercase tracking-wider text-indigo-300/60">
                        <span>{state.elapsedPct}% done</span>
                        <span>race</span>
                    </div>
                </div>

                {/* T-minus pill */}
                <div
                    className={
                        'flex-none px-3 py-1.5 rounded-lg font-black tabular-nums text-lg leading-none ' +
                        (state.daysToRace === 0
                            ? 'bg-rose-500 text-white animate-pulse'
                            : 'bg-indigo-500/20 text-indigo-100 border border-indigo-400/30')
                    }
                >
                    {tMinus(state.daysToRace)}
                </div>
            </button>
        </div>
    );
};
