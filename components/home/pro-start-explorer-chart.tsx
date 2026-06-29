"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import type { AssetPricePoint, RaceResolution } from "@/lib/race-engine";
import { formatAxisCurrency } from "@/lib/race-engine";

interface ProStartExplorerChartProps {
  accent: string;
  assetLabel: string;
  onSelectDate: (date: string) => void;
  resolution: RaceResolution;
  selectedDate: string;
  series: AssetPricePoint[];
}

function formatTickDate(date: string, resolution: RaceResolution) {
  const [year, month, day] = date.split("-");

  if (resolution === "daily") {
    return `${month}.${day}`;
  }

  return `${year.slice(2)}.${month}`;
}

function buildTickDates(series: AssetPricePoint[], resolution: RaceResolution) {
  if (series.length <= 2) {
    return series.map((point) => point.date);
  }

  if (resolution === "daily") {
    const step = Math.max(1, Math.floor(series.length / 5));
    return series
      .filter((_, index) => index % step === 0 || index === series.length - 1)
      .map((point) => point.date);
  }

  const ticks: string[] = [];
  const seen = new Set<string>();

  for (const point of series) {
    const yearMonthKey = point.date.slice(0, 7);
    if (!seen.has(yearMonthKey)) {
      seen.add(yearMonthKey);
      ticks.push(point.date);
    }
  }

  const step = resolution === "weekly" ? 4 : 10;
  const sampledTicks = ticks.filter((_, index) => index % step === 0);
  const lastDate = series[series.length - 1]!.date;

  if (!sampledTicks.includes(lastDate)) {
    sampledTicks.push(lastDate);
  }

  return sampledTicks;
}

export function ProStartExplorerChart({
  accent,
  assetLabel,
  onSelectDate,
  resolution,
  selectedDate,
  series,
}: ProStartExplorerChartProps) {
  const chartData = useMemo(
    () =>
      series.map((point, index) => ({
        ...point,
        index,
      })),
    [series],
  );
  const ticks = useMemo(() => buildTickDates(series, resolution), [resolution, series]);

  if (!chartData.length) {
    return (
      <div className="surface-plot flex h-[220px] items-center justify-center rounded-[24px] text-sm text-white/42">
        {`${assetLabel}\uC758 \uACFC\uAC70 \uD750\uB984\uC744 \uBD88\uB7EC\uC624\uACE0 \uC788\uC2B5\uB2C8\uB2E4.`}
      </div>
    );
  }

  return (
    <div className="surface-plot h-[220px] overflow-hidden rounded-[24px]">
      <ResponsiveContainer height="100%" width="100%">
        <LineChart
          data={chartData}
          margin={{ top: 18, right: 18, left: 8, bottom: 16 }}
          onClick={(state) => {
            const payload = (
              state as {
                activePayload?: Array<{ payload?: AssetPricePoint }>;
              }
            ).activePayload?.[0]?.payload;

            if (payload?.date) {
              onSelectDate(payload.date);
            }
          }}
        >
          <CartesianGrid stroke="rgba(148,163,184,0.18)" vertical={false} />
          <XAxis
            axisLine={false}
            dataKey="date"
            tick={{ fill: "rgba(100,116,139,0.8)", fontSize: 10 }}
            tickFormatter={(value: string) => formatTickDate(value, resolution)}
            tickLine={false}
            ticks={ticks}
          />
          <YAxis
            axisLine={false}
            tick={{ fill: "rgba(100,116,139,0.72)", fontSize: 10 }}
            tickFormatter={(value: number) => formatAxisCurrency(value)}
            tickLine={false}
            width={64}
          />
          <ReferenceLine
            ifOverflow="extendDomain"
            label={{
              fill: accent,
              fontSize: 10,
              position: "top",
              value: "\uC120\uD0DD\uD55C \uB0A0\uC9DC",
            }}
            stroke={accent}
            strokeDasharray="4 4"
            x={selectedDate}
          />
          <Line
            dataKey="price"
            dot={false}
            isAnimationActive={false}
            stroke={accent}
            strokeLinecap="round"
            strokeWidth={2.5}
            type="monotone"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
