"use client";

import React from "react";
import dynamic from "next/dynamic";
import {
    CartesianGrid,
    ComposedChart,
    Area,
    Line,
    ReferenceDot,
    ReferenceLine,
    Label,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { RACE_DURATION_MS, ChartPoint, CURRENT_YEAR } from "../data/assets";

const KRW = new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
});

function TooltipCard({
    active,
    payload,
    mode,
}: {
    active?: boolean;
    payload?: { payload: ChartPoint }[];
    mode: "REGRET" | "SINGULARITY";
}) {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;
    const isSingularity = mode === "SINGULARITY";
    const themeColor = isSingularity ? "#FFD700" : "#E31937";
    const bgGlow = isSingularity
        ? "shadow-[0_0_20px_rgba(255,215,0,0.4)] border-[#FFD700]/40"
        : "shadow-[0_0_20px_rgba(227,25,55,0.4)] border-[#E31937]/40";

    return (
        <div className={`rounded-xl border bg-black/95 p-3 text-xs text-white backdrop-blur-md ${bgGlow}`}>
            <p className="font-mono text-zinc-400">{`YEAR ${data.year.toFixed(1)}`}</p>
            <div className="mt-2 space-y-1 font-mono">
                <p className="text-zinc-500">Bank: {KRW.format(data.bank)}</p>
                <p className="font-bold text-sm" style={{ color: themeColor }}>
                    Asset: {KRW.format(data.asset)}
                </p>
            </div>
        </div>
    );
}

