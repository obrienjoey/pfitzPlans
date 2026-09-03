import { useMemo, useState } from 'react';
import {
    formatTime,
    formatTimeHMS,
    getFrrRangeStatus,
    parseTimeString,
    to10KEquivalent,
    type TrainingPaces,
    type EquivalentTimes,
} from '../lib/paceCalculator';
import { KM_PER_MILE } from '../lib/constants';
import { zoneColor } from '../lib/zoneColors';
import type { RaceInputState } from '../store/usePlanStore';
import clsx from 'clsx';

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

    const frrWarning = useMemo(() => {
        if (planType === 'Marathon' || !raceInput) return null;
        const secs = parseTimeString(raceInput.time);
        if (secs == null) return null;
        try {
            const t10 = to10KEquivalent({ distance: raceInput.distance, timeSeconds: secs });
            return getFrrRangeStatus(t10);
        } catch {
            return null;
        }
    }, [planType, raceInput]);

    if (!paces) return null;

    const isFRRPlan = planType !== 'Marathon';
    const KM_TO_MILE = KM_PER_MILE;

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

    // Calculate full track interval table for VO2 Max.
    // When the zone is a single pace (min == max), show one value, not "1:44–1:44".
    const vo2 = paces['VO2 Max'];
    const formatSplit = (secs: number, scale: number) => formatTime(secs * scale);
    const trackIntervals = vo2
        ? [
              { distance: '400m', scale: 0.4 },
              { distance: '600m', scale: 0.6 },
              { distance: '800m', scale: 0.8 },
              { distance: '1000m', scale: 1.0 },
              { distance: '1200m', scale: 1.2 },
          ].map(({ distance, scale }) => {
              const lo = formatSplit(vo2.min, scale);
              const hi = formatSplit(vo2.max, scale);
              return { distance, time: lo === hi ? lo : `${lo}–${hi}` };
          })
        : [];

    // Filter zones in correct speed order
    const orderedZones = ZONE_ORDER.filter(zone => {
        if (isFRRPlan && zone === 'Marathon') return false;
        return Boolean(paces[zone]);
    });

    // Ladder scaling: the fastest zone fills the bar, slower zones shrink
    // proportionally. Speed is encoded by length using each zone's midpoint,
    // so open-ended Recovery (> GA max) still lands shorter than GA.
    // Bars stay ink throughout — the 8px dot carries the zone color shared
    // with day rows, so intensity red never fills a bar and collides with marker red.
    const midPace = (zone: typeof orderedZones[number]) => {
        const r = paces[zone]!;
        return (r.min + r.max) / 2;
    };
    const fastestMid = Math.min(...orderedZones.map(midPace));
    const ladderWidth = (zone: typeof orderedZones[number]) =>
        `${Math.max(8, Math.round((fastestMid / midPace(zone)) * 100))}%`;

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
                    <p className="text-xs text-pencil font-data mt-0.5">Based on your {(raceInput?.time ?? '').replace(/^0:/, '')} {raceInput?.distance} race</p>
                </div>
                <div className={clsx("text-pencil transition-transform duration-200", isOpen && "rotate-180")}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                    </svg>
                </div>
            </button>

            {isOpen && (
                <div className="p-4 sm:p-6 animate-in duration-200 space-y-6">
                    {(frrWarning === 'low' || frrWarning === 'high') && (
                        <div
                            role="note"
                            className="border border-marker/40 bg-marker/5 px-3 py-2 font-data text-xs text-ink"
                        >
                            {frrWarning === 'low'
                                ? 'Benchmark is faster than the Faster Road Racing table — paces are clamped to the fastest row and may be conservative.'
                                : 'Benchmark is slower than the Faster Road Racing table — paces are clamped to the slowest row and may be optimistic.'}
                        </div>
                    )}

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

                    {/* ── Training Zones Ladder (fastest first, longer bar = faster) ── */}
                    <div>
                        <div className="font-data text-[10px] text-pencil font-bold uppercase tracking-[0.16em] mb-2.5">
                            Training zones
                        </div>
                        <div className="border border-rule divide-y divide-rule">
                            {orderedZones.map((zone) => {
                                const range = paces[zone];
                                if (!range) return null;
                                const meta = ZONE_DETAILS[zone];

                                return (
                                    <div key={zone} className="p-3 sm:px-4 sm:grid sm:grid-cols-[170px_1fr_170px] sm:items-center sm:gap-4">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    aria-hidden="true"
                                                    className="w-2 h-2 rounded-full flex-none"
                                                    style={{ backgroundColor: zoneColor(zone) ?? 'var(--ink)' }}
                                                />
                                                <span className="font-data font-bold text-sm text-ink">{zone}</span>
                                                {meta?.hr && <span className="font-data text-[10px] text-pencil">({meta.hr})</span>}
                                            </div>
                                            {meta?.purpose && <p className="text-xs text-pencil mt-0.5 sm:hidden">{meta.purpose}</p>}
                                        </div>
                                        <div className="mt-2 sm:mt-0">
                                            <div className="h-4 bg-paper border border-rule" aria-hidden="true">
                                                <div className="h-full bg-ink" style={{ width: ladderWidth(zone) }} />
                                            </div>
                                            {meta?.purpose && <p className="hidden sm:block text-xs text-pencil mt-1 max-w-lg">{meta.purpose}</p>}
                                        </div>
                                        <div className="font-data font-bold text-base text-ink shrink-0 sm:text-right mt-1.5 sm:mt-0">
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
