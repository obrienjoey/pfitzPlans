import { useMemo, useState } from 'react';
import type { RenderedWeek } from '../types';
import { calculateWeeklyVolume } from '../lib/calculator';

interface MileageChartProps {
    weeks: RenderedWeek[];
    units: 'mi' | 'km';
}

export const MileageChart = ({ weeks, units }: MileageChartProps) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const chartData = useMemo(() => {
        const today = new Date();
        return weeks.map((week) => {
            const displayTotal = calculateWeeklyVolume(week, units);
            const isCurrentWeek = today >= new Date(week.weekStart) && today <= new Date(week.weekEnd);

            return {
                weekNumber: week.weekNumber,
                volume: displayTotal,
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

    const height = 140; // Height of chart area
    const barWidth = 32; // Width of each bar
    const gap = 12; // Gap between bars
    const paddingLeft = 48; // Left padding to accommodate Y-axis labels
    const paddingRight = 16;
    const paddingTop = 40;
    const paddingBottom = 20;

    const svgWidth = chartData.length * (barWidth + gap) - gap + paddingLeft + paddingRight;
    const svgHeight = height + paddingTop + paddingBottom;

    return (
        <div className="w-full bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl p-4 sm:p-6 mb-8 transition-all shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6 border-b border-slate-800/50 pb-4">
                <div>
                    <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
                        Weekly Volume Progression
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Visual representation of weekly mileage builds and tapers</p>
                </div>
                <div className="text-xs font-mono font-semibold text-slate-400 bg-slate-800/50 px-2.5 py-1 rounded-lg border border-slate-700/30">
                    Units: <span className="text-indigo-400 font-bold">{units}</span>
                </div>
            </div>

            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                <div className="min-w-[600px] flex justify-center pb-2">
                    <svg
                        width={svgWidth}
                        height={svgHeight}
                        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                        className="overflow-visible select-none"
                    >
                        <defs>
                            <linearGradient id="bar-grad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#818cf8" />
                                <stop offset="100%" stopColor="#4f46e5" />
                            </linearGradient>
                            <linearGradient id="bar-grad-hover" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#a5b4fc" />
                                <stop offset="100%" stopColor="#6366f1" />
                            </linearGradient>
                            <linearGradient id="bar-grad-current" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#f472b6" />
                                <stop offset="100%" stopColor="#ec4899" />
                            </linearGradient>
                            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#6366f1" floodOpacity="0.3"/>
                            </filter>
                            <filter id="glow-current" x="-20%" y="-20%" width="140%" height="140%">
                                <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#ec4899" floodOpacity="0.4"/>
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
                                        stroke={val === 0 ? "#475569" : "#334155"}
                                        strokeWidth="1"
                                        strokeDasharray={val === 0 ? undefined : "4 4"}
                                        opacity={val === 0 ? "0.8" : "0.3"}
                                    />
                                    <text
                                        x={paddingLeft - 8}
                                        y={tickY + 3.5}
                                        textAnchor="end"
                                        fill="#94a3b8"
                                        className="text-[10px] font-mono font-medium"
                                    >
                                        {val}
                                    </text>
                                </g>
                            );
                        })}

                        {chartData.map((data, index) => {
                            const barHeight = (data.volume / maxVolume) * height;
                            const x = paddingLeft + index * (barWidth + gap);
                            const y = svgHeight - paddingBottom - barHeight;
                            const isHovered = hoveredIndex === index;

                            // Color states
                            let fillGradient = "url(#bar-grad)";
                            let borderStroke = "rgba(99, 102, 241, 0.2)"; // Indigo border
                            
                            if (data.isCurrentWeek) {
                                fillGradient = "url(#bar-grad-current)";
                                borderStroke = "#ec4899"; // Pink stroke for today/current week
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
                                                {data.volume} {units}
                                            </text>
                                        </g>
                                    )}

                                    {/* Bar Graphic */}
                                    <rect
                                        x={x}
                                        y={y}
                                        width={barWidth}
                                        height={barHeight}
                                        rx="6"
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
                                            fill="#fbbf24"
                                            className="text-[9px] font-mono font-bold tracking-tight bg-amber-500/10 px-1 py-0.5 rounded"
                                        >
                                            PEAK
                                        </text>
                                    )}

                                    {/* Bottom labels (Week numbers) */}
                                    <text
                                        x={x + barWidth / 2}
                                        y={svgHeight - 4}
                                        textAnchor="middle"
                                        fill={data.isCurrentWeek ? "#f472b6" : isHovered ? "#818cf8" : "#94a3b8"}
                                        className={`text-[10px] font-mono ${data.isCurrentWeek || isHovered ? 'font-bold' : ''}`}
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
