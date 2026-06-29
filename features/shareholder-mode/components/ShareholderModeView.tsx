"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import { trackAnalyticsEvent } from "@/lib/analytics";
import { formatAxisCurrency, formatKrwCompact, formatPercent } from "@/lib/race-engine";
import type {
  ShareholderActionLog,
  ShareholderExperience,
  ShareholderModeStage,
} from "@/features/shareholder-mode/types";
import {
  buildShareholderExitSummary,
  buildShareholderProgressView,
  buildShareholderSessionKey,
  clearShareholderSession,
  readShareholderSession,
  saveShareholderHistory,
  writeShareholderSession,
} from "@/features/shareholder-mode/utils/buildShareholderExperience";

interface ShareholderModeViewProps {
  accent: string;
  assetDescription: string;
  experience: ShareholderExperience;
  onBackToResult: () => void;
  onBackToStartDate: () => void;
}

function formatYearMonth(date: string) {
  const [year, month] = date.split("-");
  return `${year}.${month}`;
}

function formatMonthSpan(months: number) {
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years > 0 && remainingMonths > 0) {
    return `${years}년 ${remainingMonths}개월`;
  }

  if (years > 0) {
    return `${years}년`;
  }

  return `${months}개월`;
}

function getLongestSidewaysMonths(points: ShareholderExperience["series"]) {
  let longest = 0;
  let current = 0;

  for (let index = 1; index < points.length; index += 1) {
    const nextPoint = points[index]!;
    const previousPoint = points[index - 1]!;
    const changePct =
      previousPoint.value > 0 ? (nextPoint.value - previousPoint.value) / previousPoint.value : 0;

    if (Math.abs(changePct) <= 0.03 && nextPoint.drawdownPct <= -0.08) {
      current += 1;
      longest = Math.max(longest, current);
      continue;
    }

    current = 0;
  }

  return longest;
}

function buildYearTicks(points: ShareholderExperience["series"]) {
  const ticks: number[] = [];
  const seenYears = new Set<string>();

  for (const point of points) {
    const year = point.date.slice(0, 4);

    if (!seenYears.has(year) && Number(year) % 2 === 0) {
      seenYears.add(year);
      ticks.push(point.index);
    }
  }

  const lastIndex = points[points.length - 1]?.index;
  if (typeof lastIndex === "number" && !ticks.includes(lastIndex)) {
    ticks.push(lastIndex);
  }

  return ticks;
}

function ShareholderModeChart({
  accent,
  currentIndex,
  data,
}: {
  accent: string;
  currentIndex: number;
  data: ShareholderExperience["series"];
}) {
  const ticks = useMemo(() => buildYearTicks(data), [data]);

  return (
    <div className="surface-plot relative h-[280px] overflow-hidden rounded-[26px]">
      <ResponsiveContainer height="100%" width="100%">
        <LineChart data={data} margin={{ bottom: 28, left: 8, right: 18, top: 18 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            axisLine={false}
            dataKey="index"
            domain={[0, currentIndex]}
            tick={{ fill: "rgba(255,255,255,0.52)", fontSize: 11 }}
            tickFormatter={(value: number | string) => {
              const numericValue = typeof value === "number" ? value : Number(value);
              const matched = data.find((point) => point.index === numericValue);
              return matched ? matched.date.slice(0, 4) : "";
            }}
            tickLine={false}
            ticks={ticks}
            type="number"
          />
          <YAxis
            axisLine={false}
            tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }}
            tickFormatter={(value: number) => formatAxisCurrency(value)}
            tickLine={false}
            width={64}
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
      <div className="absolute right-4 top-4 rounded-full border border-white/8 bg-[#08101C]/72 px-3 py-1 text-[11px] text-white/54">
        아직 공개된 구간만 보여요
      </div>
    </div>
  );
}

async function shareSummary(summary: string) {
  if (typeof window === "undefined") {
    return;
  }

  const payload = {
    text: summary,
    title: "Regretzero",
    url: window.location.origin,
  };

  if (navigator.share) {
    await navigator.share(payload);
    return;
  }

  await navigator.clipboard.writeText(`${summary}\n${window.location.origin}`);
}

