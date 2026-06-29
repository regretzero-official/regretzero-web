"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import type {
  HistoricalMomentChartPoint,
  HistoricalMomentMode,
} from "@/features/historical-moment/types";
import { formatAxisCurrency } from "@/lib/race-engine";

interface HistoricalMomentChartProps {
  accent: string;
  mode: HistoricalMomentMode;
  momentIndex: number;
  series: HistoricalMomentChartPoint[];
}

function buildYearTicks(points: HistoricalMomentChartPoint[]) {
  if (!points.length) {
    return [];
  }

  const firstYear = Number(points[0]!.date.slice(0, 4));
  const lastYear = Number(points[points.length - 1]!.date.slice(0, 4));
  const ticks: number[] = [];

  for (let year = firstYear; year <= lastYear; year += 2) {
    const point = points.find((item) => Number(item.date.slice(0, 4)) === year);
    if (point) {
      ticks.push(point.index);
    }
  }

  const lastIndex = points[points.length - 1]!.index;
  if (!ticks.includes(lastIndex)) {
    ticks.push(lastIndex);
  }

  return ticks;
}

export function HistoricalMomentChart({
  accent,
  mode,
  momentIndex,
  series,
}: HistoricalMomentChartProps) {
  const xTicks = buildYearTicks(series);
  const boundaryIndex = mode === "revealed" ? momentIndex : (series[series.length - 1]?.index ?? momentIndex);

  return (
    <div className="surface-plot relative mt-4 h-[320px] overflow-hidden rounded-[26px]">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.012),rgba(255,255,255,0))]" />
      <ResponsiveContainer height="100%" width="100%">
        <LineChart data={series} margin={{ bottom: 28, left: 8, right: 18, top: 18 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
          <XAxis
            axisLine={false}
            dataKey="index"
            domain={[0, series[series.length - 1]?.index ?? 0]}
            tick={{ fill: "rgba(255,255,255,0.54)", fontSize: 11 }}
            tickFormatter={(value: number | string) => {
              const index = typeof value === "number" ? value : Number(value);
              const matched = series.find((point) => point.index === index);
              return matched ? matched.date.slice(0, 4) : "";
            }}
            tickLine={false}
            ticks={xTicks}
            type="number"
          />
          <YAxis
            axisLine={false}
            tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }}
            tickFormatter={(value: number) => formatAxisCurrency(value)}
            tickLine={false}
            width={64}
          />
          <ReferenceLine
            label={{
              fill: "rgba(255,255,255,0.56)",
              fontSize: 11,
              position: "insideTopRight",
              value: mode === "revealed" ? "가장 힘들었던 순간" : "여기까지 공개됨",
            }}
            stroke="rgba(255,255,255,0.22)"
            strokeDasharray="4 4"
            x={boundaryIndex}
          />
          <Line
            dataKey="value"
            dot={false}
            isAnimationActive={false}
            stroke={accent}
            strokeLinecap="round"
            strokeWidth={3}
            type="monotone"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
