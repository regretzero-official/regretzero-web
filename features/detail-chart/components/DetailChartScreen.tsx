"use client";

import { useEffect, useMemo, useState } from "react";

import { DetailCandlestickChart } from "@/features/detail-chart/components/DetailCandlestickChart";
import { loadHistoricalOhlc } from "@/features/detail-chart/data/loadHistoricalOhlc";
import type {
  DetailChartContext,
  DetailChartSeriesByTimeframe,
  DetailChartTimeframe,
} from "@/features/detail-chart/types";
import {
  buildCrisisDetailInsight,
  type CrisisDetailTimelineItem,
} from "@/features/detail-chart/utils/buildCrisisDetailInsight";
import {
  buildDetailChartSeries,
  formatCrisisPeriodLabel,
} from "@/features/detail-chart/utils/buildDetailChartSeries";
import type { AssetOption } from "@/lib/home-content";

interface DetailChartScreenProps {
  asset: AssetOption;
  context: DetailChartContext;
  onBack: () => void;
}

const TIMEFRAME_OPTIONS: Array<{ id: DetailChartTimeframe; label: string }> = [
  { id: "daily", label: "일봉" },
  { id: "weekly", label: "주봉" },
  { id: "monthly", label: "월봉" },
];

function formatDateLabel(date: string) {
  return date.replace(/-/g, ".");
}

function getTimelineToneClass(tone: CrisisDetailTimelineItem["tone"]) {
  if (tone === "positive") {
    return "border-emerald-300/60 bg-emerald-50 text-emerald-700";
  }

  if (tone === "danger") {
    return "border-rose-300/60 bg-rose-50 text-rose-700";
  }

  return "border-blue-300/60 bg-blue-50 text-blue-700";
}

