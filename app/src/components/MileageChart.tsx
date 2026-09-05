import { useMemo, useState } from 'react';
import type { RenderedWeek, Distance } from '../types';
import { calculateWeeklyVolume } from '../lib/calculator';
import { KM_PER_MILE } from '../lib/constants';
import { getPaceZone } from '../lib/paceCalculator';

/** Zones that count as quality (top stack) rather than aerobic base. */
const QUALITY_ZONES = new Set(['Lactate Threshold', 'VO2 Max', 'Marathon', 'Race Equivalent']);

export interface MileageChartProps {
    weeks: RenderedWeek[];
    units: 'mi' | 'km';
    /** Logged mileage per week (null = week hasn't started, planned-only). */
    actualVolumes?: (number | null)[];
}

const getWorkoutDist = (dist?: Distance, units: 'mi' | 'km' = 'mi'): number => {
    if (!dist) return 0;
    const raw = typeof dist === 'number' ? dist : (dist[0] + dist[1]) / 2;
    return units === 'km' ? Math.round(raw * KM_PER_MILE * 10) / 10 : Math.round(raw);
};

export const MileageChart = ({ weeks, units, actualVolumes }: MileageChartProps) => {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    const chartData = useMemo(() => {
        const today = new Date();
        return weeks.map((week, idx) => {
            const displayTotal = calculateWeeklyVolume(week, units);
            const isCurrentWeek = today >= new Date(week.weekStart) && today <= new Date(week.weekEnd);

            let maxWorkout = 0;
            let longRunMax = 0;
            let quality = 0;
            let hasTuneUp = false;

            week.workouts.forEach((w) => {
                const d = getWorkoutDist(w.distance, units);
                const title = (w.title || '').toLowerCase();
                const tags = (w.tags || []).map(t => t.toLowerCase());
                const zone = getPaceZone(w.title || '', w.tags, w.zone);

                if (d > maxWorkout) {
                    maxWorkout = d;
                }

                // Explicit zone wins: the long-run segment is the longest
                // workout carrying the Long Run zone, so a med-long never
                // masquerades as the week's long run via raw max alone.
                if (zone === 'Long Run' && d > longRunMax) {
                    longRunMax = d;
                }

                const isQualityByZone = zone != null && QUALITY_ZONES.has(zone);
                const isQualityByHeuristic =
                    tags.some(t => ['lt', 'vo2 max', 'intervals', 'tempo', 'tune-up', 'speed', 'race'].includes(t)) ||
                    title.includes('lt') ||
                    title.includes('vo2') ||
                    title.includes('threshold') ||
                    title.includes('tune-up') ||
                    title.includes('interval') ||
                    title.includes('strides') ||
                    title.includes('marathon-pace') ||
                    title.includes('marathon pace');
                if (isQualityByZone || isQualityByHeuristic) {
                    quality += d;
                    if (title.includes('tune-up')) hasTuneUp = true;
                }
            });

            // Make sure segments fit within total volume cleanly.
            // Prefer the explicit Long Run max; fall back to the longest
            // workout only when no workout carries the Long Run zone.
            const total = displayTotal.average;
            const longRun = Math.min(total, longRunMax > 0 ? longRunMax : maxWorkout);
            const qual = Math.min(total - longRun, quality);
            const easy = Math.max(0, total - longRun - qual);

            return {
                weekIndex: idx,
                weekNumber: week.weekNumber,
                weeksToGoal: week.weeksToGoal,
                volume: total,
                longRun,
                quality: qual,
                easy,
                isCurrentWeek,
                hasTuneUp,
                actual: actualVolumes?.[idx] ?? null,
            };
        });
    }, [weeks, units, actualVolumes]);

    const maxVolume = useMemo(() => {
        const max = Math.max(...chartData.map(d => d.volume), 0);
        return max === 0 ? 1 : max;
    }, [chartData]);

    const peakWeekIndex = useMemo(() => {
        let max = 0;
        let peakIdx = -1;
        chartData.forEach((d, idx) => {
            if (d.volume > max) {
                max = d.volume;
                peakIdx = idx;
            }
        });
        return peakIdx;
    }, [chartData]);

    const currentIndex = chartData.findIndex(d => d.isCurrentWeek);

    // Past weeks collapse behind a disclosure so the page stays scannable
    // mid-season; future weeks always stay visible for planning ahead.
    // No current week (plan entirely past/future) = nothing collapses.
    const splitAt = currentIndex > 0 ? Math.max(0, currentIndex - 2) : 0;
    const pastWeeks = chartData.slice(0, splitAt);
    const visibleWeeks = chartData.slice(splitAt);

    const jumpToWeek = (weekIdx: number) => {
        const reduced = typeof window !== 'undefined'
            && typeof window.matchMedia === 'function'
            && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        document.getElementById(`week-card-${weekIdx}`)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    };

    const renderRow = (data: (typeof chartData)[number]) => {
        const index = data.weekIndex;
        const open = expandedIndex === index;
        const prev = index > 0 ? chartData[index - 1]?.volume : undefined;
        const delta = prev != null ? Math.round(data.volume - prev) : 0;
        const isTaper = prev != null && data.volume < prev * 0.85 && index > peakWeekIndex;
        const isPeak = index === peakWeekIndex;
        const isRaceWeek = data.weeksToGoal === 1;
        const deltaLabel = index === 0
            ? (isRaceWeek ? 'RACE' : 'start')
            : isTaper ? `${delta} taper` : `${delta > 0 ? '+' : ''}${delta}`;
        const flags = [
            ...(isPeak ? ['PEAK'] : []),
            ...(isRaceWeek && index !== 0 ? ['RACE'] : []),
        ];

        return (
            <div key={data.weekNumber}>
                <button
                    onClick={() => setExpandedIndex(open ? null : index)}
                    aria-expanded={open}
                    aria-label={`Week ${data.weekNumber}: ${Math.round(data.volume)} ${units}${data.actual != null ? `, logged ${data.actual} ${units}` : ''}. ${open ? 'Collapse details.' : 'Show details.'}`}
                    className="w-full min-h-[56px] flex items-center gap-3 py-2 text-left rounded-none"
                >
                    <span className={`font-data text-xs w-10 flex-none ${data.isCurrentWeek ? 'text-marker font-bold' : 'text-pencil'}`}>
                        W{data.weekNumber}
                    </span>
                    <span className="flex-1 min-w-0">
                        <span className="block h-3 bg-paper border border-rule overflow-hidden" aria-hidden="true">
                            <span className="flex h-full" style={{ width: `${Math.max(4, (data.volume / maxVolume) * 100)}%` }}>
                                <span className="bg-pencil/30" style={{ width: `${data.volume ? (data.easy / data.volume) * 100 : 0}%` }} />
                                <span className="bg-ink/80" style={{ width: `${data.volume ? (data.longRun / data.volume) * 100 : 0}%` }} />
                                <span className="bg-marker" style={{ width: `${data.volume ? (data.quality / data.volume) * 100 : 0}%` }} />
                            </span>
                        </span>
                        <span className="block font-data text-[10px] text-pencil mt-1 truncate">
                            {data.isCurrentWeek ? '· this week ' : ''}LR {Math.round(data.longRun)} · Q {Math.round(data.quality)}
                            {data.actual != null && data.actual > 0 && (
                                <span className="text-marker font-bold" data-logged-marker={`W${data.weekNumber}`}> · {data.actual} logged</span>
                            )}
                        </span>
                    </span>
                    <span className="flex-none text-right">
                        <span className="font-data font-bold text-base text-ink">
                            {Math.round(data.volume)}<span className="text-[10px] text-pencil font-normal"> {units}</span>
                        </span>
                        <span className={`block font-data text-[10px] font-bold ${isPeak ? 'text-marker' : 'text-pencil'}`}>
                            {deltaLabel}{flags.length > 0 && ` · ${flags.join(' · ')}`}
                        </span>
                    </span>
                </button>
                {open && (
                    <div className="pb-3 pl-[52px] pr-1 flex items-center gap-3">
                        <p className="text-xs text-pencil flex-1">
                            Long run {Math.round(data.longRun)}{units} · Workout miles {Math.round(data.quality)}{units}
                            {data.actual != null ? ` · Logged ${data.actual}${units}` : ''}
                        </p>
                        <button
                            onClick={() => jumpToWeek(index)}
                            className="px-3 py-2 bg-ink text-paper font-data text-[11px] font-bold uppercase tracking-wider min-h-[44px]"
                        >
                            Open week
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <section
            aria-label="Weekly Volume Progression"
            className="w-full bg-card border border-rule p-4 sm:p-6 mb-2 transition-colors shadow-sm"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4 border-b border-rule pb-4">
                <div>
                    <h3 className="font-display font-semibold uppercase text-xl text-ink tracking-wide">
                        Weekly volume
                    </h3>
                    <p className="text-xs text-pencil mt-0.5">Select a row to open that week</p>
                </div>

                {/* Legend — ink / pencil / marker only, matching the logbook system */}
                <div className="flex items-center gap-3 flex-wrap font-data text-[10px] uppercase tracking-wider text-pencil">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-none bg-marker" />
                        <span className="text-ink">Quality</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-none bg-ink" />
                        <span className="text-ink">Long run</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-none bg-pencil/40" />
                        <span>Aerobic</span>
                    </span>
                </div>
            </div>

            {pastWeeks.length > 0 && (
                <details className="border-b border-rule mb-1">
                    <summary className="font-data text-[11px] uppercase tracking-wider text-pencil cursor-pointer min-h-[44px] flex items-center">
                        Earlier weeks (W{pastWeeks[0]?.weekNumber}–W{pastWeeks[pastWeeks.length - 1]?.weekNumber})
                    </summary>
                    <div className="divide-y divide-rule">
                        {pastWeeks.map(renderRow)}
                    </div>
                </details>
            )}

            <div className="divide-y divide-rule border-rule">
                {visibleWeeks.map(renderRow)}
            </div>
        </section>
    );
};
