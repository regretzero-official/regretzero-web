"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import {
  getComparisonSlotColor,
  getComparisonSlotGlow,
} from "@/lib/asset-colors";
import { formatKrwCompact, type RacePoint } from "@/lib/race-engine";
import type { RaceMoment, RaceMomentTone } from "@/features/chart-race/buildRaceMoments";

export interface RaceChartAsset {
  id: string;
  label: string;
  shortLabel?: string;
}

interface RaceChartProps {
  assets: RaceChartAsset[];
  basisLabel?: string;
  currentPoint: RacePoint | null;
  data: RacePoint[];
  fullData: RacePoint[];
  headerSubtitle?: string;
  headerTitle?: string;
  isLoading: boolean;
  moments?: RaceMoment[];
  onSelectMoment?: (moment: RaceMoment) => void;
  principalKrw: number;
  valueBasis?: "initial" | "invested";
}

interface AnimatedMetricProps {
  formatter: (value: number) => string;
  value: number;
}

interface DotProps {
  cx?: number;
  cy?: number;
  index?: number;
}

interface PlotMetrics {
  height: number;
  width: number;
}

interface LabelEntry {
  asset: RaceChartAsset;
  slot: number;
  slotColor: string;
  value: number;
  visualY: number;
}

interface SlotSummary {
  asset: RaceChartAsset;
  multiple: number;
  rank: number;
  slot: number;
  slotColor: string;
  slotGlow: string;
  value: number;
}

const CHART_MARGIN = {
  bottom: 28,
  left: 8,
  right: 18,
  top: 18,
};

const Y_AXIS_WIDTH = 68;
const LABEL_GAP = 34;
const DATE_BOX_HEIGHT = 60;
const DATE_BOX_WIDTH = 124;
const MULTIPLE_TICKS = [0.7, 0.85, 1, 1.2, 1.5, 2, 3, 5, 8, 12, 20, 35, 50];

function formatCurrentDate(date: string) {
  const [year, month] = date.split("-");
  return `${year}.${month}`;
}

function getRaceCardLabel(asset: RaceChartAsset) {
  return asset.shortLabel ?? asset.label;
}

function formatYear(date: string) {
  return date.slice(0, 4);
}

function formatMultiple(value: number, principalKrw: number) {
  const multiple = value / principalKrw;

  if (multiple >= 10) {
    return `${multiple.toFixed(1).replace(/\.0$/, "")}\uBC30`;
  }

  return `${multiple.toFixed(2).replace(/0$/, "").replace(/\.0$/, "")}\uBC30`;
}

function getMomentToneStyle(tone: RaceMomentTone) {
  if (tone === "danger") {
    return {
      backgroundColor: "rgba(248,113,113,0.16)",
      borderColor: "rgba(248,113,113,0.34)",
      boxShadow: "0 12px 28px rgba(248,113,113,0.14)",
      color: "#fca5a5",
    };
  }

  if (tone === "recovery") {
    return {
      backgroundColor: "rgba(34,197,94,0.16)",
      borderColor: "rgba(34,197,94,0.3)",
      boxShadow: "0 12px 28px rgba(34,197,94,0.12)",
      color: "#86efac",
    };
  }

  return {
    backgroundColor: "rgba(96,165,250,0.16)",
    borderColor: "rgba(96,165,250,0.34)",
    boxShadow: "0 12px 28px rgba(96,165,250,0.13)",
    color: "#93c5fd",
  };
}

function getPointBasis(
  point: RacePoint | null,
  principalKrw: number,
  valueBasis: "initial" | "invested",
) {
  if (valueBasis !== "invested" || !point) {
    return principalKrw;
  }

  const totalInvested = Number(point.totalInvestedKrw ?? 0);
  return totalInvested > 0 ? totalInvested : principalKrw;
}

function formatNormalizedTick(value: number) {
  if (value === 1) {
    return "1.0\uBC30";
  }

  if (value < 1) {
    return `${value.toFixed(2).replace(/0$/, "").replace(/\.0$/, "")}\uBC30`;
  }

  if (value < 2) {
    return `${value.toFixed(1).replace(/\.0$/, "")}\uBC30`;
  }

  return `${value.toFixed(0)}\uBC30`;
}

