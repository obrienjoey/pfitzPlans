import type { TodayState } from './todayShared';
import { tMinus } from './todayShared';

/**
 * PROTOTYPE variant C — "Timeline rail". Wayfinding through the plan's shape:
 * an 18-tick week rail with past weeks filled, a pulsing YOU-ARE-HERE marker,
 * race tick flagged, and T-minus labels every ~4 weeks. Week/day cards keep
 * their existing (baseline) markers only.
 */
export const VariantC = ({
    state,
    totalWeeks,
}: {
    state: TodayState;
    totalWeeks: number;
}) => {
    if (state.daysToRace < 0) return null;

    const currentWeekPos =
        state.currentWeekNumber != null ? state.currentWeekNumber : null;

    return (
        <div className="mb-6 px-1 animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Plan timeline
                </span>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 tabular-nums">
                    {currentWeekPos != null
                        ? `Week ${currentWeekPos} of ${totalWeeks} · ${Math.max(0, Math.ceil(state.daysToRace / 7))} wk to go`
                        : `${tMinus(state.daysToRace)}`}
                </span>
            </div>

            <div className="relative pt-5 pb-6">
                {/* Rail line */}
                <div className="absolute left-0 right-0 top-[26px] h-1 rounded-full bg-slate-200 dark:bg-slate-800" />
                {/* Elapsed overlay */}
                <div
                    className="absolute left-0 top-[26px] h-1 rounded-full bg-gradient-to-r from-indigo-500/70 to-indigo-400"
                    style={{ width: `${state.elapsedPct}%` }}
                />

                {/* T-minus labels every 4 weeks */}
                {[0, 4, 8, 12, 16].filter((w) => w <= totalWeeks).map((w) => (
                    <div
                        key={w}
                        className="absolute -translate-x-1/2 text-center pointer-events-none"
                        style={{ left: `${totalWeeks > 1 ? (w / totalWeeks) * 100 : 0}%`, top: '38px' }}
                    >
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 tabular-nums whitespace-nowrap">
                            {tMinus(Math.max(0, state.daysToRace + (state.currentWeekNumber != null ? (currentWeekPos! - w) * 7 : 0)))}
                        </span>
                    </div>
                ))}

                <div className="relative flex justify-between">
                    {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((weekNum) => {
                        const isPast = currentWeekPos != null && weekNum < currentWeekPos;
                        const isNow = currentWeekPos === weekNum;
                        const isRace = weekNum === totalWeeks;
                        return (
                            <div key={weekNum} className="flex flex-col items-center gap-1" style={{ width: 0 }}>
                                <div
                                    className={
                                        'rounded-full border-2 transition-all ' +
                                        (isNow
                                            ? 'w-4 h-4 bg-indigo-500 border-indigo-300 ring-4 ring-indigo-500/30 animate-pulse'
                                            : isPast
                                              ? 'w-2.5 h-2.5 bg-indigo-400 border-indigo-400'
                                              : isRace
                                                ? 'w-3.5 h-3.5 bg-rose-500 border-rose-300 shadow-md shadow-rose-500/40'
                                                : 'w-2.5 h-2.5 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700')
                                    }
                                    style={{ marginLeft: '-8px', marginTop: isNow ? '-2px' : 0 }}
                                    title={`Week ${weekNum}`}
                                />
                            </div>
                        );
                    })}
                </div>

                {/* You are here flag */}
                {currentWeekPos != null && (
                    <div
                        className="absolute -translate-x-1/2 text-center"
                        style={{
                            left: `${(currentWeekPos / totalWeeks) * 100}%`,
                            top: 0,
                        }}
                    >
                        <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-300 uppercase tracking-wider whitespace-nowrap">
                            ▼ you are here
                        </span>
                    </div>
                )}

                {/* Race flag */}
                <div
                    className="absolute -translate-x-1/2 text-center"
                    style={{ left: '100%', top: 0 }}
                >
                    <span className="text-sm leading-none">🏁</span>
                </div>
            </div>
        </div>
    );
};
