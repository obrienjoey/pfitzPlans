import { useMemo, useState } from 'react';
import { usePlanStore } from '../store/usePlanStore';
import {
    calculateTrainingPaces,
    formatTime,
    formatTimeHMS,
    parseTimeString,
    type TrainingPaces,
    type EquivalentTimes,
} from '../lib/paceCalculator';
import { AVAILABLE_PLANS } from '../config';
import clsx from 'clsx';

export const PaceChart = ({ paces: initialPaces, equivalents: initialEquivs }: { paces?: TrainingPaces, equivalents?: EquivalentTimes }) => {
    const { raceInput, units, selectedPlanId } = usePlanStore();
    const [isOpen, setIsOpen] = useState(false);

    const planInfo = AVAILABLE_PLANS.find(p => p.id === selectedPlanId);
    const planType = planInfo?.type || 'Marathon';

    const data = useMemo(() => {
        if (initialPaces) return { paces: initialPaces, equivalents: initialEquivs, t10: null };
        if (!raceInput) return null;
        const totalSeconds = parseTimeString(raceInput.time);
        if (!totalSeconds) return null;
        return calculateTrainingPaces({ distance: raceInput.distance, timeSeconds: totalSeconds }, planType);
    }, [raceInput, initialPaces, initialEquivs, planType]);

    if (!data || !data.paces) return null;

    const { paces, equivalents } = data;

    // For FRR plans (non-marathon) hide the 'Marathon' training zone — it's the
    // extrapolated marathon-equivalent pace which is not a relevant training target.
    const isFRRPlan = planType !== 'Marathon';
    const filteredPaces = isFRRPlan
        ? Object.fromEntries(Object.entries(paces).filter(([zone]) => zone !== 'Marathon'))
        : paces;

    const KM_TO_MILE = 1.60934;

    const formatRange = (range: { min: number; max: number }) => {
        if (units === 'km') {
            if (range.min === range.max) return `${formatTime(range.min)} /km`;
            return `${formatTime(range.min)} – ${formatTime(range.max)} /km`;
        }
        const minMile = range.min * KM_TO_MILE;
        const maxMile = range.max * KM_TO_MILE;
        if (range.min === range.max) return `${formatTime(minMile)} /mi`;
        return `${formatTime(minMile)} – ${formatTime(maxMile)} /mi`;
    };

    // Derive per-km race paces from equivalents, then convert to per-mile if needed.
    // These are computed regardless of which race distance the user entered.
    const racePaces = equivalents
        ? [
              {
                  label: '5K',
                  paceKm: equivalents['5K'] / 5,
                  time: equivalents['5K'],
                  isGoal: raceInput?.distance === '5K',
              },
              {
                  label: '10K',
                  paceKm: equivalents['10K'] / 10,
                  time: equivalents['10K'],
                  isGoal: raceInput?.distance === '10K',
              },
              {
                  label: 'Half Marathon',
                  paceKm: equivalents['Half Marathon'] / 21.0975,
                  time: equivalents['Half Marathon'],
                  isGoal: raceInput?.distance === 'Half Marathon',
              },
              {
                  label: 'Marathon',
                  paceKm: equivalents['Marathon'] / 42.195,
                  time: equivalents['Marathon'],
                  isGoal: raceInput?.distance === 'Marathon',
              },
          ]
        : [];

    const formatRacePace = (paceKm: number) => {
        const pace = units === 'km' ? paceKm : paceKm * KM_TO_MILE;
        return `${formatTime(pace)} /${units}`;
    };

    return (
        <div className="w-full bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden mb-8 transition-all">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors"
                title="Toggle Pace Chart"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.732 6.232a2.5 2.5 0 013.536 0 .75.75 0 101.06-1.06A4 4 0 006.5 8v.165c0 .364.034.728.1 1.085h-.35a.75.75 0 000 1.5h.737a5.25 5.25 0 01-.367 3.072.75.75 0 001.372.608 3.75 3.75 0 00.358-2.18H10a.75.75 0 000-1.5h-1.5v-.165a2.5 2.5 0 01.232-1.048z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-100">Training Paces</h3>
                        <p className="text-xs text-slate-400">Based on {raceInput?.time} {raceInput?.distance} race</p>
                    </div>
                </div>
                <div className={clsx("text-slate-500 transition-transform duration-200", isOpen && "rotate-180")}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                    </svg>
                </div>
            </button>

            {isOpen && (
                <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-200 space-y-6">

                    {/* ── Race Paces ── */}
                    {racePaces.length > 0 && (
                        <div>
                            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-3">Race Paces</div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {racePaces.map(({ label, paceKm, time, isGoal }) => (
                                    <div
                                        key={label}
                                        className={clsx(
                                            "p-3 rounded-lg border flex flex-col gap-1 transition-colors",
                                            isGoal
                                                ? "bg-indigo-500/10 border-indigo-500/40 ring-1 ring-indigo-500/20"
                                                : "bg-slate-950 border-slate-800 hover:border-slate-700"
                                        )}
                                    >
                                        <span className={clsx(
                                            "text-xs font-bold uppercase tracking-wider",
                                            isGoal ? "text-indigo-400" : "text-slate-500"
                                        )}>
                                            {label}{isGoal && " ★"}
                                        </span>
                                        <span className={clsx(
                                            "font-mono font-bold text-base leading-none",
                                            isGoal ? "text-indigo-200" : "text-slate-200"
                                        )}>
                                            {formatRacePace(paceKm)}
                                        </span>
                                        <span className="text-[11px] text-slate-500 font-mono">
                                            {formatTimeHMS(time)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Training Zones ── */}
                    <div>
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-3">Training Zones</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {Object.entries(filteredPaces).map(([zone, range]) => {
                                if (!range) return null;
                                return (
                                    <div key={zone} className="bg-slate-950 border border-slate-800 p-3 rounded-lg flex justify-between items-center group hover:border-slate-700 transition-colors">
                                        <span className={clsx(
                                            "text-sm font-medium",
                                            zone === 'Recovery' && "text-slate-400",
                                            zone === 'General Aerobic' && "text-slate-300",
                                            zone === 'Long Run' && "text-amber-400",
                                            zone === 'Marathon' && "text-emerald-400 font-bold",
                                            zone === 'Race Equivalent' && "text-emerald-400 font-bold",
                                            zone === 'Lactate Threshold' && "text-orange-400",
                                            zone === 'VO2 Max' && "text-rose-400",
                                            zone.includes('Speed') && "text-purple-400"
                                        )}>{zone}</span>
                                        <span className="font-mono font-bold text-slate-200 bg-slate-900 px-2 py-1 rounded text-sm">
                                            {zone === 'Recovery' ? `> ${formatRange({ min: range.min, max: range.min })}` : formatRange(range)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
};
