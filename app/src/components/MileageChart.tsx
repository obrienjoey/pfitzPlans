import { useEffect, useMemo, useRef, useState } from 'react';
import type { RenderedWeek, Distance } from '../types';
import { calculateWeeklyVolume } from '../lib/calculator';
import { KM_PER_MILE } from '../lib/constants';

export interface MileageChartProps {
    weeks: RenderedWeek[];
    units: 'mi' | 'km';
}

const getWorkoutDist = (dist?: Distance, units: 'mi' | 'km' = 'mi'): number => {
    if (!dist) return 0;
    const raw = typeof dist === 'number' ? dist : (dist[0] + dist[1]) / 2;
    return units === 'km' ? Math.round(raw * KM_PER_MILE * 10) / 10 : Math.round(raw);
};

export const MileageChart = ({ weeks, units }: MileageChartProps) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const chartData = useMemo(() => {
        const today = new Date();
        return weeks.map((week, idx) => {
            const displayTotal = calculateWeeklyVolume(week, units);
            const isCurrentWeek = today >= new Date(week.weekStart) && today <= new Date(week.weekEnd);

            let maxWorkout = 0;
            let quality = 0;
            let hasTuneUp = false;

            week.workouts.forEach((w) => {
                const d = getWorkoutDist(w.distance, units);
                const title = (w.title || '').toLowerCase();
                const tags = (w.tags || []).map(t => t.toLowerCase());

                if (d > maxWorkout) {
                    maxWorkout = d;
                }

                if (
                    tags.some(t => ['lt', 'vo2 max', 'intervals', 'tempo', 'tune-up', 'speed', 'race'].includes(t)) ||
                    title.includes('lt') ||
                    title.includes('vo2') ||
                    title.includes('threshold') ||
                    title.includes('tune-up') ||
                    title.includes('interval') ||
                    title.includes('strides')
                ) {
                    quality += d;
                    if (title.includes('tune-up')) hasTuneUp = true;
                }
            });

            // Make sure segments fit within total volume cleanly
            const total = displayTotal.average;
            const longRun = Math.min(total, maxWorkout);
            const qual = Math.min(total - longRun, quality);
            const easy = Math.max(0, total - longRun - qual);

            return {
                weekIndex: idx,
                weekNumber: week.weekNumber,
                weeksToGoal: week.weeksToGoal,
                volume: total,
                volumeFormatted: displayTotal.formatted,
                longRun,
                quality: qual,
                easy,
                isCurrentWeek,
                hasTuneUp,
                label: `Week ${week.weekNumber}`
            };
        });
    }, [weeks, units]);

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

    const tickCount = 4;
    const yAxisTicks = useMemo(() => {
        const step = maxVolume / tickCount;
        return Array.from({ length: tickCount + 1 }, (_, i) => Math.round(i * step));
    }, [maxVolume]);

    const scrollWrapRef = useRef<HTMLDivElement>(null);
    const [wrapWidth, setWrapWidth] = useState<number | null>(null);

    useEffect(() => {
        const el = scrollWrapRef.current;
        if (!el || typeof ResizeObserver === 'undefined') return;
        const observer = new ResizeObserver(entries => {
            for (const entry of entries) setWrapWidth(entry.contentRect.width);
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const height = 150;
    const paddingLeft = 44;
    const paddingRight = 16;
    const paddingTop = 44;
    const paddingBottom = 22;

    const count = chartData.length || 1;
    const fallbackWidth = 720;
    const containerWidth = wrapWidth ?? fallbackWidth;
    const innerWidth = containerWidth - paddingLeft - paddingRight;

    const MIN_SLOT = 36;
    const rawSlot = innerWidth / count;
    const scrolls = rawSlot < MIN_SLOT;
    const slot = scrolls ? MIN_SLOT : rawSlot;
    const gap = Math.min(16, Math.max(6, slot * 0.28));
    const barWidth = slot - gap;

    const svgWidth = scrolls
        ? paddingLeft + count * slot - gap + paddingRight
        : containerWidth;
    const svgHeight = height + paddingTop + paddingBottom;

    const jumpToWeek = (weekIdx: number) => {
        document.getElementById(`week-card-${weekIdx}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <section
            aria-label="Weekly Volume Progression"
            className="w-full bg-card border border-rule p-4 sm:p-6 mb-2 transition-colors shadow-sm"
        >
            {/* Header & Interactive Legend */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-6 border-b border-rule pb-4">
                <div>
                    <h3 className="font-display font-semibold uppercase text-xl text-ink tracking-wide flex items-center gap-2">
                        <span>Weekly volume</span>
                        <span className="text-pencil text-sm font-normal hidden sm:inline">· Intensity stack</span>
                    </h3>
                    <p className="text-xs text-pencil mt-0.5">Select a bar to open that week</p>
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
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-none border-2 border-marker" />
                        <span>Current</span>
                    </span>
                </div>
            </div>

            <div
                ref={scrollWrapRef}
                className="overflow-x-auto scrollbar-thin scrollbar-thumb-pencil/40 scrollbar-track-transparent"
                role="region"
                aria-label="Interactive volume bar chart"
            >
                <div className={scrolls ? 'min-w-max pb-2' : 'w-full pb-2'}>
                    <svg
                        width={scrolls ? svgWidth : '100%'}
                        height={svgHeight}
                        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                        className="overflow-visible select-none block"
                    >
                        {/* Y-Axis Gridlines and Labels */}
                        {yAxisTicks.map((val, index) => {
                            const tickY = svgHeight - paddingBottom - (val / maxVolume) * height;
                            return (
                                <g key={`grid-group-${index}`}>
                                    <line
                                        x1={paddingLeft}
                                        y1={tickY}
                                        x2={svgWidth - paddingRight}
                                        y2={tickY}
                                        strokeWidth="1"
                                        strokeDasharray={val === 0 ? undefined : "3 4"}
                                        opacity={val === 0 ? "0.9" : "1"}
                                        style={{ stroke: "var(--chart-grid)" }}
                                    />
                                    <text
                                        x={paddingLeft - 8}
                                        y={tickY + 3.5}
                                        textAnchor="end"
                                        style={{ fill: "var(--chart-label)" }}
                                        fontSize={10}
                                        fontFamily="var(--font-data, monospace)"
                                    >
                                        {val}
                                    </text>
                                </g>
                            );
                        })}

                        {chartData.map((data, index) => {
                            const totalH = (data.volume / maxVolume) * height;
                            const easyH = (data.easy / maxVolume) * height;
                            const longH = (data.longRun / maxVolume) * height;
                            const qualH = (data.quality / maxVolume) * height;

                            const slotX = paddingLeft + index * slot;
                            const x = slotX + (slot - barWidth) / 2;
                            const baseY = svgHeight - paddingBottom;
                            const isHovered = hoveredIndex === index;

                            const isPeak = index === peakWeekIndex;
                            const isRaceWeek = data.weeksToGoal === 1;

                            return (
                                <g
                                    key={data.weekNumber}
                                    onClick={() => jumpToWeek(index)}
                                    onMouseEnter={() => setHoveredIndex(index)}
                                    onMouseLeave={() => setHoveredIndex(null)}
                                    onFocus={() => setHoveredIndex(index)}
                                    onBlur={() => setHoveredIndex(null)}
                                    tabIndex={0}
                                    role="button"
                                    aria-label={`Week ${data.weekNumber}: ${data.volumeFormatted} ${units}. Click to view week.`}
                                    className="cursor-pointer group outline-none"
                                >
                                    {/* Invisible full-slot hit target */}
                                    <rect
                                        x={slotX}
                                        y={paddingTop}
                                        width={slot}
                                        height={height}
                                        fill="transparent"
                                    />

                                    {/* Stack 1: Aerobic base (bottom) */}
                                    <rect
                                        x={x}
                                        y={baseY - easyH}
                                        width={barWidth}
                                        height={easyH}
                                        className="fill-pencil/30 group-hover:fill-pencil/50 transition-colors"
                                    />

                                    {/* Stack 2: Long run (middle) */}
                                    <rect
                                        x={x}
                                        y={baseY - easyH - longH}
                                        width={barWidth}
                                        height={longH}
                                        className="fill-ink/80 group-hover:fill-ink transition-colors"
                                    />

                                    {/* Stack 3: Quality (top) */}
                                    {qualH > 0 && (
                                        <rect
                                            x={x}
                                            y={baseY - easyH - longH - qualH}
                                            width={barWidth}
                                            height={qualH}
                                            className="fill-marker"
                                        />
                                    )}

                                    {/* Current-week outline — fill stays truthful, ring marks "you are here" */}
                                    {data.isCurrentWeek && (
                                        <rect
                                            x={x - 2}
                                            y={baseY - totalH - 2}
                                            width={barWidth + 4}
                                            height={totalH + 2}
                                            fill="none"
                                            stroke="var(--marker)"
                                            strokeWidth="1.5"
                                            pointerEvents="none"
                                        />
                                    )}

                                    {/* Milestone badges — peak and race only */}
                                    {isPeak && !isHovered && (
                                        <g>
                                            <text
                                                x={x + barWidth / 2}
                                                y={baseY - totalH - 8}
                                                textAnchor="middle"
                                                className="fill-ink font-data font-bold text-[9px] tracking-wider"
                                            >
                                                PEAK
                                            </text>
                                            <line
                                                x1={x + barWidth / 2}
                                                y1={baseY - totalH - 5}
                                                x2={x + barWidth / 2}
                                                y2={baseY - totalH}
                                                stroke="var(--ink)"
                                                strokeWidth="1.5"
                                            />
                                        </g>
                                    )}

                                    {isRaceWeek && !isHovered && (
                                        <g>
                                            <text
                                                x={x + barWidth / 2}
                                                y={baseY - totalH - 8}
                                                textAnchor="middle"
                                                className="fill-marker font-data font-bold text-[9px] tracking-wider"
                                            >
                                                RACE
                                            </text>
                                            <line
                                                x1={x + barWidth / 2}
                                                y1={baseY - totalH - 5}
                                                x2={x + barWidth / 2}
                                                y2={baseY - totalH}
                                                stroke="var(--marker)"
                                                strokeWidth="1.5"
                                            />
                                        </g>
                                    )}

                                    {/* Rich Split Tooltip */}
                                    {isHovered && (
                                        <g>
                                            <rect
                                                x={Math.max(paddingLeft, Math.min(svgWidth - 140, x + barWidth / 2 - 65))}
                                                y={Math.max(4, baseY - totalH - 38)}
                                                width="130"
                                                height="32"
                                                rx="0"
                                                className="fill-[var(--card)] stroke-[var(--ink)] shadow-md"
                                                strokeWidth="1.5"
                                            />
                                            <text
                                                x={Math.max(paddingLeft + 65, Math.min(svgWidth - 75, x + barWidth / 2))}
                                                y={Math.max(4, baseY - totalH - 38) + 13}
                                                textAnchor="middle"
                                                className="fill-ink font-data font-bold text-[10px]"
                                            >
                                                W{data.weekNumber}: {data.volumeFormatted} {units}
                                            </text>
                                            <text
                                                x={Math.max(paddingLeft + 65, Math.min(svgWidth - 75, x + barWidth / 2))}
                                                y={Math.max(4, baseY - totalH - 38) + 25}
                                                textAnchor="middle"
                                                className="fill-pencil font-data text-[8px]"
                                            >
                                                LR {Math.round(data.longRun)}{units} · Q {Math.round(data.quality)}{units} · Open ↓
                                            </text>
                                        </g>
                                    )}

                                    {/* Week label */}
                                    <text
                                        x={x + barWidth / 2}
                                        y={svgHeight - 4}
                                        textAnchor="middle"
                                        className={`font-data text-[10px] ${
                                            data.isCurrentWeek
                                                ? 'fill-marker font-bold'
                                                : isHovered
                                                    ? 'fill-ink font-bold'
                                                    : 'fill-pencil'
                                        }`}
                                    >
                                        W{data.weekNumber}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                </div>
            </div>
        </section>
    );
};
