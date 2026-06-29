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
type RacePoint = {
  month: number;
  year: number;
  asset: number;
  benchmark?: number;
  isFuture: boolean;
};

type Props = {
  series: RacePoint[];
  marker: {
    month: number;
    year: number;
    asset: number;
    benchmark?: number;
    isFuture: boolean;
  };
  isFinished: boolean;
  benchmarkLabel?: string;
  floatingLabels?: Array<{
    label: string;
    value: string;
    color: string;
  }>;
  progressDateLabel?: string;
  rangeLabel?: string;
  displayStartYear?: number;
  displayStartMonth?: number;
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

function formatYearMonth(value: number, startYear: number, startMonth: number) {
  const offsetMonths = Math.round((value - startYear) * 12);
  const absoluteMonthIndex = startMonth - 1 + offsetMonths;
  const yearOffset = Math.floor(absoluteMonthIndex / 12);
  const monthIndex = ((absoluteMonthIndex % 12) + 12) % 12;
  return `${startYear + yearOffset}.${String(monthIndex + 1).padStart(2, "0")}`;
}

export default function RaceChart({
  series,
  marker,
  isFinished,
  benchmarkLabel = "금(GLD)",
  floatingLabels = [],
  progressDateLabel,
  rangeLabel,
  displayStartYear = 2016,
  displayStartMonth = 1,
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
        asset: p0.asset + (p1.asset - p0.asset) * ratio,
        benchmark:
          (p0.benchmark ?? 0) + ((p1.benchmark ?? p0.benchmark ?? 0) - (p0.benchmark ?? 0)) * ratio,
        isFuture: marker.isFuture,
      });
    }

    return partial.length >= 2 ? partial : series.slice(0, 2);
  }, [isFinished, marker, series]);

  const maxValue = visibleSeries.reduce(
    (max, point) => Math.max(max, point.asset, point.benchmark ?? 0),
    1,
  );
  const baseInvestment = series[0]?.asset ?? 10_000_000;
  const yMax = Math.max(maxValue * 1.08, baseInvestment * 1.2, 1);
  const yTicks = Array.from(
    new Set([0, baseInvestment, Math.round(yMax * 0.5), Math.round(yMax)]),
  ).sort((a, b) => a - b);

  const assetAccent = "#C62828";
  const benchmarkAccent = "#163B74";
  const firstPoint = visibleSeries[0];
  const lastPoint = visibleSeries[visibleSeries.length - 1];
  const minYear = visibleSeries[0]?.year ?? marker.year;
  const maxYear = visibleSeries[visibleSeries.length - 1]?.year ?? marker.year;
  const xRatioRaw = maxYear > minYear ? (marker.year - minYear) / (maxYear - minYear) : 0;
  const xRatio = Math.min(0.82, Math.max(0.22, xRatioRaw));
  const yTop = Math.max(maxValue * 1.08, 1);
  const yRatioRaw = 1 - marker.asset / yTop;
  const yRatio = Math.min(0.74, Math.max(0.2, yRatioRaw));

  return (
    <div className="flex w-full flex-col rounded-[28px] border border-black/6 bg-[linear-gradient(180deg,#fffefb_0%,#f5f1e7_100%)] px-3 py-4 sm:px-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-[#6e6759]">
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: assetAccent }} />
            선택 자산
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: benchmarkAccent }} />
            비교 자산 {benchmarkLabel}
          </span>
        </div>
        <div className="rounded-full border border-black/6 bg-white/85 px-3 py-1 text-[10px] font-black tracking-[0.18em] text-[#6e6759]">
          {isFinished ? "레이스 종료" : "레이스 진행 중"}
        </div>
      </div>

      {progressDateLabel ? (
        <div className="mb-3 flex items-center justify-between rounded-2xl border border-black/6 bg-white/72 px-3 py-2 text-[11px] font-bold text-[#5f584a]">
          <span>진행 시점</span>
          <span className="font-black text-[#111111]">{progressDateLabel}</span>
        </div>
      ) : null}

      <div className="relative h-[300px] sm:h-[380px] lg:h-[430px]">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={visibleSeries} margin={{ top: 10, right: 20, left: 10, bottom: 8 }}>
              <defs>
                <linearGradient id="assetAreaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={assetAccent} stopOpacity={0.32} />
                  <stop offset="100%" stopColor={assetAccent} stopOpacity={0.04} />
                </linearGradient>
              </defs>

              <CartesianGrid stroke="rgba(17,24,39,0.08)" vertical={false} />
              <XAxis
                dataKey="year"
                tickFormatter={(value) => formatYearMonth(value, displayStartYear, displayStartMonth)}
                tick={{ fill: "#746D5D", fontSize: 10, fontWeight: 700 }}
                axisLine={false}
                tickLine={false}
                minTickGap={8}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[0, yMax]}
                ticks={yTicks}
                tickFormatter={formatAxisLabel}
                tick={{ fill: "#746D5D", fontSize: 11, fontWeight: 700 }}
                axisLine={false}
                tickLine={false}
                width={74}
              />
              <Tooltip
                cursor={{ stroke: "rgba(17,24,39,0.12)", strokeDasharray: "3 3" }}
                contentStyle={{
                  background: "rgba(255,253,248,0.98)",
                  border: "1px solid rgba(17,24,39,0.08)",
                  borderRadius: 16,
                  color: "#171717",
                }}
                formatter={(value, name) => {
                  const numericValue = typeof value === "number" ? value : Number(value ?? 0);
                  const label = name === "asset" ? "선택 자산" : benchmarkLabel;
                  return [KRW.format(numericValue), label];
                }}
                labelFormatter={(label) =>
                  formatYearMonth(
                    typeof label === "number" ? label : Number(label ?? 0),
                    displayStartYear,
                    displayStartMonth,
                  )
                }
              />
              <ReferenceLine x={marker.year} stroke="rgba(17,24,39,0.14)" strokeDasharray="4 4" />
              <Area
                type="monotone"
                dataKey="asset"
                stroke={assetAccent}
                strokeWidth={4}
                fill="url(#assetAreaFill)"
                activeDot={false}
                animationDuration={0}
                isAnimationActive={false}
              />
              <Line type="monotone" dataKey="benchmark" stroke={benchmarkAccent} strokeWidth={3} dot={false} activeDot={false} animationDuration={0} isAnimationActive={false} />
              {firstPoint ? (
                <>
                  <ReferenceDot x={firstPoint.year} y={firstPoint.asset} r={4} fill={assetAccent} stroke="#fffdf8" strokeWidth={2} />
                  {typeof firstPoint.benchmark === "number" ? (
                    <ReferenceDot x={firstPoint.year} y={firstPoint.benchmark} r={4} fill={benchmarkAccent} stroke="#fffdf8" strokeWidth={2} />
                  ) : null}
                </>
              ) : null}
              <ReferenceDot x={marker.year} y={marker.asset} r={6} fill={assetAccent} stroke="#fffdf8" strokeWidth={3} />
              {typeof marker.benchmark === "number" ? (
                <ReferenceDot x={marker.year} y={marker.benchmark} r={5} fill={benchmarkAccent} stroke="#fffdf8" strokeWidth={3} />
              ) : null}
              {isFinished && lastPoint ? (
                <>
                  <ReferenceDot x={lastPoint.year} y={lastPoint.asset} r={5} fill={assetAccent} stroke="#fffdf8" strokeWidth={2} />
                  {typeof lastPoint.benchmark === "number" ? (
                    <ReferenceDot x={lastPoint.year} y={lastPoint.benchmark} r={4} fill={benchmarkAccent} stroke="#fffdf8" strokeWidth={2} />
                  ) : null}
                </>
              ) : null}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full animate-pulse rounded-2xl bg-black/5" />
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-black/6 bg-white/72 px-3 py-2 text-[11px] font-bold text-[#5f584a]">
        <span>레이스 시간</span>
        <span className="font-black text-[#111111]">{rangeLabel}</span>
      </div>

      {floatingLabels.length > 0 ? (
        <div className="mt-3 rounded-2xl border border-black/8 bg-white/96 px-3 py-3 shadow-[0_12px_36px_rgba(15,23,42,0.10)]">
          <div className="mb-2 text-[10px] font-black tracking-[0.16em] text-[#8a7a56]">실시간 평가금액</div>
          <div className="grid gap-1 sm:grid-cols-3 sm:gap-3">
            {floatingLabels.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3 sm:block">
                <div className="text-[10px] font-black" style={{ color: item.color }}>
                  {item.label}
                </div>
                <div className="text-[11px] font-bold text-[#3f3a30] sm:mt-1">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
