"use client";

import type {
  HistoricalMomentExperience,
  HistoricalMomentMode,
} from "@/features/historical-moment/types";
import { getHistoricalMomentViewData } from "@/features/historical-moment/utils/getHistoricalMomentViewData";
import { formatKrwCompact, formatPercent } from "@/lib/race-engine";

import { HistoricalMomentChart } from "./HistoricalMomentChart";

interface HistoricalMomentViewProps {
  accent: string;
  experience: HistoricalMomentExperience;
  mode: HistoricalMomentMode;
  onAdvanceMonth: () => void;
  onBack: () => void;
  onReset: () => void;
  onReveal: () => void;
  revealedMonthCount: number;
}

function formatYearMonth(date: string) {
  const [year, month] = date.split("-");
  return `${year}년 ${month}월`;
}

export function HistoricalMomentView({
  accent,
  experience,
  mode,
  onAdvanceMonth,
  onBack,
  onReset,
  onReveal,
  revealedMonthCount,
}: HistoricalMomentViewProps) {
  const view = getHistoricalMomentViewData(experience, mode, revealedMonthCount);

  return (
    <section className="flex flex-1 flex-col py-6 pb-28">
      <div>
        <button
          className="text-sm text-white/46 transition hover:text-white/72"
          onClick={onBack}
          type="button"
        >
          ← 결과로 돌아가기
        </button>
        <div className="mt-5 text-[11px] uppercase tracking-[0.22em] text-white/34">
          그때의 주주가 되어보기
        </div>
        <h2 className="mt-3 text-[1.9rem] font-semibold tracking-[-0.06em] text-white">
          {formatYearMonth(experience.momentDate)}로 돌아왔어요
        </h2>
        <div className="mt-3 text-sm font-medium text-white/72">
          {experience.assetLabel} · {formatKrwCompact(experience.initialAmount)} 기준
        </div>
        <p className="mt-3 text-sm leading-6 text-white/58">
          당시 투자자는 이 시점까지 공개된 흐름만 보고 있었어요.
        </p>
      </div>

      <div className="surface-card mt-6 rounded-[28px] px-4 py-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-white/34">당시 계좌 상황</div>
            <div className="mt-2 text-[1.8rem] font-semibold tracking-[-0.06em] text-white">
              {formatKrwCompact(view.currentSnapshot.value)}
            </div>
            <div className="mt-2 text-sm text-white/56">
              전고점 대비 {formatPercent(view.currentSnapshot.drawdownPct * 100)}
            </div>
            <div className="mt-1 text-sm text-white/48">
              {formatKrwCompact(experience.initialAmount)} → {formatKrwCompact(view.currentSnapshot.value)}
            </div>
          </div>
          <div
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={{ backgroundColor: `${accent}20`, color: accent }}
          >
            {view.progressLabel}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
            <div className="text-[11px] text-white/42">직전 고점 평가금액</div>
            <div className="mt-2 font-semibold text-white">
              {formatKrwCompact(view.currentSnapshot.peakValue)}
            </div>
          </div>
          <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
            <div className="text-[11px] text-white/42">줄어든 금액</div>
            <div className="mt-2 font-semibold text-white">
              {formatKrwCompact(view.currentSnapshot.lossAmount)}
            </div>
          </div>
        </div>

        <div className="mt-3 text-sm leading-6 text-white/56">
          {view.futureOutcome
            ? `이제 ${formatYearMonth(view.currentSnapshot.date)}까지의 이후 흐름도 함께 볼 수 있어요.`
            : `지금 보이는 시점은 ${formatYearMonth(view.currentSnapshot.date)}예요. 이후 흐름은 아직 모두 열리지 않았어요.`}
        </div>
      </div>

      <HistoricalMomentChart
        accent={accent}
        mode={mode}
        momentIndex={experience.truncatedSeries.length - 1}
        series={view.chartSeries}
      />

      <div className="surface-card mt-4 rounded-[22px] px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <span
            className="rounded-full px-3 py-1 text-[11px] font-semibold"
            style={{ backgroundColor: `${accent}18`, color: accent }}
          >
            {view.messageBadge}
          </span>
          <span className="text-xs text-white/46">{view.enduranceLabel}</span>
        </div>
        <div className="mt-3 text-sm leading-6 text-white/72">{view.helperText}</div>
        {view.messageStat ? (
          <div className="mt-2 text-xs text-white/46">{view.messageStat}</div>
        ) : null}
      </div>

      {view.futureOutcome ? (
        <div className="surface-card mt-5 rounded-[24px] px-4 py-4">
          <div className="text-[11px] uppercase tracking-[0.22em] text-white/34">이후에는 이렇게 됐어요</div>
          <div className="mt-3 text-[1.5rem] font-semibold tracking-[-0.05em] text-white">
            {formatKrwCompact(view.futureOutcome.finalValue)}
          </div>
          <div className="mt-2 text-sm text-white/58">{view.futureOutcome.summary}</div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
              <div className="text-[11px] text-white/42">최종 시점</div>
              <div className="mt-2 font-semibold text-white">{formatYearMonth(view.futureOutcome.finalDate)}</div>
            </div>
            <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-3 py-3">
              <div className="text-[11px] text-white/42">전고점 회복</div>
              <div className="mt-2 font-semibold text-white">
                {view.futureOutcome.recovered
                  ? `${view.futureOutcome.recoveryMonths ?? 0}개월`
                  : "미회복"}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-6 grid gap-2">
        {mode !== "revealed" && view.hasMoreMonths ? (
          <button
            className="btn-accent min-h-14 rounded-full px-5 text-base font-semibold tracking-[-0.02em] transition"
            onClick={onAdvanceMonth}
            type="button"
          >
            한 달 더 버텨보기
          </button>
        ) : null}
        {mode !== "revealed" && view.canRevealOutcome ? (
          <button
            className="btn-secondary min-h-14 rounded-full px-5 text-base font-semibold tracking-[-0.02em] transition"
            onClick={onReveal}
            type="button"
          >
            결국 어떻게 됐는지 보기
          </button>
        ) : null}
        <button
          className="btn-secondary min-h-14 rounded-full px-5 text-base font-semibold tracking-[-0.02em] transition"
          onClick={mode === "revealed" ? onReset : onBack}
          type="button"
        >
          {mode === "revealed" ? "다시 그때로 돌아가기" : "결과 페이지로 돌아가기"}
        </button>
      </div>
    </section>
  );
}
