"use client";

import { useEffect, useMemo } from "react";
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
  CriticalMoment,
  CriticalMomentChartPoint,
  CriticalMomentReflectionResponse,
} from "@/features/critical-moments/types";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { formatAxisCurrency } from "@/lib/race-engine";

interface CriticalMomentExperienceViewProps {
  accent: string;
  assetDescription: string;
  assetLabel: string;
  fullSeries: CriticalMomentChartPoint[];
  isPreview: boolean;
  moment: CriticalMoment;
  onBack: () => void;
  onUnlockPremium: () => void;
  onSelectReflection: (response: CriticalMomentReflectionResponse) => void;
  reflectionResponse: CriticalMomentReflectionResponse | null;
}

const REFLECTION_OPTIONS: Array<{
  id: CriticalMomentReflectionResponse;
  label: string;
}> = [
  { id: "continue_holding", label: "버틸 수 있을 것 같다" },
  { id: "partial_exit", label: "일부 정리했을 것 같다" },
  { id: "sold_and_left", label: "팔고 떠났을 것 같다" },
  { id: "not_sure", label: "잘 모르겠다" },
];

function formatChartMonth(date: string) {
  const [year, month] = date.split("-");
  return `${year.slice(2)}.${month}`;
}

function buildWindowSeries(series: CriticalMomentChartPoint[], momentIndex: number) {
  const start = Math.max(0, momentIndex - 6);
  const end = Math.min(series.length, momentIndex + 13);
  return series.slice(start, end);
}

function buildYearTicks(series: CriticalMomentChartPoint[]) {
  const ticks: number[] = [];
  const seenYears = new Set<string>();

  for (const point of series) {
    const year = point.date.slice(0, 4);

    if (!seenYears.has(year) && Number(year) % 2 === 0) {
      seenYears.add(year);
      ticks.push(point.index);
    }
  }

  const lastIndex = series[series.length - 1]?.index;
  if (typeof lastIndex === "number" && !ticks.includes(lastIndex)) {
    ticks.push(lastIndex);
  }

  return ticks;
}

function buildWindowTicks(series: CriticalMomentChartPoint[]) {
  return series
    .filter((point, index) => index === 0 || index === series.length - 1 || point.date.endsWith("-01"))
    .map((point) => point.index);
}

function getFundamentalPillStyle(state: CriticalMoment["fundamentals"]["state"]) {
  if (state === "intact") {
    return {
      backgroundColor: "rgba(34,197,94,0.16)",
      borderColor: "rgba(34,197,94,0.28)",
      color: "#86efac",
    };
  }

  if (state === "shaken") {
    return {
      backgroundColor: "rgba(250,204,21,0.14)",
      borderColor: "rgba(250,204,21,0.26)",
      color: "#fde68a",
    };
  }

  return {
    backgroundColor: "rgba(248,113,113,0.14)",
    borderColor: "rgba(248,113,113,0.24)",
    color: "#fca5a5",
  };
}

