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
        <div className="w-full bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 backdrop-blur-md rounded-2xl p-4 sm:p-6 mb-8 transition-all shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-800/50 pb-4">
                <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
                        Weekly Volume Progression
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Visual representation of weekly mileage builds and tapers</p>
                </div>
                <div className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700/30">
                    Units: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{units}</span>
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
                        <defs>
                            <linearGradient id="bar-grad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#cbd5e1" />
                                <stop offset="100%" stopColor="#94a3b8" />
                            </linearGradient>
                            <linearGradient id="bar-grad-hover" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#a5b4fc" />
                                <stop offset="100%" stopColor="#6366f1" />
                            </linearGradient>
                            <linearGradient id="bar-grad-current" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#818cf8" />
                                <stop offset="100%" stopColor="#4f46e5" />
                            </linearGradient>
                            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#6366f1" floodOpacity="0.3"/>
                            </filter>
                            <filter id="glow-current" x="-20%" y="-20%" width="140%" height="140%">
                                <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#4f46e5" floodOpacity="0.45"/>
                            </filter>
                        </defs>

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
                                        strokeDasharray={val === 0 ? undefined : "4 4"}
                                        opacity={val === 0 ? "0.8" : "0.6"}
                                        className={val === 0 ? "stroke-slate-300 dark:stroke-slate-500" : "stroke-slate-200 dark:stroke-slate-700"}
                                    />
                                    <text
                                        x={paddingLeft - 8}
                                        y={tickY + 3.5}
                                        textAnchor="end"
                                        className="text-[10px] font-mono font-medium fill-slate-400 dark:fill-slate-500"
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

                            // Color states
                            let fillGradient = "url(#bar-grad)";
                            let borderStroke = "rgba(148, 163, 184, 0.4)"; // Neutral border

                            if (data.isCurrentWeek) {
                                fillGradient = "url(#bar-grad-current)";
                                borderStroke = "#4f46e5"; // Indigo stroke for today/current week
                            } else if (isHovered) {
                                fillGradient = "url(#bar-grad-hover)";
                                borderStroke = "#818cf8"; // Indigo highlight
                            }

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
                                                fill="#0f172a"
                                                stroke="#334155"
                                                strokeWidth="1"
                                                className="shadow-xl"
                                            />
                                            {/* Tooltip text */}
                                            <text
                                                x={Math.max(paddingLeft + 50, x + barWidth / 2)}
                                                y={y - 16}
                                                textAnchor="middle"
                                                fill="#f8fafc"
                                                className="text-[11px] font-mono font-bold"
                                            >
                                                {data.volumeFormatted} {units}
                                            </text>
                                        </g>
                                    )}

                                    {/* Bar Graphic */}
                                    <path
                                        d={roundedTopRect(x, y, barWidth, barHeight, 7)}
                                        fill={fillGradient}
                                        stroke={borderStroke}
                                        strokeWidth={isHovered || data.isCurrentWeek ? 2 : 1}
                                        filter={data.isCurrentWeek ? "url(#glow-current)" : isHovered ? "url(#glow)" : undefined}
                                        className="transition-all duration-200 ease-out"
                                    />

                                    {/* Peak tag text */}
                                    {data.volume === maxVolume && !isHovered && (
                                        <text
                                            x={x + barWidth / 2}
                                            y={y - 8}
                                            textAnchor="middle"
                                            className="text-[10px] font-mono font-bold tracking-tight fill-amber-500 dark:fill-amber-400"
                                        >
                                            PEAK
                                        </text>
                                    )}

                                    {/* Bottom labels (Week numbers) */}
                                    <text
                                        x={x + barWidth / 2}
                                        y={svgHeight - 4}
                                        textAnchor="middle"
                                        className={`text-[10px] font-mono ${data.isCurrentWeek ? 'fill-indigo-600 dark:fill-indigo-400 font-bold' : isHovered ? 'fill-indigo-500 font-bold' : 'fill-slate-400 dark:fill-slate-500'}`}
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
