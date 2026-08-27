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

/**
 * Pfitzinger physiological training zone progression from fastest to easiest:
 * 1. VO2 Max (5K race pace, 93–95% HRmax)
 * 2. Lactate Threshold (15K to HM pace, 82–91% HRmax)
 * 3. Marathon (Goal marathon pace, 79–88% HRmax)
 * 4. Long Run (10–20% slower than MP, 73–84% HRmax)
 * 5. General Aerobic (15–25% slower than MP, 70–81% HRmax)
 * 6. Recovery (> 20% slower than MP, < 76% HRmax)
 */
export const ZONE_ORDER = [
    'VO2 Max',
    'Lactate Threshold',
    'Marathon',
    'Long Run',
    'General Aerobic',
    'Recovery',
] as const;

const ZONE_DETAILS: Record<string, { hr: string; purpose: string }> = {
    'VO2 Max': {
        hr: '93–95% HRmax',
        purpose: '5K race pace intervals (600–1200m). Maximizes oxygen delivery (VO2 max) and running economy.'
    },
    'Lactate Threshold': {
        hr: '82–91% HRmax',
        purpose: '15K–Half Marathon pace tempo (4–7 mi). Shifts lactate threshold to sustain faster paces longer.'
    },
    'Marathon': {
        hr: '79–88% HRmax',
        purpose: 'Goal race pace. Dialing in race-day rhythm, fueling strategy, and glycogen preservation.'
    },
    'Long Run': {
        hr: '73–84% HRmax',
        purpose: '10–20% slower than MP. Endurance backbone, mitochondrial density, capillary growth & fat utilization.'
    },
    'General Aerobic': {
        hr: '70–81% HRmax',
        purpose: '15–25% slower than MP. Standard aerobic conditioning and mileage accumulation without excess fatigue.'
    },
    'Recovery': {
        hr: '< 76% HRmax',
        purpose: 'Gentle conversational running to stimulate blood flow and hasten muscular tissue recovery.'
    },
};