const RaceChart = dynamic<{
    series: ChartPoint[];
    marker: ChartPoint;
    mode: "REGRET" | "SINGULARITY";
    isFinished: boolean;
}>(
    async () =>
        function RaceChartClient({ series, marker, mode, isFinished }: { series: ChartPoint[], marker: ChartPoint, mode: "REGRET" | "SINGULARITY", isFinished: boolean }) {
            const isSingularity = mode === "SINGULARITY";
            const themeColor = isSingularity ? "#FFD700" : "#E31937";
            const dropShadow = isSingularity
                ? "drop-shadow(0px 0px 8px rgba(255, 215, 0, 0.8))"
                : "drop-shadow(0px 0px 8px rgba(227, 25, 55, 0.6))";

            // State for hovered pin
            const [hoveredPin, setHoveredPin] = React.useState<{ x: number, y: number, msg: string } | null>(null);

            // Active conviction points that the marker has already passed
            const passedConvictions = series.filter(p => p.isConvictionPoint && p.year <= marker.year);
            const latestConviction = passedConvictions.length > 0 ? passedConvictions[passedConvictions.length - 1] : null;

            // Emphasize the last conviction message for a while
            const showMainOverlay = !isFinished && latestConviction && (marker.year - latestConviction.year) < 0.5;

            return (
                <div className="relative w-full h-full">
                    {/* Main Conviction Overlay (Briefly active during the fall) */}
                    {showMainOverlay && (
                        <div className="absolute inset-x-0 top-1/4 z-10 flex flex-col items-center justify-center pointer-events-none px-4 text-center">
                            <span className="animate-bounce bg-black/80 text-[#FFD700] border border-[#FFD700]/50 rounded-2xl px-4 py-2 text-sm font-bold shadow-[0_0_15px_rgba(255,215,0,0.5)]">
                                {latestConviction?.convictionMessage}
                            </span>
                        </div>
                    )}

                    {/* Hover Pin Tooltip (Active after finish) */}
                    {isFinished && hoveredPin && (
                        <div
                            className="absolute z-20 bg-black text-white p-2 rounded border border-[#FFD700]/50 shadow-[0_0_10px_rgba(255,215,0,0.3)] text-[10px] w-48 text-center"
                            style={{
                                left: hoveredPin.x,
                                top: hoveredPin.y - 40,
                                transform: 'translate(-50%, -100%)'
                            }}
                        >
                            {hoveredPin.msg}
                        </div>
                    )}

                    <ResponsiveContainer width="100%" height="100%" minHeight={320}>
                        <ComposedChart data={series} margin={{ top: 25, right: 15, bottom: 0, left: 0 }}>
                            <defs>
                                <linearGradient id="colorAsset" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={themeColor} stopOpacity={0.6} />
                                    <stop offset="95%" stopColor={themeColor} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid stroke="#1A1A1A" strokeDasharray="3 3" vertical={false} />
                            <XAxis
                                dataKey="year"
                                stroke="#444444"
                                type="number"
                                domain={['dataMin', 'dataMax']}
                                tick={{ fontSize: 10, fill: "#666666", fontWeight: 600 }}
                                tickFormatter={(v) => `${Number(v).toFixed(0)}`}
                                minTickGap={30}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                stroke="#444444"
                                tick={{ fontSize: 10, fill: "#666666", fontWeight: 600 }}
                                width={46}
                                tickFormatter={(v) => `${Math.round(Number(v) / 1_000_000)}M`}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                content={<TooltipCard mode={mode} />}
                                cursor={{ stroke: "#333", strokeWidth: 1, strokeDasharray: "4 4" }}
                            />

                            <Line
                                type="monotone"
                                dataKey="bank"
                                stroke="#444"
                                strokeWidth={2}
                                dot={false}
                                isAnimationActive={true}
                                animationDuration={RACE_DURATION_MS}
                                animationEasing="ease-in-out"
                            />
                            <Area
                                type="monotone"
                                dataKey="asset"
                                stroke={themeColor}
                                fillOpacity={1}
                                fill="url(#colorAsset)"
                                strokeWidth={3}
                                dot={false}
                                style={{ filter: dropShadow }}
                                isAnimationActive={true}
                                animationDuration={RACE_DURATION_MS}
                                animationEasing="ease-in-out"
                            />

                            {/* Current Price Reference Line */}
                            {isFinished && !isSingularity && (
                                <ReferenceLine x={CURRENT_YEAR} stroke={themeColor} strokeDasharray="3 3" strokeWidth={2}>
                                    <Label
                                        value="CURRENT (2026)"
                                        position="top"
                                        fill={themeColor}
                                        fontSize={11}
                                        fontWeight="bold"
                                    />
                                </ReferenceLine>
                            )}

                            {/* Singularity Milestones */}
                            {isSingularity && (
                                <>
                                    <ReferenceLine x={2029} stroke="#8B5CF6" strokeDasharray="3 3" strokeWidth={1}>
                                        <Label value="AGI" position="insideTopLeft" fill="#8B5CF6" fontSize={10} />
                                    </ReferenceLine>
                                    <ReferenceLine x={2035} stroke="#3B82F6" strokeDasharray="3 3" strokeWidth={1}>
                                        <Label value="ROBOTICS" position="insideTopLeft" fill="#3B82F6" fontSize={10} />
                                    </ReferenceLine>
                                    <ReferenceLine x={2045} stroke="#00FFDD" strokeDasharray="3 3" strokeWidth={2}>
                                        <Label value="SINGULARITY" position="top" fill="#00FFDD" fontSize={11} fontWeight="bold" />
                                    </ReferenceLine>
                                </>
                            )}

                            <ReferenceDot
                                x={marker.year}
                                y={marker.bank}
                                r={4}
                                fill="#555555"
                                stroke="#000000"
                                strokeWidth={2}
                            />

                            {/* Pulsing indicator dot */}
                            <ReferenceDot
                                x={marker.year}
                                y={marker.asset}
                                r={isFinished ? 8 : 6}
                                fill={themeColor}
                                stroke="#ffffff"
                                strokeWidth={2}
                                style={{
                                    filter: dropShadow,
                                    transition: "r 0.3s ease-in-out",
                                }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            );
        },
    {
        ssr: false,
        loading: () => (
            <div className="h-full w-full animate-pulse rounded-3xl border border-[#1A1A1A] bg-[#0A0A0A]" />
        ),
    },
);

export default RaceChart;
