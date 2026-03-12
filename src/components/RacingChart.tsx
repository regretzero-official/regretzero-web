"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartPoint } from "../data/assets";

type Mode = "REGRET" | "SINGULARITY";

type Props = {
  series: ChartPoint[];
  marker: {
    month: number;
    year: number;
    bank: number;
    asset: number;
    isFuture: boolean;
  };
  mode: Mode;
  isFinished: boolean;
  compact?: boolean;
  events?: { year: number; label: string }[];
  assetPriceUsd?: number;
  assetPriceKrw?: number;
  benchmarkLabel?: string;
  labelSafePadding?: number;
};

const KRW = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
  maximumFractionDigits: 0,
});

function formatAxisLabel(value: number) {
  if (value >= 100_000_000) return `${(value / 100_000_000).toFixed(0)}억`;
  if (value >= 10_000) return `${Math.round(value / 10_000)}만`;
  return `${Math.round(value)}`;
}

function formatYear(value: number) {
  return `${Math.floor(value)}`;
}

export default function RaceChart({
  series,
  marker,
  mode,
  isFinished,
  compact = false,
  events = [],
  assetPriceUsd,
  assetPriceKrw,
  benchmarkLabel = "금(GLD)",
  labelSafePadding = 0.08,
}: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const visibleSeries = useMemo(() => {
    if (isFinished) return series;

    const low = Math.max(0, Math.floor(marker.month));
    const high = Math.min(low + 1, series.length - 1);
    const ratio = Math.min(Math.max(marker.month - low, 0), 1);
    const p0 = series[low] ?? series[0];
    const p1 = series[high] ?? p0;

    const partial = series.slice(0, low + 1);
    if (high > low) {
      partial.push({
        ...p0,
        month: marker.month,
        year: marker.year,
        bank: p0.bank + (p1.bank - p0.bank) * ratio,
        asset: p0.asset + (p1.asset - p0.asset) * ratio,
        isFuture: marker.isFuture,
      });
    }

    return partial.length >= 2 ? partial : series.slice(0, 2);
  }, [isFinished, marker, series]);

  const maxValue = visibleSeries.reduce((max, point) => {
    return Math.max(max, point.asset, point.bank);
  }, 1);

  const accent = mode === "SINGULARITY" ? "#FFD700" : "#E31937";
  const eventLines = events.filter((event) => {
    const maxYear = visibleSeries[visibleSeries.length - 1]?.year ?? marker.year;
    return event.year >= series[0]?.year && event.year <= maxYear;
  });
  const firstPoint = series[0];
  const lastPoint = series[series.length - 1];
  const minYear = visibleSeries[0]?.year ?? marker.year;
  const maxYear = visibleSeries[visibleSeries.length - 1]?.year ?? marker.year;
  const midYear = (minYear + maxYear) / 2;
  const xRatioRaw = maxYear > minYear ? (marker.year - minYear) / (maxYear - minYear) : 0;
  const xRatio = Math.min(1 - labelSafePadding, Math.max(labelSafePadding, xRatioRaw));
  const yTop = Math.max(maxValue * 1.08, 1);
  const yRatioRaw = 1 - marker.asset / yTop;
  const yRatio = Math.min(0.88, Math.max(0.12, yRatioRaw));
  const movingPriceKrw = assetPriceKrw && Number.isFinite(assetPriceKrw) ? KRW.format(assetPriceKrw) : null;
  const movingPriceUsd = assetPriceUsd && Number.isFinite(assetPriceUsd) ? `$${assetPriceUsd.toFixed(2)}` : null;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#050505] px-3 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-3 text-[10px] font-bold text-zinc-400">
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#8B93A7]" />
            {compact ? benchmarkLabel : `안전자산 ${benchmarkLabel}`}
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: accent }} />
            {compact ? "자산" : "선택 자산"}
          </span>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold tracking-[0.18em] text-zinc-400">
          {isFinished ? "레이스 종료" : "레이스 진행중"}
        </div>
      </div>

      {mounted ? (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={visibleSeries} margin={{ top: 10, right: 12, left: -20, bottom: 8 }}>
            <defs>
              <linearGradient id="assetAreaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accent} stopOpacity={0.38} />
                <stop offset="100%" stopColor={accent} stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="year"
              tickFormatter={formatYear}
              tick={{ fill: "#71717A", fontSize: 10, fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
              minTickGap={8}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, Math.max(maxValue * 1.08, 1)]}
              tickFormatter={formatAxisLabel}
              tick={{ fill: "#71717A", fontSize: 11, fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
              width={50}
            />
            <Tooltip
              cursor={{ stroke: "rgba(255,255,255,0.12)", strokeDasharray: "3 3" }}
              contentStyle={{
                background: "rgba(10,10,10,0.96)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16,
                color: "#fff",
              }}
              formatter={(value, name) => {
                const numericValue = typeof value === "number" ? value : Number(value ?? 0);
                return [KRW.format(numericValue), name === "asset" ? "선택 자산" : benchmarkLabel];
              }}
              labelFormatter={(label) => {
                const numericLabel = typeof label === "number" ? label : Number(label ?? 0);
                return `${Math.floor(numericLabel)}년`;
              }}
            />

            <ReferenceLine
              x={marker.year}
              stroke="rgba(255,255,255,0.14)"
              strokeDasharray="4 4"
            />

            {firstPoint ? (
              <ReferenceDot
                x={firstPoint.year}
                y={firstPoint.asset}
                r={4}
                fill={accent}
                stroke="#050505"
                strokeWidth={2}
              />
            ) : null}

            {eventLines.map((event) => (
              <ReferenceLine
                key={`${event.year}-${event.label}`}
                x={event.year}
                stroke="rgba(255,215,0,0.22)"
                strokeDasharray="2 4"
              />
            ))}

            <Area
              type="monotone"
              dataKey="asset"
              stroke={accent}
              strokeWidth={4}
              fill="url(#assetAreaFill)"
              activeDot={false}
              animationDuration={0}
              isAnimationActive={false}
            />

            <Line
              type="monotone"
              dataKey="bank"
              stroke="#8B93A7"
              strokeWidth={3}
              dot={false}
              activeDot={false}
              animationDuration={0}
              isAnimationActive={false}
            />

            <ReferenceDot
              x={marker.year}
              y={marker.asset}
              r={6}
              fill={accent}
              stroke="#050505"
              strokeWidth={3}
            />

            <ReferenceDot
              x={marker.year}
              y={marker.bank}
              r={5}
              fill="#8B93A7"
              stroke="#050505"
              strokeWidth={3}
            />

            {isFinished && lastPoint ? (
              <ReferenceDot
                x={lastPoint.year}
                y={lastPoint.asset}
                r={5}
                fill={accent}
                stroke="#050505"
                strokeWidth={2}
              />
            ) : null}
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-full w-full animate-pulse rounded-2xl bg-white/5" />
      )}

      {!compact && (movingPriceKrw || movingPriceUsd) ? (
        <div
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-[120%]"
          style={{ left: `${xRatio * 100}%`, top: `${yRatio * 100}%` }}
        >
          <div className="rounded-xl border border-[#E31937]/45 bg-[#16070B]/92 px-2 py-1 shadow-[0_8px_24px_rgba(227,25,55,0.3)] backdrop-blur">
            {movingPriceKrw ? <p className="text-[10px] font-black text-[#FFD7DF]">{movingPriceKrw}</p> : null}
            {movingPriceUsd ? <p className="text-[9px] font-bold text-zinc-300">{movingPriceUsd}</p> : null}
          </div>
        </div>
      ) : null}

      {!compact ? (
        <div className="pointer-events-none absolute bottom-2 left-10 right-4 z-10 flex items-center justify-between text-[10px] font-bold text-zinc-500">
          <span>{Math.floor(minYear)}</span>
          <span>{Math.floor(midYear)}</span>
          <span>{Math.floor(maxYear)}</span>
        </div>
      ) : null}
    </div>
  );
}