export function CriticalMomentExperienceView({
  accent,
  assetDescription,
  assetLabel,
  fullSeries,
  isPreview,
  moment,
  onBack,
  onSelectReflection,
  onUnlockPremium,
  reflectionResponse,
}: CriticalMomentExperienceViewProps) {
  const windowSeries = useMemo(
    () => buildWindowSeries(fullSeries, moment.momentIndex),
    [fullSeries, moment.momentIndex],
  );
  const fullSeriesTicks = useMemo(() => buildYearTicks(fullSeries), [fullSeries]);
  const windowTicks = useMemo(() => buildWindowTicks(windowSeries), [windowSeries]);

  useEffect(() => {
    trackAnalyticsEvent("view_crisis_detail", {
      assetId: assetLabel,
      isPreview,
      momentDate: moment.date,
      momentType: moment.type,
    });

    return () => {
      trackAnalyticsEvent("complete_crisis_detail", {
        assetId: assetLabel,
        isPreview,
        momentDate: moment.date,
        momentType: moment.type,
      });
    };
  }, [assetLabel, isPreview, moment.date, moment.type]);

  return (
    <section className="flex flex-1 flex-col py-6 pb-24">
      <div className="flex items-center justify-between gap-3">
        <button
          className="btn-secondary min-h-11 rounded-full px-4 text-sm font-semibold transition"
          onClick={onBack}
          type="button"
        >
          버틸 근거로 돌아가기
        </button>
        <div className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-xs text-white/54">
          {isPreview ? "무료 미리 보기" : "버틸 근거"}
        </div>
      </div>

      <div className="surface-section mt-5 rounded-[30px] px-4 py-5">
        <div className="text-[11px] uppercase tracking-[0.22em] text-white/34">{moment.shortLabel}</div>
        <div className="mt-3 text-[1.75rem] font-semibold tracking-[-0.05em] text-white">
          {moment.dateLabel}의 {moment.shortLabel}
        </div>
        <div className="mt-3 text-sm leading-6 text-white/62">
          {assetLabel} · {assetDescription}
        </div>
        <div className="mt-4 text-sm leading-6 text-white/58">{moment.cardDescription}</div>
      </div>

      <div className="mt-5 rounded-[24px] border border-white/8 bg-white/[0.02] px-4 py-4">
        <div className="text-[11px] uppercase tracking-[0.22em] text-white/34">10년 전체 흐름 속 이 순간</div>
        <div className="surface-plot mt-4 h-[150px] overflow-hidden rounded-[22px]">
          <ResponsiveContainer height="100%" width="100%">
            <LineChart data={fullSeries} margin={{ top: 18, right: 18, left: 8, bottom: 18 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                axisLine={false}
                dataKey="index"
                tick={{ fill: "rgba(255,255,255,0.46)", fontSize: 10 }}
                tickFormatter={(value: number | string) => {
                  const numericValue = typeof value === "number" ? value : Number(value);
                  const matched = fullSeries.find((point) => point.index === numericValue);
                  return matched ? matched.date.slice(0, 4) : "";
                }}
                tickLine={false}
                ticks={fullSeriesTicks}
                type="number"
              />
              <YAxis
                axisLine={false}
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
                tickFormatter={(value: number) => formatAxisCurrency(value)}
                tickLine={false}
                width={62}
              />
              <ReferenceLine
                stroke={accent}
                strokeDasharray="4 4"
                strokeOpacity={0.8}
                x={moment.momentIndex}
              />
              <Line
                dataKey="price"
                dot={false}
                isAnimationActive={false}
                stroke="rgba(255,255,255,0.55)"
                strokeLinecap="round"
                strokeWidth={2}
                type="monotone"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-4 rounded-[24px] border border-white/8 bg-white/[0.02] px-4 py-4">
        <div className="text-[11px] uppercase tracking-[0.22em] text-white/34">고비가 가장 선명했던 구간</div>
        <div className="surface-plot mt-4 h-[250px] overflow-hidden rounded-[22px]">
          <ResponsiveContainer height="100%" width="100%">
            <LineChart data={windowSeries} margin={{ top: 18, right: 18, left: 8, bottom: 18 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                axisLine={false}
                dataKey="index"
                tick={{ fill: "rgba(255,255,255,0.46)", fontSize: 10 }}
                tickFormatter={(value: number | string) => {
                  const numericValue = typeof value === "number" ? value : Number(value);
                  const matched = windowSeries.find((point) => point.index === numericValue);
                  return matched ? formatChartMonth(matched.date) : "";
                }}
                tickLine={false}
                ticks={windowTicks}
                type="number"
              />
              <YAxis
                axisLine={false}
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
                tickFormatter={(value: number) => formatAxisCurrency(value)}
                tickLine={false}
                width={62}
              />
              <ReferenceLine
                stroke={accent}
                strokeDasharray="4 4"
                strokeOpacity={0.9}
                x={moment.momentIndex}
              />
              <Line
                dataKey="price"
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
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {moment.metricCards.map((metric) => (
            <div
              key={`${moment.id}-${metric.label}`}
              className="rounded-[18px] border border-white/8 bg-white/[0.03] px-3 py-3"
            >
              <div className="text-[11px] text-white/42">{metric.label}</div>
              <div className="mt-2 text-sm font-semibold tracking-[-0.02em] text-white">
                {metric.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-[24px] border border-white/8 bg-white/[0.02] px-4 py-4">
        <div className="text-[11px] uppercase tracking-[0.22em] text-white/34">당시 시장 분위기</div>
        <div className="mt-3 text-sm leading-6 text-white/60">{moment.atmosphereSummary}</div>
      </div>

      <div className="mt-4 rounded-[24px] border border-white/8 bg-white/[0.02] px-4 py-4">
        <div className="text-[11px] uppercase tracking-[0.22em] text-white/34">그때 쏟아진 악재</div>
        <div className="mt-3 grid gap-2">
          {moment.badNewsPoints.map((line) => (
            <div
              key={`${moment.id}-bad-news-${line}`}
              className="rounded-[18px] border border-white/8 bg-white/[0.03] px-3 py-3 text-sm text-white/60"
            >
              {line}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-[24px] border border-white/8 bg-white/[0.02] px-4 py-4">
        <div className="text-[11px] uppercase tracking-[0.22em] text-white/34">
          {moment.expertReactionTitle}
        </div>
        <div className="mt-3 grid gap-2">
          {moment.wallStreetReactionPoints.map((line) => (
            <div
              key={`${moment.id}-reaction-${line}`}
              className="rounded-[18px] border border-white/8 bg-white/[0.03] px-3 py-3 text-sm text-white/60"
            >
              {line}
            </div>
          ))}
        </div>
      </div>

      {isPreview ? (
        <div className="surface-card mt-5 rounded-[24px] px-4 py-5">
          <div className="text-[11px] uppercase tracking-[0.22em] text-white/34">프리미엄에서 이어집니다</div>
          <div className="mt-2 text-lg font-semibold tracking-[-0.04em] text-white">
            펀더멘탈, 그 뒤의 흐름, 투자자가 배워야 할 점을 순서대로 봅니다
          </div>
          <div className="mt-3 text-sm leading-6 text-white/58">
            결과를 다시 보는 것이 아니라, 미래의 공포 앞에서 무엇을 봐야 하는지 읽어내는 레이어가 이어집니다.
          </div>
          <div className="mt-5 grid gap-2">
            <button
              className="btn-accent min-h-14 rounded-full px-5 text-base font-semibold tracking-[-0.02em] transition"
              onClick={onUnlockPremium}
              type="button"
            >
              버틸 근거 전체 보기
            </button>
            <button
              className="btn-secondary min-h-12 rounded-full px-5 text-sm font-semibold tracking-[-0.02em] transition"
              onClick={onBack}
              type="button"
            >
              다른 고비 보기
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-4 rounded-[24px] border border-white/8 bg-white/[0.02] px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[11px] uppercase tracking-[0.22em] text-white/34">
                이 시점에 펀더멘탈은 유지되었나?
              </div>
              <div
                className="rounded-full border px-3 py-1 text-xs font-medium"
                style={getFundamentalPillStyle(moment.fundamentals.state)}
              >
                {moment.fundamentals.label}
              </div>
            </div>
            <div className="mt-3 text-sm leading-6 text-white/60">{moment.fundamentals.summary}</div>
          </div>

          <div className="mt-4 rounded-[24px] border border-white/8 bg-white/[0.02] px-4 py-4">
            <div className="text-[11px] uppercase tracking-[0.22em] text-white/34">그 뒤 어떻게 되었나</div>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {moment.afterMathStats.map((stat) => (
                <div
                  key={`${moment.id}-${stat.label}`}
                  className="rounded-[18px] border border-white/8 bg-white/[0.03] px-3 py-3"
                >
                  <div className="text-[11px] text-white/42">{stat.label}</div>
                  <div className="mt-2 text-sm font-semibold tracking-[-0.02em] text-white">
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-2 text-sm leading-6 text-white/60">
              {moment.afterMathLines.map((line) => (
                <div key={`${moment.id}-aftermath-${line}`}>{line}</div>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-[24px] border border-white/8 bg-white/[0.02] px-4 py-4">
            <div className="text-[11px] uppercase tracking-[0.22em] text-white/34">투자자가 배워야 할 점</div>
            <div className="mt-3 grid gap-2 text-sm leading-6 text-white/60">
              {moment.lessonLines.map((line) => (
                <div key={`${moment.id}-lesson-${line}`}>{line}</div>
              ))}
            </div>
            <div className="mt-4 text-sm font-semibold tracking-[-0.02em] text-white">
              {moment.reflectionQuestion}
            </div>
            <div className="mt-4 grid gap-2">
              {REFLECTION_OPTIONS.map((option) => {
                const isActive = reflectionResponse === option.id;

                return (
                  <button
                    key={`${moment.id}-${option.id}`}
                    className="rounded-[18px] border px-4 py-3 text-left text-sm transition"
                    onClick={() => {
                      onSelectReflection(option.id);
                      trackAnalyticsEvent("select_reflection_response", {
                        assetId: assetLabel,
                        momentDate: moment.date,
                        momentType: moment.type,
                        response: option.id,
                      });
                    }}
                    style={{
                      backgroundColor: isActive ? `${accent}16` : "rgba(255,255,255,0.03)",
                      borderColor: isActive ? `${accent}50` : "rgba(255,255,255,0.08)",
                      color: "#ffffff",
                    }}
                    type="button"
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 grid gap-2">
            <button
              className="btn-accent min-h-14 rounded-full px-5 text-base font-semibold tracking-[-0.02em] transition"
              onClick={onBack}
              type="button"
            >
              다른 고비 보기
            </button>
          </div>
        </>
      )}
    </section>
  );
}