export function ShareholderModeView({
  accent,
  assetDescription,
  experience,
  onBackToResult,
  onBackToStartDate,
}: ShareholderModeViewProps) {
  const sessionKey = useMemo(
    () =>
      buildShareholderSessionKey({
        amount: experience.initialAmount,
        assetId: experience.assetId,
        startDate: experience.startDate,
      }),
    [experience.assetId, experience.initialAmount, experience.startDate],
  );
  const initialSession = useMemo(() => readShareholderSession(sessionKey), [sessionKey]);
  const [stage, setStage] = useState<ShareholderModeStage>(() => initialSession?.stage ?? "entry");
  const [revealedIndex, setRevealedIndex] = useState(() => initialSession?.revealedIndex ?? 0);
  const [decisionIndex, setDecisionIndex] = useState<number | null>(
    () => initialSession?.decisionIndex ?? null,
  );
  const [summaryIndex, setSummaryIndex] = useState<number | null>(
    () => initialSession?.summaryIndex ?? null,
  );
  const [soldIndex, setSoldIndex] = useState<number | null>(() => initialSession?.soldIndex ?? null);
  const [actionLog, setActionLog] = useState<ShareholderActionLog[]>(
    () => initialSession?.actionLog ?? [],
  );
  const [seenSummaryIndices, setSeenSummaryIndices] = useState<number[]>(
    () => initialSession?.seenSummaryIndices ?? [],
  );
  const [saveMessage, setSaveMessage] = useState("");

  const currentIndex = soldIndex ?? revealedIndex;
  const progressView = useMemo(
    () => buildShareholderProgressView(experience, currentIndex),
    [currentIndex, experience],
  );
  const decisionEvent =
    decisionIndex === null
      ? null
      : experience.decisionEvents.find((event) => event.index === decisionIndex) ?? null;
  const exitIndex = soldIndex ?? experience.series.length - 1;
  const exitPoint = experience.series[exitIndex]!;
  const holdToEndPoint = experience.series[experience.series.length - 1]!;
  const totalYears = Math.max(0.1, exitIndex / 12);
  const exitCagrPct =
    (Math.pow(exitPoint.value / experience.initialAmount, 1 / totalYears) - 1) * 100;
  const holdToEndGap = holdToEndPoint.value - exitPoint.value;
  const totalNewLowCount = experience.series[experience.series.length - 1]?.newLowCount ?? 0;
  const longestUnrecoveredMonths = Math.max(
    ...experience.series.map((point) => point.unrecoveredMonths),
  );
  const longestSidewaysMonths = getLongestSidewaysMonths(experience.series);
  const savedSummary = buildShareholderExitSummary({
    assetLabel: experience.assetLabel,
    choiceLabel: soldIndex === null ? "끝까지 보유" : "전량 매도",
    finalValue: exitPoint.value,
    pointDate: exitPoint.date,
    totalReturnPct: exitPoint.returnPct,
  });

  useEffect(() => {
    writeShareholderSession({
      actionLog,
      decisionIndex,
      finishedAt: stage === "final" ? new Date().toISOString() : null,
      key: sessionKey,
      revealedIndex,
      seenSummaryIndices,
      soldIndex,
      stage,
      summaryIndex,
    });
  }, [
    actionLog,
    decisionIndex,
    revealedIndex,
    seenSummaryIndices,
    sessionKey,
    soldIndex,
    stage,
    summaryIndex,
  ]);

  useEffect(() => {
    if (stage !== "final") {
      return;
    }

    trackAnalyticsEvent("finish_shareholder_mode", {
      assetId: experience.assetId,
      finalValue: Math.round(exitPoint.value),
      soldEarly: soldIndex !== null,
      startDate: experience.startDate,
    });
  }, [experience.assetId, experience.startDate, exitPoint.value, soldIndex, stage]);

  function goToNextStepAfterAdvance(nextIndex: number) {
    if (nextIndex >= experience.series.length - 1) {
      setStage("final");
      return;
    }

    const nextDecisionEvent = experience.decisionEvents.find((event) => event.index === nextIndex);
    if (nextDecisionEvent) {
      setDecisionIndex(nextIndex);
      setStage("decision");
      trackAnalyticsEvent("decision_event_shown", {
        assetId: experience.assetId,
        eventType: nextDecisionEvent.type,
        monthIndex: nextIndex,
      });
      return;
    }

    if (experience.summaryIndices.includes(nextIndex) && !seenSummaryIndices.includes(nextIndex)) {
      setSummaryIndex(nextIndex);
      setStage("summary");
      return;
    }

    setStage("progress");
  }

  function handleAdvanceMonth() {
    const nextIndex = Math.min(experience.series.length - 1, currentIndex + 1);
    setRevealedIndex(nextIndex);
    trackAnalyticsEvent("progress_shareholder_month", {
      assetId: experience.assetId,
      monthIndex: nextIndex,
      returnPct: Number(experience.series[nextIndex]!.returnPct.toFixed(2)),
    });
    goToNextStepAfterAdvance(nextIndex);
  }

  function handleDecision(choice: "hold" | "sell_all") {
    if (decisionIndex === null || !decisionEvent) {
      return;
    }

    const point = experience.series[decisionIndex]!;
    const nextAction: ShareholderActionLog = {
      choice,
      date: point.date,
      index: decisionIndex,
      note: decisionEvent.title,
      returnPct: point.returnPct,
      value: point.value,
    };

    setActionLog((previous) => [...previous, nextAction]);
    trackAnalyticsEvent("decision_event_choice", {
      assetId: experience.assetId,
      choice,
      eventType: decisionEvent.type,
      monthIndex: decisionIndex,
    });
    setDecisionIndex(null);

    if (choice === "sell_all") {
      setSoldIndex(decisionIndex);
      setStage("final");
      return;
    }

    if (experience.summaryIndices.includes(decisionIndex) && !seenSummaryIndices.includes(decisionIndex)) {
      setSummaryIndex(decisionIndex);
      setStage("summary");
      return;
    }

    setStage("progress");
  }

  function handleContinueSummary() {
    if (summaryIndex !== null && !seenSummaryIndices.includes(summaryIndex)) {
      setSeenSummaryIndices((previous) => [...previous, summaryIndex]);
    }

    setSummaryIndex(null);
    setStage("progress");
  }

  function handleRestartJourney() {
    clearShareholderSession(sessionKey);
    setStage("entry");
    setRevealedIndex(0);
    setDecisionIndex(null);
    setSummaryIndex(null);
    setSoldIndex(null);
    setActionLog([]);
    setSeenSummaryIndices([]);
    setSaveMessage("");
  }

  async function handleShare() {
    await shareSummary(savedSummary);
  }

  function handleSaveHistory() {
    saveShareholderHistory({
      assetLabel: experience.assetLabel,
      finalValue: exitPoint.value,
      startDate: experience.startDate,
      summary: savedSummary,
    });
    setSaveMessage("이 기기에 체험 결과를 저장했어요.");
  }

  if (stage === "entry") {
    return (
      <section className="flex flex-1 flex-col py-6 pb-28">
        <button
          className="text-sm text-white/46 transition hover:text-white/72"
          onClick={onBackToResult}
          type="button"
        >
          결과로 돌아가기
        </button>
        <div className="mt-5 text-[11px] uppercase tracking-[0.22em] text-white/34">
          그때의 주주 모드
        </div>
        <div className="mt-3 text-[2rem] font-semibold tracking-[-0.06em] text-white">
          {formatYearMonth(experience.startDate)}로 들어갑니다
        </div>
        <div className="mt-3 text-sm leading-6 text-white/58">
          이제부터 당신은 결과를 아는 관객이 아니라, 그 시간을 지나가야 하는 투자자예요.
        </div>

        <div className="surface-card mt-6 rounded-[28px] px-4 py-5">
          <div className="grid gap-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-white/46">자산</span>
              <span className="font-semibold text-white">{experience.assetLabel}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-white/46">진입 금액</span>
              <span className="font-semibold text-white">{formatKrwCompact(experience.initialAmount)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-white/46">진입 가격</span>
              <span className="font-semibold text-white">{formatKrwCompact(experience.purchasePrice)}</span>
            </div>
            <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-3 py-3 text-sm leading-6 text-white/56">
              {assetDescription}
              <br />
              미래 전체 차트는 마지막까지 공개되지 않아요.
            </div>
          </div>
        </div>

        <button
          className="btn-accent mt-6 min-h-14 rounded-full px-5 text-base font-semibold tracking-[-0.02em] transition"
          onClick={() => {
            trackAnalyticsEvent("start_shareholder_mode", {
              assetId: experience.assetId,
              startDate: experience.startDate,
            });
            setStage("rules");
          }}
          type="button"
        >
          그때로 들어가기
        </button>
      </section>
    );
  }

  if (stage === "rules") {
    return (
      <section className="flex flex-1 flex-col py-6 pb-28">
        <div className="text-[11px] uppercase tracking-[0.22em] text-white/34">짧은 규칙 안내</div>
        <div className="mt-3 text-[1.9rem] font-semibold tracking-[-0.06em] text-white">
          결과가 아니라 시간을 통과해요
        </div>
        <div className="surface-card mt-6 rounded-[28px] px-4 py-5">
          <div className="grid gap-3 text-sm leading-6 text-white/62">
            <div>미래 전체 수익률은 마지막까지 공개되지 않아요.</div>
            <div>중요한 순간마다 계속 보유할지 선택할 수 있어요.</div>
            <div>장기투자의 어려움은 숫자보다 시간에서 와요.</div>
          </div>
        </div>
        <button
          className="btn-accent mt-6 min-h-14 rounded-full px-5 text-base font-semibold tracking-[-0.02em] transition"
          onClick={() => setStage("progress")}
          type="button"
        >
          시작하기
        </button>
      </section>
    );
  }

  if (stage === "decision" && decisionEvent) {
    const point = experience.series[decisionEvent.index]!;

    return (
      <section className="flex flex-1 flex-col py-6 pb-28">
        <div className="text-[11px] uppercase tracking-[0.22em] text-white/34">중요한 순간</div>
        <div className="mt-3 text-[1.85rem] font-semibold tracking-[-0.06em] text-white">
          {decisionEvent.title}
        </div>
        <div className="mt-3 text-sm leading-6 text-white/58">{decisionEvent.summary}</div>

        <div className="surface-card mt-6 rounded-[28px] px-4 py-5">
          <div className="text-sm text-white/46">{decisionEvent.statLine}</div>
          <div className="mt-3 text-sm leading-6 text-white/70">{decisionEvent.insight}</div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
              <div className="text-[11px] text-white/42">현재 평가금액</div>
              <div className="mt-2 font-semibold text-white">{formatKrwCompact(point.value)}</div>
            </div>
            <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
              <div className="text-[11px] text-white/42">전고점 대비</div>
              <div className="mt-2 font-semibold text-white">{formatPercent(point.drawdownPct * 100)}</div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-2">
          <button
            className="btn-accent min-h-14 rounded-full px-5 text-base font-semibold tracking-[-0.02em] transition"
            onClick={() => handleDecision("hold")}
            type="button"
          >
            계속 보유
          </button>
          <button
            className="btn-secondary min-h-14 rounded-full px-5 text-base font-semibold tracking-[-0.02em] transition"
            onClick={() => handleDecision("sell_all")}
            type="button"
          >
            전량 매도
          </button>
        </div>
      </section>
    );
  }

  if (stage === "summary") {
    return (
      <section className="flex flex-1 flex-col py-6 pb-28">
        <div className="text-[11px] uppercase tracking-[0.22em] text-white/34">버티기 요약</div>
        <div className="mt-3 text-[1.85rem] font-semibold tracking-[-0.06em] text-white">
          {progressView.summaryLine}
        </div>
        <div className="surface-card mt-6 rounded-[28px] px-4 py-5">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
              <div className="text-[11px] text-white/42">지금까지 최고 수익률</div>
              <div className="mt-2 font-semibold text-white">{formatPercent(progressView.bestReturnPct)}</div>
            </div>
            <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
              <div className="text-[11px] text-white/42">지금까지 최저 수익률</div>
              <div className="mt-2 font-semibold text-white">{formatPercent(progressView.worstReturnPct)}</div>
            </div>
            <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
              <div className="text-[11px] text-white/42">신저점 갱신</div>
              <div className="mt-2 font-semibold text-white">{progressView.currentPoint.newLowCount}회</div>
            </div>
            <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
              <div className="text-[11px] text-white/42">회복 없는 기간</div>
              <div className="mt-2 font-semibold text-white">
                {formatMonthSpan(progressView.currentPoint.unrecoveredMonths)}
              </div>
            </div>
          </div>
        </div>
        <button
          className="btn-accent mt-6 min-h-14 rounded-full px-5 text-base font-semibold tracking-[-0.02em] transition"
          onClick={handleContinueSummary}
          type="button"
        >
          계속 버티기
        </button>
      </section>
    );
  }

  if (stage === "final") {
    return (
      <section className="flex flex-1 flex-col py-6 pb-28">
        <div className="text-[11px] uppercase tracking-[0.22em] text-white/34">최종 리포트</div>
        <div className="mt-3 text-[1.95rem] font-semibold tracking-[-0.06em] text-white">
          결과보다 시간이 더 어려웠어요
        </div>

        <div className="surface-card mt-6 rounded-[28px] px-4 py-5">
          <div className="text-sm text-white/52">
            {soldIndex === null
              ? "끝까지 보유한 결과예요."
              : `${formatYearMonth(exitPoint.date)}에 전량 매도한 결과예요.`}
          </div>
          <div className="mt-3 text-[2rem] font-semibold tracking-[-0.06em] text-white">
            {formatKrwCompact(exitPoint.value)}
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-sm text-white/58">
            <span>총 수익률 {formatPercent(exitPoint.returnPct)}</span>
            <span>CAGR {formatPercent(exitCagrPct)}</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
              <div className="text-[11px] text-white/42">최대 낙폭</div>
              <div className="mt-2 font-semibold text-white">
                {formatPercent(experience.report.maxDrawdown.maxDrawdownPct * 100)}
              </div>
            </div>
            <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
              <div className="text-[11px] text-white/42">회복까지 걸린 시간</div>
              <div className="mt-2 font-semibold text-white">
                {experience.report.recovery.recovered
                  ? `${experience.report.recovery.recoveryMonths ?? 0}개월`
                  : "끝까지 회복하지 못함"}
              </div>
            </div>
            <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
              <div className="text-[11px] text-white/42">가장 힘들었던 구간</div>
              <div className="mt-2 font-semibold text-white">{experience.hardestPeriodLabel}</div>
            </div>
            <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
              <div className="text-[11px] text-white/42">버티기 압박 점수</div>
              <div className="mt-2 font-semibold text-white">{progressView.pressureScore.toFixed(1)} / 10</div>
            </div>
            <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
              <div className="text-[11px] text-white/42">신저점 갱신 횟수</div>
              <div className="mt-2 font-semibold text-white">{totalNewLowCount}회</div>
            </div>
            <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
              <div className="text-[11px] text-white/42">가장 길었던 버티기</div>
              <div className="mt-2 font-semibold text-white">
                {formatMonthSpan(Math.max(longestUnrecoveredMonths, longestSidewaysMonths))}
              </div>
            </div>
          </div>
        </div>

        <div className="surface-card mt-4 rounded-[24px] px-4 py-4 text-sm leading-6 text-white/60">
          <div>가장 흔들리기 쉬운 순간은 {experience.report.maxDrawdown.troughDate.replace(/-/g, ".")} 전후였어요.</div>
          <div className="mt-2">
            가장 힘들었던 이유는 {experience.report.maxDrawdown.maxDrawdownPct <= -0.2 ? "급락" : "긴 횡보"}보다{" "}
            {experience.report.recovery.recoveryMonths
              ? `${experience.report.recovery.recoveryMonths}개월의 회복 대기`
              : "끝이 보이지 않는 회복 지연"}이었어요.
          </div>
          <div className="mt-2">
            결과 차트는 쉬워 보이지만, 실제로 그 시간을 통과하는 것은 완전히 다른 문제였어요.
          </div>
        </div>

        {soldIndex !== null ? (
          <div className="surface-card mt-4 rounded-[24px] px-4 py-4 text-sm leading-6 text-white/60">
            <div>당신이 매도한 결과는 {formatKrwCompact(exitPoint.value)}였어요.</div>
            <div className="mt-2">끝까지 보유했다면 {formatKrwCompact(holdToEndPoint.value)}가 됐어요.</div>
            <div className="mt-2">차이는 {formatKrwCompact(Math.abs(holdToEndGap))}예요.</div>
          </div>
        ) : null}

        {actionLog.length > 0 ? (
          <div className="surface-card mt-4 rounded-[24px] px-4 py-4">
            <div className="text-[11px] uppercase tracking-[0.22em] text-white/34">선택 기록</div>
            <div className="mt-3 grid gap-2 text-sm text-white/58">
              {actionLog.map((action) => (
                <div
                  key={`${action.index}-${action.choice}`}
                  className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3"
                >
                  {formatYearMonth(action.date)} · {action.choice === "hold" ? "계속 보유" : "전량 매도"} · {formatPercent(action.returnPct)}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {saveMessage ? (
          <div className="mt-4 rounded-[18px] border border-emerald-400/18 bg-emerald-400/8 px-4 py-3 text-sm text-emerald-200">
            {saveMessage}
          </div>
        ) : null}

        <div className="mt-6 grid gap-2">
          <button
            className="btn-accent min-h-14 rounded-full px-5 text-base font-semibold tracking-[-0.02em] transition"
            onClick={onBackToStartDate}
            type="button"
          >
            다른 시점으로 다시 체험하기
          </button>
          <button
            className="btn-secondary min-h-12 rounded-full px-5 text-sm font-semibold tracking-[-0.02em] transition"
            onClick={onBackToResult}
            type="button"
          >
            다른 자산으로 비교하기
          </button>
          <button
            className="btn-secondary min-h-12 rounded-full px-5 text-sm font-semibold tracking-[-0.02em] transition"
            onClick={handleSaveHistory}
            type="button"
          >
            결과 저장하기
          </button>
          <button
            className="btn-secondary min-h-12 rounded-full px-5 text-sm font-semibold tracking-[-0.02em] transition"
            onClick={() => void handleShare()}
            type="button"
          >
            공유하기
          </button>
          <button
            className="rounded-full border border-white/8 bg-white/[0.03] px-5 py-3 text-sm text-white/64 transition hover:bg-white/[0.05]"
            onClick={handleRestartJourney}
            type="button"
          >
            같은 설정으로 처음부터 다시
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-1 flex-col py-6 pb-28">
      <button
        className="text-sm text-white/46 transition hover:text-white/72"
        onClick={onBackToResult}
        type="button"
      >
        결과로 돌아가기
      </button>

      <div className="mt-5 flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-white/34">그때의 주주 모드</div>
          <div className="mt-3 text-[1.85rem] font-semibold tracking-[-0.06em] text-white">
            {experience.assetLabel}
          </div>
          <div className="mt-2 text-sm text-white/56">
            {formatYearMonth(progressView.currentPoint.date)} · 진입 후 {formatMonthSpan(progressView.currentPoint.monthsSinceEntry)}
          </div>
        </div>
        <div
          className="rounded-full px-3 py-1 text-xs font-semibold"
          style={{ backgroundColor: `${accent}20`, color: accent }}
        >
          압박 {progressView.pressureScore.toFixed(1)}
        </div>
      </div>

      <div className="mt-5">
        <ShareholderModeChart
          accent={accent}
          currentIndex={progressView.currentPoint.index}
          data={progressView.revealedSeries}
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div className="rounded-[20px] border border-white/8 bg-white/[0.02] px-3 py-3">
          <div className="text-[11px] text-white/42">현재 수익률</div>
          <div className="mt-2 font-semibold text-white">{formatPercent(progressView.currentPoint.returnPct)}</div>
        </div>
        <div className="rounded-[20px] border border-white/8 bg-white/[0.02] px-3 py-3">
          <div className="text-[11px] text-white/42">전고점 대비</div>
          <div className="mt-2 font-semibold text-white">{formatPercent(progressView.currentPoint.drawdownPct * 100)}</div>
        </div>
        <div className="rounded-[20px] border border-white/8 bg-white/[0.02] px-3 py-3">
          <div className="text-[11px] text-white/42">회복까지 필요한 상승률</div>
          <div className="mt-2 font-semibold text-white">
            {formatPercent(progressView.currentPoint.recoveryGainNeededPct)}
          </div>
        </div>
      </div>

      <div className="surface-card mt-4 rounded-[24px] px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-[11px] uppercase tracking-[0.22em] text-white/34">
            {progressView.messageEyebrow}
          </div>
          <div className="text-xs text-white/46">{progressView.messageStat}</div>
        </div>
        <div className="mt-3 text-base font-semibold tracking-[-0.03em] text-white">
          {progressView.summaryLine}
        </div>
        <div className="mt-3 text-sm leading-6 text-white/60">{progressView.message}</div>
      </div>

      <div className="surface-card mt-4 rounded-[22px] px-4 py-4 text-sm leading-6 text-white/54">
        {assetDescription}
      </div>

      <div className="mt-6 grid gap-2">
        <button
          className="btn-accent min-h-14 rounded-full px-5 text-base font-semibold tracking-[-0.02em] transition"
          onClick={handleAdvanceMonth}
          type="button"
        >
          한 달 버티기
        </button>
        <button
          className="btn-secondary min-h-12 rounded-full px-5 text-sm font-semibold tracking-[-0.02em] transition"
          onClick={onBackToResult}
          type="button"
        >
          결과 페이지로 돌아가기
        </button>
      </div>
    </section>
  );
}