function buildYearTicks(points: RacePoint[]) {
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

function buildNormalizedTicks(minMultiple: number, maxMultiple: number) {
  const ticks = MULTIPLE_TICKS.filter(
    (tick) => tick >= minMultiple * 0.98 && tick <= maxMultiple * 1.02,
  );
  const lowerTick = [...MULTIPLE_TICKS].reverse().find((tick) => tick < minMultiple);
  const upperTick = MULTIPLE_TICKS.find((tick) => tick > maxMultiple);

  if (lowerTick && !ticks.includes(lowerTick)) {
    ticks.unshift(lowerTick);
  }

  if (!ticks.includes(1)) {
    ticks.push(1);
  }

  if (upperTick && !ticks.includes(upperTick)) {
    ticks.push(upperTick);
  }

  if (!ticks.length) {
    return [Math.max(0.7, minMultiple), Math.max(1.2, maxMultiple)];
  }

  return [...new Set(ticks)].sort((left, right) => left - right);
}

function getLogRatio(value: number, minValue: number, maxValue: number) {
  if (value <= 0 || minValue <= 0 || maxValue <= 0 || minValue === maxValue) {
    return 0.5;
  }

  return (
    (Math.log(value) - Math.log(minValue)) / (Math.log(maxValue) - Math.log(minValue))
  );
}

function renderCurrentDot(slotIndex: number, totalLength: number) {
  const currentIndex = totalLength - 1;
  const slotColor = getComparisonSlotColor(slotIndex);

  return function CurrentDot(props: DotProps) {
    const { cx, cy, index } = props;

    if (
      typeof cx !== "number" ||
      typeof cy !== "number" ||
      typeof index !== "number" ||
      index !== currentIndex
    ) {
      return null;
    }

    return (
      <g>
        <circle
          cx={cx}
          cy={cy}
          fill={slotColor}
          fillOpacity={0.16}
          r={11}
          style={{ animation: "pulse-slow 2.2s ease-in-out infinite" }}
        />
        <circle
          cx={cx}
          cy={cy}
          fill={slotColor}
          r={4.8}
          stroke="rgba(255,255,255,0.95)"
          strokeWidth={1.5}
        />
      </g>
    );
  };
}

function AnimatedMetric({ formatter, value }: AnimatedMetricProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const displayRef = useRef(value);

  useEffect(() => {
    const from = displayRef.current;
    const delta = value - from;
    let frameId = 0;

    if (Math.abs(delta) < 1) {
      frameId = requestAnimationFrame(() => {
        displayRef.current = value;
        setDisplayValue(value);
      });

      return () => cancelAnimationFrame(frameId);
    }

    const startedAt = performance.now();

    const tick = (timestamp: number) => {
      const progress = Math.min(1, (timestamp - startedAt) / 220);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const nextValue = from + delta * easedProgress;

      displayRef.current = nextValue;
      setDisplayValue(nextValue);

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [value]);

  return <>{formatter(displayValue)}</>;
}

export function RaceChart({
  assets,
  basisLabel,
  currentPoint,
  data,
  fullData,
  headerSubtitle,
  headerTitle,
  isLoading,
  moments = [],
  onSelectMoment,
  principalKrw,
  valueBasis = "initial",
}: RaceChartProps) {
  const plotRef = useRef<HTMLDivElement | null>(null);
  const [plotMetrics, setPlotMetrics] = useState<PlotMetrics>({ height: 0, width: 0 });

  useEffect(() => {
    const element = plotRef.current;
    if (!element) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }

      setPlotMetrics({
        height: entry.contentRect.height,
        width: entry.contentRect.width,
      });
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const { normalizedData, labelEntries, slotSummaries, xTicks, yDomain, yTicks } = useMemo(() => {
    if (!fullData.length) {
      return {
        labelEntries: [] as LabelEntry[],
        normalizedData: [] as RacePoint[],
        slotSummaries: [] as SlotSummary[],
        xTicks: [] as number[],
        yDomain: [0.7, 2] as [number, number],
        yTicks: [0.7, 1, 1.5, 2] as number[],
      };
    }

    const initialPoint = fullData[0]!;
    const normalizePoint = (point: RacePoint) => {
      const nextPoint: RacePoint = {
        date: point.date,
        index: point.index,
        label: point.label,
      };

      for (const asset of assets) {
        const baseValue =
          valueBasis === "invested"
            ? getPointBasis(point, principalKrw, valueBasis)
            : Number(initialPoint[asset.id] ?? principalKrw);
        const currentValue = Number(point[asset.id] ?? principalKrw);
        nextPoint[asset.id] = baseValue > 0 ? currentValue / baseValue : 1;
      }

      return nextPoint;
    };

    const nextFullNormalizedData = fullData.map(normalizePoint);
    const nextNormalizedData = data.map(normalizePoint);
    const normalizedValues = nextFullNormalizedData.flatMap((point) =>
      assets.map((asset) => Number(point[asset.id] ?? 1)),
    );
    const minMultiple = Math.max(0.7, Math.min(...normalizedValues) * 0.94);
    const maxMultiple = Math.max(1.25, Math.max(...normalizedValues) * 1.04);
    const nextYTicks = buildNormalizedTicks(minMultiple, maxMultiple);
    const yMin = nextYTicks[0]!;
    const yMax = nextYTicks[nextYTicks.length - 1]!;
    const nextXTicks = buildYearTicks(fullData);
    const currentAssetMetrics = assets.map((asset) => ({
      asset,
      multiple: currentPoint
        ? Number(currentPoint[asset.id] ?? principalKrw) / getPointBasis(currentPoint, principalKrw, valueBasis)
        : 1,
      value: currentPoint ? Number(currentPoint[asset.id] ?? principalKrw) : principalKrw,
    }));
    const rankByAssetId = new Map(
      [...currentAssetMetrics]
        .sort((left, right) => right.value - left.value)
        .map((entry, index) => [entry.asset.id, index + 1] as const),
    );
    const nextSlotSummaries = currentAssetMetrics.map((entry, index) => ({
      ...entry,
      rank: rankByAssetId.get(entry.asset.id) ?? index + 1,
      slot: index + 1,
      slotColor: getComparisonSlotColor(index),
      slotGlow: getComparisonSlotGlow(index, 0.16),
    }));

    const plotHeight = Math.max(0, plotMetrics.height - CHART_MARGIN.top - CHART_MARGIN.bottom);
    const nextLabelEntries =
      currentPoint && plotHeight > 0
        ? (() => {
            const rawEntries = assets
              .map((asset, index) => {
                const actualValue = Number(currentPoint[asset.id] ?? principalKrw);
                const multiple = actualValue / getPointBasis(currentPoint, principalKrw, valueBasis);
                const ratio = getLogRatio(multiple, yMin, yMax);

                return {
                  asset,
                  rawY: CHART_MARGIN.top + plotHeight * (1 - ratio),
                  slot: index + 1,
                  slotColor: getComparisonSlotColor(index),
                  value: actualValue,
                };
              })
              .sort((left, right) => left.rawY - right.rawY);

            const adjustedEntries: Array<(typeof rawEntries)[number] & { visualY: number }> = [];

            for (const entry of rawEntries) {
              const minimumY =
                adjustedEntries.length === 0
                  ? entry.rawY
                  : adjustedEntries[adjustedEntries.length - 1]!.visualY + LABEL_GAP;

              adjustedEntries.push({
                ...entry,
                visualY: Math.max(entry.rawY, minimumY),
              });
            }

            for (let index = adjustedEntries.length - 2; index >= 0; index -= 1) {
              adjustedEntries[index] = {
                ...adjustedEntries[index]!,
                visualY: Math.min(
                  adjustedEntries[index]!.visualY,
                  adjustedEntries[index + 1]!.visualY - LABEL_GAP,
                ),
              };
            }

            return adjustedEntries.map((entry) => ({
              asset: entry.asset,
              slot: entry.slot,
              slotColor: entry.slotColor,
              value: entry.value,
              visualY: Math.min(
                Math.max(entry.visualY, CHART_MARGIN.top + 12),
                CHART_MARGIN.top + plotHeight - 12,
              ),
            }));
          })()
        : [];

    return {
      labelEntries: nextLabelEntries,
      normalizedData: nextNormalizedData,
      slotSummaries: nextSlotSummaries,
      xTicks: nextXTicks,
      yDomain: [yMin, yMax] as [number, number],
      yTicks: nextYTicks,
    };
  }, [assets, currentPoint, data, fullData, plotMetrics.height, principalKrw, valueBasis]);

  if (isLoading || !fullData.length) {
    return (
      <div className="surface-section flex h-[520px] items-center justify-center rounded-[30px] text-sm text-white/48">
        {"\uB808\uC774\uC2A4\uB97C \uC900\uBE44\uD558\uACE0 \uC788\uC2B5\uB2C8\uB2E4..."}
      </div>
    );
  }

  const lastPoint = fullData[fullData.length - 1]!;
  const currentIndex = currentPoint?.index ?? 0;
  const currentRatio = lastPoint.index > 0 ? currentIndex / lastPoint.index : 0;
  const leaderSummary =
    slotSummaries.find((summary) => summary.rank === 1) ?? slotSummaries[0] ?? null;
  const plotWidth = Math.max(
    0,
    plotMetrics.width - CHART_MARGIN.left - CHART_MARGIN.right - Y_AXIS_WIDTH,
  );
  const currentX =
    plotMetrics.width > 0
      ? Math.min(
          plotMetrics.width - CHART_MARGIN.right - 8,
          Math.max(
            Y_AXIS_WIDTH + CHART_MARGIN.left,
            Y_AXIS_WIDTH + CHART_MARGIN.left + plotWidth * currentRatio,
          ),
        )
      : Y_AXIS_WIDTH + CHART_MARGIN.left;
  const currentDate = currentPoint ? formatCurrentDate(currentPoint.date) : "----.--";
  const reachedMoments = moments.filter((moment) => moment.index <= currentIndex);
  const activeMoment = reachedMoments[reachedMoments.length - 1] ?? null;
  const secondSummary = slotSummaries.find((summary) => summary.rank === 2) ?? null;
  const rankedSlotSummaries = [...slotSummaries].sort(
    (left, right) => left.rank - right.rank || left.slot - right.slot,
  );
  const currentBasis = getPointBasis(currentPoint, principalKrw, valueBasis);
  const currentGapLabel =
    leaderSummary && secondSummary
      ? formatMultiple(leaderSummary.value, secondSummary.value)
      : leaderSummary
        ? formatMultiple(leaderSummary.value, currentBasis)
        : "-";
  const basisText = basisLabel ?? `1.0\uBC30 = ${formatKrwCompact(principalKrw)}`;

  return (
    <div className="surface-section flex flex-col rounded-[26px] p-3 sm:rounded-[30px] sm:p-4">
      <div className="order-3 mt-4 hidden items-start justify-between gap-3 sm:flex">
        <div>
          <div className="text-[1.32rem] font-semibold tracking-[-0.05em] text-white">
            {headerTitle ?? `${formatKrwCompact(principalKrw)}\uC73C\uB85C \uCD9C\uBC1C\uD558\uBA74`}
          </div>
          <div className="mt-2 text-sm leading-6 text-white/58">
            {headerSubtitle ?? "\uAC19\uC740 \uB3C8\uC73C\uB85C \uC2DC\uC791\uD574\uB3C4, \uC790\uC0B0\uB9C8\uB2E4 \uD750\uB984\uACFC \uACB0\uACFC\uB294 \uB2EC\uB77C\uC9D1\uB2C8\uB2E4."}
          </div>
        </div>

        <div
          className="surface-card rounded-[18px] px-3 py-2 text-right [font-variant-numeric:tabular-nums]"
          style={{
            height: DATE_BOX_HEIGHT,
            width: DATE_BOX_WIDTH,
          }}
        >
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">
            {"\uD604\uC7AC \uC2DC\uC810"}
          </div>
          <div className="mt-1 whitespace-nowrap text-sm font-semibold tracking-[-0.03em] text-white">
            {currentDate}
          </div>
        </div>
      </div>

      <div
        className="order-2 mt-3 grid gap-2 sm:order-4 sm:mt-4"
        style={{ gridTemplateColumns: `repeat(${Math.max(1, assets.length)}, minmax(0, 1fr))` }}
      >
        {rankedSlotSummaries.map(({ asset, multiple, rank, slot, slotColor, slotGlow, value }) => (
          <div
            key={asset.id}
            className="min-w-0 rounded-[18px] border px-3 py-2.5 transition duration-300 ease-out sm:rounded-[20px] sm:py-3"
            style={{
              backgroundColor: rank === 1 ? getComparisonSlotGlow(slot - 1, 0.22) : slotGlow,
              borderColor: rank === 1 ? `${slotColor}72` : `${slotColor}46`,
              boxShadow: rank === 1 ? `0 12px 30px ${slotColor}16` : "none",
              transform: rank === 1 ? "translateY(-1px)" : "translateY(0)",
            }}
          >
            <div className="flex items-center gap-2">
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
                style={{ backgroundColor: `${slotColor}2A`, color: slotColor }}
              >
                {rank}
              </span>
              <div className="min-w-0">
                <div
                  className={`font-semibold tracking-[-0.03em] text-white ${
                    assets.length >= 3 ? "text-[13px] leading-[1.2]" : "text-sm leading-5"
                  }`}
                  style={{ overflowWrap: "anywhere" }}
                >
                  {getRaceCardLabel(asset)}
                </div>
                <div className="mt-1 text-[11px] text-white/42">
                  {`\uD604\uC7AC ${rank}\uC704`}
                </div>
              </div>
            </div>

            <div className="mt-2 text-sm font-semibold tracking-[-0.03em] text-white [font-variant-numeric:tabular-nums] sm:mt-3">
              <AnimatedMetric formatter={formatKrwCompact} value={value} />
            </div>

            <div className="mt-1 text-[11px] text-white/42 [font-variant-numeric:tabular-nums]">
              <AnimatedMetric
                formatter={(nextValue) =>
                  formatMultiple(
                    nextValue,
                    getPointBasis(currentPoint, principalKrw, valueBasis),
                  )
                }
                value={value}
              />
            </div>

            <div
              className="mt-2 h-1.5 rounded-full sm:mt-3"
              style={{
                background: `linear-gradient(90deg, ${slotColor} 0%, rgba(148,163,184,0.18) ${Math.min(
                  100,
                  Math.max(18, multiple * 18),
                )}%)`,
              }}
            />
          </div>
        ))}
      </div>

      <div className="order-4 mt-4 hidden grid-cols-2 gap-2 sm:grid sm:grid-cols-3">
        <div className="min-w-0 rounded-[16px] border border-white/8 bg-white/[0.03] px-3 py-2.5">
          <div className="text-[10px] uppercase tracking-[0.16em] text-white/34">현재 1위</div>
          <div className="mt-1 truncate text-sm font-semibold text-white">
            {leaderSummary ? getRaceCardLabel(leaderSummary.asset) : "-"}
          </div>
        </div>
        <div className="min-w-0 rounded-[16px] border border-white/8 bg-white/[0.03] px-3 py-2.5">
          <div className="text-[10px] uppercase tracking-[0.16em] text-white/34">
            {secondSummary ? "현재 격차" : "현재 배수"}
          </div>
          <div className="mt-1 text-sm font-semibold text-white [font-variant-numeric:tabular-nums]">
            {currentGapLabel}
          </div>
        </div>
        <div className="col-span-2 min-w-0 rounded-[16px] border border-white/8 bg-white/[0.03] px-3 py-2.5 sm:col-span-1">
          <div className="text-[10px] uppercase tracking-[0.16em] text-white/34">기준</div>
          <div className="mt-1 whitespace-normal break-keep text-sm font-semibold leading-5 text-white">
            {basisText}
          </div>
        </div>
      </div>

      <div
        ref={plotRef}
        className="surface-plot order-1 relative h-[280px] overflow-hidden rounded-[24px] sm:h-[400px] sm:rounded-[26px]"
      >
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.5),rgba(255,255,255,0))]" />

        {leaderSummary ? (
          <div
            key={leaderSummary.asset.id}
            className="pointer-events-none absolute left-4 top-4 z-20 animate-[fade-in_240ms_ease-out]"
          >
            <div
              className="surface-floating rounded-[18px] border px-3 py-2.5 text-white backdrop-blur-xl"
              style={{
                backgroundColor: leaderSummary.slotGlow,
                borderColor: `${leaderSummary.slotColor}54`,
                boxShadow: `0 12px 28px ${leaderSummary.slotColor}16`,
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
                  style={{
                    backgroundColor: `${leaderSummary.slotColor}2A`,
                    color: leaderSummary.slotColor,
                  }}
                >
                  {leaderSummary.rank}
                </span>
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/60">
                  {"\uD604\uC7AC 1\uC704"}
                </div>
              </div>
              <div className="mt-2 text-sm font-semibold tracking-[-0.03em] text-white">
                {leaderSummary.asset.label}
              </div>
              <div className="mt-1 text-[11px] text-white/50 [font-variant-numeric:tabular-nums]">
                <AnimatedMetric formatter={formatKrwCompact} value={leaderSummary.value} />
              </div>
            </div>
          </div>
        ) : null}

        <div
          className="pointer-events-none absolute bottom-7 top-5 z-10 w-px bg-slate-300/70"
          style={{ left: currentX }}
        />

        {labelEntries.map(({ asset, slot, slotColor, value, visualY }) => {
          const alignLeft = currentX > plotMetrics.width - 160;

          return (
            <div
              key={asset.id}
              className="pointer-events-none absolute z-20"
              style={{
                left: alignLeft ? currentX - 12 : currentX + 12,
                top: visualY,
                transform: alignLeft ? "translate(-100%, -50%)" : "translateY(-50%)",
              }}
            >
              <div className="surface-floating rounded-full px-2.5 py-1.5 text-[11px] text-white backdrop-blur-xl">
                <div className="flex min-w-0 items-center gap-1.5 [font-variant-numeric:tabular-nums]">
                  <span
                    className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
                    style={{ backgroundColor: `${slotColor}26`, color: slotColor }}
                  >
                    {slot}
                  </span>
                  <AnimatedMetric formatter={formatKrwCompact} value={value} />
                </div>
              </div>
            </div>
          );
        })}

        {reachedMoments.map((moment) => {
          const toneStyle = getMomentToneStyle(moment.tone);
          const momentRatio = lastPoint.index > 0 ? moment.index / lastPoint.index : 0;
          const momentX =
            plotMetrics.width > 0
              ? Math.min(
                  plotMetrics.width - CHART_MARGIN.right - 8,
                  Math.max(
                    Y_AXIS_WIDTH + CHART_MARGIN.left,
                    Y_AXIS_WIDTH + CHART_MARGIN.left + plotWidth * momentRatio,
                  ),
                )
              : Y_AXIS_WIDTH + CHART_MARGIN.left;

          return (
            <button
              aria-label={`${moment.title}: ${moment.valueLabel}`}
              className="absolute bottom-[42px] z-30 flex -translate-x-1/2 flex-col items-center gap-1"
              key={moment.id}
              onClick={() => onSelectMoment?.(moment)}
              style={{ left: momentX }}
              type="button"
            >
              <span
                className="h-3.5 w-3.5 rounded-full border-2 border-white"
                style={{
                  backgroundColor: toneStyle.color,
                  boxShadow: toneStyle.boxShadow,
                }}
              />
              <span
                className="hidden whitespace-nowrap rounded-full border px-2 py-1 text-[10px] font-semibold backdrop-blur-xl sm:block"
                style={toneStyle}
              >
                {moment.title}
              </span>
            </button>
          );
        })}

        {activeMoment ? (
          <div className="pointer-events-none absolute bottom-16 left-4 z-20 max-w-[220px] animate-[fade-in_180ms_ease-out]">
            <div
              className="rounded-[18px] border px-3 py-2.5 text-white backdrop-blur-xl"
              style={getMomentToneStyle(activeMoment.tone)}
            >
              <div className="text-[11px] font-semibold tracking-[-0.02em]">
                {activeMoment.title}
              </div>
              <div className="mt-1 text-xs font-medium text-white/72">
                {activeMoment.valueLabel}
              </div>
            </div>
          </div>
        ) : null}

        <ResponsiveContainer height="100%" width="100%">
          <LineChart data={normalizedData} margin={CHART_MARGIN}>
            <CartesianGrid stroke="rgba(148,163,184,0.2)" vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="index"
              domain={[0, lastPoint.index]}
              padding={{ left: 0, right: 0 }}
              tick={{ fill: "rgba(100,116,139,0.82)", fontSize: 11 }}
              tickFormatter={(value: number | string) => {
                const index = typeof value === "number" ? value : Number(value);
                const matched = fullData.find((point) => point.index === index);
                return matched ? formatYear(matched.date) : "";
              }}
              tickLine={false}
              ticks={xTicks}
              type="number"
            />
            <YAxis
              axisLine={false}
              domain={yDomain}
              scale="log"
              tick={{ fill: "rgba(100,116,139,0.76)", fontSize: 10 }}
              tickFormatter={(value: number) => formatNormalizedTick(value)}
              tickLine={false}
              ticks={yTicks}
              width={Y_AXIS_WIDTH}
            />
            <ReferenceLine
              stroke="rgba(148,163,184,0.32)"
              strokeDasharray="4 4"
              x={currentIndex}
            />

            {assets.map((asset, index) => (
              <Line
                key={`${asset.id}-glow`}
                dataKey={asset.id}
                dot={false}
                isAnimationActive={false}
                stroke={getComparisonSlotColor(index)}
                strokeLinecap="round"
                strokeOpacity={0.12}
                strokeWidth={8}
                type="monotone"
              />
            ))}

            {assets.map((asset, index) => (
              <Line
                key={asset.id}
                dataKey={asset.id}
                dot={renderCurrentDot(index, normalizedData.length)}
                isAnimationActive={false}
                stroke={getComparisonSlotColor(index)}
                strokeLinecap="round"
                strokeOpacity={1}
                strokeWidth={3}
                type="monotone"
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