export function DetailChartScreen({ asset, context, onBack }: DetailChartScreenProps) {
  const [timeframe, setTimeframe] = useState<DetailChartTimeframe>("weekly");
  const [seriesByTimeframe, setSeriesByTimeframe] = useState<DetailChartSeriesByTimeframe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const assetLabel = asset.shortLabel ?? asset.label;
  const crisisInsight = useMemo(
    () => buildCrisisDetailInsight(context.crisis, assetLabel, context.raceEndDate),
    [assetLabel, context.crisis, context.raceEndDate],
  );

  useEffect(() => {
    let isCancelled = false;

    async function run() {
      setIsLoading(true);
      setError("");

      try {
        const response = await loadHistoricalOhlc(
          context.marketTicker,
          context.raceStartDate,
          context.raceEndDate,
        );

        if (isCancelled) {
          return;
        }

        setSeriesByTimeframe(buildDetailChartSeries(response.dailyOhlc));
      } catch (loadError) {
        if (isCancelled) {
          return;
        }

        setSeriesByTimeframe(null);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "상세 차트 데이터를 불러오지 못했습니다.",
        );
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void run();

    return () => {
      isCancelled = true;
    };
  }, [context.marketTicker, context.raceEndDate, context.raceStartDate]);

  const activeSeries = seriesByTimeframe?.[timeframe] ?? [];
  const timeframeAvailability = useMemo(
    () =>
      ({
        daily: (seriesByTimeframe?.daily.length ?? 0) > 0,
        monthly: (seriesByTimeframe?.monthly.length ?? 0) > 0,
        weekly: (seriesByTimeframe?.weekly.length ?? 0) > 0,
      }) satisfies Record<DetailChartTimeframe, boolean>,
    [seriesByTimeframe],
  );

  useEffect(() => {
    if (timeframeAvailability[timeframe]) {
      return;
    }

    const fallbackTimeframe = TIMEFRAME_OPTIONS.find((option) => timeframeAvailability[option.id]);
    if (fallbackTimeframe) {
      setTimeframe(fallbackTimeframe.id);
    }
  }, [timeframe, timeframeAvailability]);

  return (
    <section className="flex flex-1 flex-col py-6 pb-10">
      <div className="flex items-center justify-between gap-3">
        <button
          className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-sm text-white/72 transition hover:bg-white/[0.06]"
          onClick={onBack}
          type="button"
        >
          이전
        </button>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4].map((dot) => (
            <span
              key={dot}
              className={`h-1.5 rounded-full transition ${dot <= 4 ? "w-5 bg-white" : "w-1.5 bg-white/20"}`}
            />
          ))}
        </div>
      </div>

      <div className="mt-6">
        <div className="text-[11px] uppercase tracking-[0.22em] text-white/34">DETAIL CHART</div>
        <div className="mt-3 text-[1.55rem] font-semibold tracking-[-0.05em] text-white">
          {assetLabel}
        </div>
        <div className="mt-2 text-sm leading-6 text-white/58">{context.crisisLabel}</div>
        <div className="mt-1 text-sm leading-6 text-white/42">
          {formatDateLabel(context.raceStartDate)}부터 {formatDateLabel(context.raceEndDate)}까지의 실제 시세 기준
        </div>
      </div>

      <div className="surface-card mt-5 rounded-[26px] px-4 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="inline-flex rounded-full border border-[var(--rz-border-strong)] bg-[var(--rz-accent-soft)] px-3 py-1 text-[11px] font-semibold text-[var(--rz-accent)]">
              {crisisInsight.severityLabel}
            </div>
            <div className="mt-3 text-xl font-semibold tracking-[-0.05em] text-white">
              세 지점만 보면 됩니다
            </div>
          </div>
          <div className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-white/54">
            {formatCrisisPeriodLabel(context.crisis)}
          </div>
        </div>

        <p className="mt-4 text-base leading-7 tracking-[-0.02em] text-white/72">
          {crisisInsight.summary}
        </p>
        <p className="mt-2 text-sm leading-6 text-white/48">
          {crisisInsight.severityDescription}
        </p>

        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3">
            <div className="text-[11px] text-white/40">최대 낙폭</div>
            <div className="mt-1 text-lg font-semibold text-white">-{crisisInsight.drawdownLabel}</div>
          </div>
          <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3">
            <div className="text-[11px] text-white/40">바닥까지</div>
            <div className="mt-1 text-lg font-semibold text-white">{crisisInsight.declineDurationLabel}</div>
          </div>
          <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3">
            <div className="text-[11px] text-white/40">회복</div>
            <div className="mt-1 text-lg font-semibold text-white">{crisisInsight.recoveryLabel}</div>
          </div>
        </div>
      </div>

      <div className="surface-card mt-4 rounded-[24px] px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[11px] tracking-[0.12em] text-white/34">상세 차트</div>
            <div className="mt-1 text-sm leading-5 text-white/56">
              전고점, 바닥, 회복 지점을 차트 위에서 순서대로 봅니다.
            </div>
          </div>
          <div className="inline-flex rounded-full border border-white/8 bg-white/[0.03] p-1">
            {TIMEFRAME_OPTIONS.map((option) => {
              const isActive = timeframe === option.id;
              const isDisabled = !timeframeAvailability[option.id] && !isLoading && !error;
              return (
                <button
                  key={option.id}
                  className={`min-h-10 rounded-full px-4 text-sm font-medium transition ${
                    isActive
                      ? "bg-[#4A6CFF] text-white shadow-[0_10px_24px_rgba(74,108,255,0.24)]"
                      : "text-white/62 hover:bg-white/[0.05]"
                  } ${isDisabled ? "cursor-not-allowed text-white/28 hover:bg-transparent" : ""}`}
                  disabled={isDisabled}
                  onClick={() => setTimeframe(option.id)}
                  type="button"
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div className="surface-card rounded-[24px] px-4 py-10 text-center text-sm text-white/54">
            상세 차트를 준비하고 있습니다.
          </div>
        ) : error ? (
          <div className="surface-card rounded-[24px] px-4 py-6 text-sm leading-6 text-white/58">
            {error}
          </div>
        ) : (
          <DetailCandlestickChart
            crisis={context.crisis}
            data={activeSeries}
            disabledReason={
              !timeframeAvailability[timeframe]
                ? "이 시간대 차트 데이터는 아직 준비되지 않았습니다."
                : undefined
            }
            timeframe={timeframe}
          />
        )}
      </div>

      <div className="surface-card mt-5 rounded-[24px] px-4 py-4">
        <div>
          <div className="text-[11px] tracking-[0.12em] text-white/34">고비 타임라인</div>
          <div className="mt-2 text-base font-semibold tracking-[-0.03em] text-white">
            전고점에서 회복까지
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {crisisInsight.timeline.map((item, index) => (
            <div
              className="rounded-[20px] border border-white/8 bg-white/[0.025] px-4 py-4"
              key={item.id}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-[11px] font-semibold text-white/40">
                  {index + 1}. {item.label}
                </div>
                <div className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getTimelineToneClass(item.tone)}`}>
                  {item.valueLabel}
                </div>
              </div>
              <div className="mt-3 text-sm font-semibold tracking-[-0.03em] text-white">
                {item.dateLabel}
              </div>
              <div className="mt-2 text-xs leading-5 text-white/48">
                {item.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
