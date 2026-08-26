import { useState } from 'react';
import {
    formatTime,
    formatTimeHMS,
    type TrainingPaces,
    type EquivalentTimes,
} from '../lib/paceCalculator';
import type { RaceInputState } from '../store/usePlanStore';
import clsx from 'clsx';
import { zoneColor } from '../lib/zoneColors';

export interface PaceChartProps {
    paces?: TrainingPaces;
    equivalents?: EquivalentTimes;
    units: 'mi' | 'km';
    raceInput: RaceInputState | null;
    planType: string;
}

export const PaceChart = ({
    paces,
    equivalents,
    units,
    raceInput,
    planType
}: PaceChartProps) => {
    const [isOpen, setIsOpen] = useState(true);

    if (!paces) return null;

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
        <div className="bg-card border border-rule mb-2 overflow-hidden transition-colors">
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle training paces details"
                aria-expanded={isOpen}
                className="w-full px-5 sm:px-6 py-4 flex items-center justify-between text-left hover:bg-marker/5 transition-colors"
                title="Toggle Pace Chart"
            >
                <div>
                    <h3 className="font-display font-semibold uppercase text-xl text-ink tracking-wide">Training paces</h3>
                    <p className="text-xs text-pencil font-data">Based on your {raceInput?.time} {raceInput?.distance} race</p>
                </div>
                <div className={clsx("text-pencil transition-transform duration-200", isOpen && "rotate-180")}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                    </svg>
                </div>
            </button>

            {isOpen && (
                <div className="px-6 pb-6 animate-in duration-200 space-y-6">

                    {/* ── Race Paces ── */}
                    {racePaces.length > 0 && (
                        <div>
                            <div className="font-data text-[10px] text-pencil font-bold uppercase tracking-[0.15em] mb-3">Race paces</div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-rule border border-rule">
                                {racePaces.map(({ label, paceKm, time, isGoal }) => (
                                    <div key={label} className={clsx("bg-card p-3 flex flex-col gap-1", isGoal && "bg-marker/5")}>
                                        <span className={clsx(
                                            "font-data text-[10px] uppercase font-bold tracking-[0.15em]",
                                            isGoal ? "text-marker" : "text-pencil"
                                        )}>
                                            {label}
                                        </span>
                                        <span className="font-data font-bold text-base leading-none text-ink">
                                            {formatRacePace(paceKm)}
                                        </span>
                                        <span className="text-[11px] text-pencil font-data">
                                            {formatTimeHMS(time)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Training Zones ── */}
                    <div>
                        <div className="font-data text-[10px] text-pencil font-bold uppercase tracking-[0.15em] mb-3">Training zones</div>
                        <div className="border border-rule divide-y divide-rule">
                            {Object.entries(filteredPaces).map(([zone, range]) => {
                                if (!range) return null;
                                return (
                                    <div key={zone} className="flex justify-between items-center gap-4 px-3 py-2">
                                        <span
                                            className="font-data text-sm"
                                            style={{ color: zoneColor(zone) ?? 'var(--pencil)' }}
                                        >
                                            {zone}
                                        </span>
                                        <span className="font-data font-bold text-ink text-sm whitespace-nowrap">
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
