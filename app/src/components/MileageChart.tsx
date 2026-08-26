import { useEffect, useMemo, useRef, useState } from 'react';
import type { RenderedWeek } from '../types';
import { calculateWeeklyVolume } from '../lib/calculator';

interface MileageChartProps {
    weeks: RenderedWeek[];
    units: 'mi' | 'km';
}

const roundedTopRect = (x: number, y: number, w: number, h: number, r: number) => {
    const radius = Math.min(r, w / 2, h);
    return [
        `M ${x} ${y + h}`,
        `L ${x} ${y + radius}`,
        `Q ${x} ${y} ${x + radius} ${y}`,
        `L ${x + w - radius} ${y}`,
        `Q ${x + w} ${y} ${x + w} ${y + radius}`,
        `L ${x + w} ${y + h}`,
        'Z'
    ].join(' ');
};

export const MileageChart = ({ weeks, units }: MileageChartProps) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const chartData = useMemo(() => {
        const today = new Date();
        return weeks.map((week) => {
            const displayTotal = calculateWeeklyVolume(week, units);
            const isCurrentWeek = today >= new Date(week.weekStart) && today <= new Date(week.weekEnd);

            return {
                weekNumber: week.weekNumber,
                volume: displayTotal.average,
                volumeFormatted: displayTotal.formatted,
                isCurrentWeek,
                label: `Week ${week.weekNumber}`
            };
        });
    }, [weeks, units]);

    const maxVolume = useMemo(() => {
        const max = Math.max(...chartData.map(d => d.volume), 0);
        return max === 0 ? 1 : max;
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

    const height = 140; // Height of chart area
    const paddingLeft = 48; // Left padding to accommodate Y-axis labels
    const paddingRight = 16;
    const paddingTop = 40;
    const paddingBottom = 20;

    const count = chartData.length || 1;
    const fallbackWidth = 720;
    const containerWidth = wrapWidth ?? fallbackWidth;
    const innerWidth = containerWidth - paddingLeft - paddingRight;

    // Fill the available width when there is room; fall back to a fixed slot
    // (and horizontal scrolling) only when the container is genuinely cramped.
    const MIN_SLOT = 34;
    const rawSlot = innerWidth / count;
    const scrolls = rawSlot < MIN_SLOT;
    const slot = scrolls ? MIN_SLOT : rawSlot;
    const gap = Math.min(18, Math.max(6, slot * 0.3));
    const barWidth = slot - gap;

    const svgWidth = scrolls
        ? paddingLeft + count * slot - gap + paddingRight
        : containerWidth;
    const svgHeight = height + paddingTop + paddingBottom;

    return (
        <div className="w-full bg-card border border-rule p-4 sm:p-6 mb-2 transition-colors">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-800/50 pb-4">
                <div>
                    <h3 className="font-display font-semibold uppercase text-xl text-ink tracking-wide flex items-center gap-2">
                        Weekly volume
                    </h3>
                    <p className="text-xs text-pencil mt-0.5">Mileage builds and tapers, week by week</p>
                </div>
                <div className="font-data text-xs text-pencil px-2.5 py-1 border border-rule">
                    <span className="text-ink font-bold">{units}</span>
                </div>
            </div>

            <div
                ref={scrollWrapRef}
                className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent"
                role="img"
                aria-label={`Weekly volume progression across ${chartData.length} weeks, peak ${maxVolume} ${units}`}
            >
                <div className={scrolls ? 'min-w-max pb-2' : 'w-full pb-2'}>
                    <svg
                        width={scrolls ? svgWidth : '100%'}
                        height={svgHeight}
                        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                        className="overflow-visible select-none block"
                    >

                        {/* Y-Axis Gridlines and Labels */}
                        {yAxisTicks.map((val) => {
                            const tickY = svgHeight - paddingBottom - (val / maxVolume) * height;
                            return (
                                <g key={`grid-group-${val}`}>
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
                            const barHeight = (data.volume / maxVolume) * height;
                            const slotX = paddingLeft + index * slot;
                            const x = slotX + (slot - barWidth) / 2;
                            const y = svgHeight - paddingBottom - barHeight;
                            const isHovered = hoveredIndex === index;

                            // Color states — flat ink bars; marker red marks the current week
                            const fill = data.isCurrentWeek
                                ? "var(--chart-current)"
                                : isHovered
                                    ? "var(--chart-bar-hover)"
                                    : "var(--chart-bar)";

                            return (
                                <g
                                    key={data.weekNumber}
                                    onMouseEnter={() => setHoveredIndex(index)}
                                    onMouseLeave={() => setHoveredIndex(null)}
                                    className="cursor-pointer group"
                                >
                                    {/* Invisible full-slot hit target so thin bars stay easy to hover */}
                                    <rect
                                        x={slotX}
                                        y={paddingTop}
                                        width={slot}
                                        height={height}
                                        fill="transparent"
                                    />

                                    {/* Hover tooltip / info helper overlay text */}
                                    {isHovered && (
                                        <g>
                                            {/* Tooltip Background */}
                                            <rect
                                                x={Math.max(paddingLeft, x + barWidth / 2 - 50)}
                                                y={y - 32}
                                                width="100"
                                                height="24"
                                                rx="6"
                                                className="fill-[var(--card)] stroke-[var(--rule)]"
                                                strokeWidth="1"
                                            />
                                            {/* Tooltip text */}
                                            <text
                                                x={Math.max(paddingLeft + 50, x + barWidth / 2)}
                                                y={y - 16}
                                                textAnchor="middle"
                                                style={{ fill: "var(--ink)" }}
                                                fontSize={11}
                                                fontWeight={700}
                                                fontFamily="var(--font-data, monospace)"
                                            >
                                                {data.volumeFormatted} {units}
                                            </text>
                                        </g>
                                    )}

                                    {/* Bar Graphic */}
                                    <path
                                        d={roundedTopRect(x, y, barWidth, barHeight, 5)}
                                        style={{ fill, transition: "fill 0.15s ease-out" }}
                                    />

                                    {/* Peak tag text */}
                                    {data.volume === maxVolume && !isHovered && (
                                        <text
                                            x={x + barWidth / 2}
                                            y={y - 8}
                                            textAnchor="middle"
                                            style={{ fill: "var(--chart-current)" }}
                                            fontSize={10}
                                            fontWeight={700}
                                            letterSpacing={1}
                                        >
                                            PEAK
                                        </text>
                                    )}

                                    {/* Bottom labels (Week numbers) */}
                                    <text
                                        x={x + barWidth / 2}
                                        y={svgHeight - 4}
                                        textAnchor="middle"
                                        style={{
                                            fill: data.isCurrentWeek
                                                ? "var(--chart-current)"
                                                : isHovered
                                                    ? "var(--chart-bar-hover)"
                                                    : "var(--chart-label)",
                                            fontWeight: data.isCurrentWeek || isHovered ? 700 : 400,
                                        }}
                                        fontSize={10}
                                        fontFamily="var(--font-data, monospace)"
                                    >
                                        W{data.weekNumber}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                </div>
            </div>
        </div>
    );
};