export const PaceChart = ({
    paces,
    equivalents,
    units,
    raceInput,
    planType
}: PaceChartProps) => {
    const [isOpen, setIsOpen] = useState(true);

    if (!paces) return null;

    const isFRRPlan = planType !== 'Marathon';
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

    const racePaces = equivalents
        ? [
              { label: '5K', paceKm: equivalents['5K'] / 5, time: equivalents['5K'], isGoal: raceInput?.distance === '5K' },
              { label: '10K', paceKm: equivalents['10K'] / 10, time: equivalents['10K'], isGoal: raceInput?.distance === '10K' },
              { label: 'Half Marathon', paceKm: equivalents['Half Marathon'] / 21.0975, time: equivalents['Half Marathon'], isGoal: raceInput?.distance === 'Half Marathon' },
              { label: 'Marathon', paceKm: equivalents['Marathon'] / 42.195, time: equivalents['Marathon'], isGoal: raceInput?.distance === 'Marathon' },
          ]
        : [];

    const formatRacePace = (paceKm: number) => {
        const pace = units === 'km' ? paceKm : paceKm * KM_TO_MILE;
        return `${formatTime(pace)} /${units}`;
    };

    // Calculate full track interval table for VO2 Max
    const vo2 = paces['VO2 Max'];
    const trackIntervals = vo2
        ? [
              { distance: '400m', time: `${formatTime(vo2.min * 0.4)}–${formatTime(vo2.max * 0.4)}` },
              { distance: '600m', time: `${formatTime(vo2.min * 0.6)}–${formatTime(vo2.max * 0.6)}` },
              { distance: '800m', time: `${formatTime(vo2.min * 0.8)}–${formatTime(vo2.max * 0.8)}` },
              { distance: '1000m', time: `${formatTime(vo2.min * 1.0)}–${formatTime(vo2.max * 1.0)}` },
              { distance: '1200m', time: `${formatTime(vo2.min * 1.2)}–${formatTime(vo2.max * 1.2)}` },
          ]
        : [];

    // Filter zones in correct speed order
    const orderedZones = ZONE_ORDER.filter(zone => {
        if (isFRRPlan && zone === 'Marathon') return false;
        return Boolean(paces[zone]);
    });

    return (
        <section
            aria-label="Training Paces & Zones"
            className="bg-card border border-rule mb-2 overflow-hidden transition-colors shadow-sm"
        >
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle training paces details"
                aria-expanded={isOpen}
                className="w-full px-5 sm:px-6 py-4 flex items-center justify-between text-left hover:bg-ink/[0.02] transition-colors border-b border-rule"
                title="Toggle Pace Chart"
            >
                <div>
                    <h3 className="font-display font-semibold uppercase text-xl text-ink tracking-wide">Training paces</h3>
                    <p className="text-xs text-pencil font-data mt-0.5">Based on your {raceInput?.time} {raceInput?.distance} race</p>
                </div>
                <div className={clsx("text-pencil transition-transform duration-200", isOpen && "rotate-180")}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                    </svg>
                </div>
            </button>

            {isOpen && (
                <div className="p-4 sm:p-6 animate-in duration-200 space-y-6">

                    {/* ── Visual Pace Continuum Spectrum ── */}
                    <div className="bg-paper/40 border border-rule p-4">
                        <div className="flex justify-between items-center mb-2 font-data text-[9px] uppercase tracking-widest text-pencil">
                            <span>← Highest Intensity (Aerobic Max)</span>
                            <span>Active Recovery →</span>
                        </div>
                        <div className={`grid grid-cols-2 sm:grid-cols-${orderedZones.length} gap-1.5`}>
                            {orderedZones.map((zone) => {
                                const range = paces[zone];
                                if (!range) return null;
                                const zc = zoneColor(zone);
                                return (
                                    <div
                                        key={zone}
                                        className="p-2 border text-center flex flex-col justify-between gap-1 transition-colors"
                                        style={{ backgroundColor: `${zc}15`, borderColor: zc ?? 'var(--rule)' }}
                                    >
                                        <span className="font-data text-[9px] uppercase font-bold truncate" style={{ color: zc ?? 'var(--ink)' }}>
                                            {zone} Pace
                                        </span>
                                        <span className="font-data font-bold text-xs text-ink leading-tight">
                                            {units === 'km' ? formatTime(range.min) : formatTime(range.min * KM_TO_MILE)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Race Equivalents ── */}
                    {racePaces.length > 0 && (
                        <div>
                            <div className="font-data text-[10px] text-pencil font-bold uppercase tracking-[0.16em] mb-2.5">
                                Race paces
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {racePaces.map(({ label, paceKm, time, isGoal }) => (
                                    <div
                                        key={label}
                                        className={clsx(
                                            "border p-3 flex flex-col gap-1 transition-colors",
                                            isGoal ? "bg-marker/5 border-marker" : "bg-card border-rule"
                                        )}
                                    >
                                        <span className={clsx("font-data text-[10px] uppercase font-bold", isGoal ? "text-marker" : "text-pencil")}>
                                            {label} {isGoal && "★"}
                                        </span>
                                        <span className="font-data font-bold text-lg text-ink">
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

                    {/* ── Training Zones List (Ordered Fastest to Slowest) ── */}
                    <div>
                        <div className="font-data text-[10px] text-pencil font-bold uppercase tracking-[0.16em] mb-2.5">
                            Training zones
                        </div>
                        <div className="border border-rule divide-y divide-rule">
                            {orderedZones.map((zone) => {
                                const range = paces[zone];
                                if (!range) return null;
                                const meta = ZONE_DETAILS[zone];
                                const zc = zoneColor(zone);

                                return (
                                    <div key={zone} className="p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-paper/40 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <span className="w-3 h-3 rounded-none shrink-0" style={{ backgroundColor: zc ?? 'var(--pencil)' }} />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-data font-bold text-sm text-ink">{zone}</span>
                                                    {meta?.hr && <span className="font-data text-[10px] text-pencil">({meta.hr})</span>}
                                                </div>
                                                {meta?.purpose && <p className="text-xs text-pencil max-w-lg mt-0.5">{meta.purpose}</p>}
                                            </div>
                                        </div>
                                        <div className="font-data font-bold text-base text-ink shrink-0 sm:text-right">
                                            {zone === 'Recovery' ? `> ${formatRange({ min: range.min, max: range.min })}` : formatRange(range)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Track Split Calculator ── */}
                    {trackIntervals.length > 0 && (
                        <div>
                            <div className="font-data text-[10px] text-pencil font-bold uppercase tracking-[0.16em] mb-2.5">
                                Track Interval Split Guide (VO2 Max / 5K Pace)
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-data">
                                {trackIntervals.map(t => (
                                    <div key={t.distance} className="bg-paper/50 border border-rule p-2.5 text-center">
                                        <div className="text-[10px] text-pencil uppercase font-bold">{t.distance}</div>
                                        <div className="text-sm font-bold text-ink mt-0.5">{t.time}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            )}
        </section>
    );
};
