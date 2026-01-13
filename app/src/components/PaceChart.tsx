import { useMemo, useState } from 'react';
import { usePlanStore } from '../store/usePlanStore';
import { calculatePaces, formatTime, parseTimeString } from '../lib/paceCalculator';
import clsx from 'clsx';

export const PaceChart = () => {
    const { goalTime, units } = usePlanStore();
    const [isOpen, setIsOpen] = useState(false);

    const paces = useMemo(() => {
        if (!goalTime) return null;
        const totalSeconds = parseTimeString(goalTime);
        if (!totalSeconds) return null;

        // Calculate MP per km (Plan goal is marathon distance = 42.195)
        const mpPerKm = totalSeconds / 42.195;

        return calculatePaces(mpPerKm);
    }, [goalTime]);

    if (!paces) return null;

    const KM_TO_MILE = 1.60934;

    const formatRange = (range: { min: number, max: number }) => {
        if (units === 'km') {
            if (range.min === range.max) {
                return `${formatTime(range.min)} /km`;
            }
            return `${formatTime(range.min)} - ${formatTime(range.max)} /km`;
        }
        // Convert seconds/km to seconds/mile
        // time/mile = time/km * 1.60934
        const minMile = range.min * KM_TO_MILE;
        const maxMile = range.max * KM_TO_MILE;

        if (range.min === range.max) {
            return `${formatTime(minMile)} /mi`;
        }
        return `${formatTime(minMile)} - ${formatTime(maxMile)} /mi`;
    };

    return (
        <div className="w-full bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden mb-8 transition-all">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.732 6.232a2.5 2.5 0 013.536 0 .75.75 0 101.06-1.06A4 4 0 006.5 8v.165c0 .364.034.728.1 1.085h-.35a.75.75 0 000 1.5h.737a5.25 5.25 0 01-.367 3.072.75.75 0 001.372.608 3.75 3.75 0 00.358-2.18H10a.75.75 0 000-1.5h-1.5v-.165a2.5 2.5 0 01.232-1.048z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-100">Training Paces</h3>
                        <p className="text-xs text-slate-400">Based on {goalTime} goal</p>
                    </div>
                </div>
                <div className={clsx("text-slate-500 transition-transform duration-200", isOpen && "rotate-180")}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                    </svg>
                </div>
            </button>

            {isOpen && (
                <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Object.entries(paces).map(([zone, range]) => (
                            <div key={zone} className="bg-slate-950 border border-slate-800 p-3 rounded-lg flex justify-between items-center group hover:border-slate-700 transition-colors">
                                <span className={clsx(
                                    "text-sm font-medium",
                                    zone === 'Recovery' && "text-slate-400",
                                    zone === 'General Aerobic' && "text-slate-300",
                                    zone === 'Long Run' && "text-amber-400",
                                    zone === 'Marathon' && "text-emerald-400 font-bold",
                                    zone === 'Lactate Threshold' && "text-orange-400",
                                    zone === 'VO2 Max' && "text-rose-400"
                                )}>{zone}</span>
                                <span className="font-mono font-bold text-slate-200 bg-slate-900 px-2 py-1 rounded text-sm">
                                    {formatRange(range)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
