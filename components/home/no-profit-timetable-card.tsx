"use client";

import { useMemo, useState } from "react";

import {
  formatNoProfitDuration,
  type NoProfitMonth,
  type NoProfitMonthStatus,
  type NoProfitTimetable,
} from "@/features/no-profit-timetable/buildNoProfitTimetable";

interface NoProfitTimetableCardProps {
  formatKrw: (value: number) => string;
  onShare: (activeTimetable: NoProfitTimetable) => void;
  timetable?: NoProfitTimetable;
  timetables?: NoProfitTimetableOption[];
}

interface NoProfitTimetableOption {
  id: string;
  label: string;
  timetable: NoProfitTimetable;
}

const EMPTY_TIMETABLE: NoProfitTimetable = {
  assetLabel: "",
  belowHighMonths: 0,
  belowPrincipalMonths: 0,
  hardestStreaks: [],
  longestNoNewHighMonths: 0,
  longestRecoveryWaitMonths: 0,
  months: [],
  totalMonths: 0,
};

const STATUS_LABELS: Record<NoProfitMonthStatus, string> = {
  below_high: "고점 아래 대기",
  below_principal: "원금 아래",
  new_high: "새 고점",
  recovery_wait: "깊은 대기",
};

const STATUS_CALENDAR_CLASSES: Record<NoProfitMonthStatus, string> = {
  below_high: "border-amber-200 bg-amber-500/20 hover:bg-amber-500/30",
  below_principal: "border-rose-200 bg-rose-500/20 hover:bg-rose-500/30",
  new_high: "border-emerald-200 bg-emerald-500/20 hover:bg-emerald-500/30",
  recovery_wait: "border-orange-200 bg-orange-500/20 hover:bg-orange-500/30",
};

const STATUS_THEME: Record<
  NoProfitMonthStatus,
  {
    badge: string;
    body: string;
    card: string;
    label: string;
    stat: string;
    title: string;
  }
> = {
  below_high: {
    badge: "border-amber-200 bg-amber-50 text-amber-700",
    body: "text-slate-700",
    card: "border-amber-200 bg-white text-slate-950 shadow-[0_14px_36px_rgba(15,23,42,0.05)]",
    label: "text-amber-700",
    stat: "border-slate-100 bg-slate-50 text-slate-950",
    title: "text-slate-950",
  },
  below_principal: {
    badge: "border-rose-200 bg-rose-50 text-rose-700",
    body: "text-slate-700",
    card: "border-rose-200 bg-white text-slate-950 shadow-[0_14px_36px_rgba(15,23,42,0.05)]",
    label: "text-rose-700",
    stat: "border-slate-100 bg-slate-50 text-slate-950",
    title: "text-slate-950",
  },
  new_high: {
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    body: "text-slate-700",
    card: "border-emerald-200 bg-white text-slate-950 shadow-[0_14px_36px_rgba(15,23,42,0.05)]",
    label: "text-emerald-700",
    stat: "border-slate-100 bg-slate-50 text-slate-950",
    title: "text-slate-950",
  },
  recovery_wait: {
    badge: "border-orange-200 bg-orange-50 text-orange-700",
    body: "text-slate-700",
    card: "border-orange-200 bg-white text-slate-950 shadow-[0_14px_36px_rgba(15,23,42,0.05)]",
    label: "text-orange-700",
    stat: "border-slate-100 bg-slate-50 text-slate-950",
    title: "text-slate-950",
  },
};

const LEGEND_ITEMS: Array<{ className: string; label: string }> = [
  {
    className: "border border-emerald-200 bg-emerald-50 text-emerald-700 font-bold",
    label: "새 고점",
  },
  {
    className: "border border-amber-200 bg-amber-50 text-amber-700 font-bold",
    label: "고점 아래 대기",
  },
  {
    className: "border border-orange-200 bg-orange-50 text-orange-700 font-bold",
    label: "깊은 대기",
  },
  {
    className: "border border-rose-200 bg-rose-50 text-rose-700 font-bold",
    label: "원금 아래",
  },
];

const MONTH_AXIS_LABELS = [
  "1월",
  "2월",
  "3월",
  "4월",
  "5월",
  "6월",
  "7월",
  "8월",
  "9월",
  "10월",
  "11월",
  "12월",
];

function getWorstAdversityMonth(months: NoProfitMonth[]) {
  return months.reduce<NoProfitMonth | null>((hardest, month) => {
    if (!hardest) {
      return month;
    }

    return month.drawdownPct < hardest.drawdownPct ? month : hardest;
  }, null);
}

function getDefaultSelectedMonth(months: NoProfitMonth[]) {
  return getWorstAdversityMonth(months) ?? months.at(-1) ?? null;
}

function buildYearRows(months: NoProfitMonth[]) {
  const rows = new Map<string, NoProfitMonth[]>();

  months.forEach((month) => {
    const year = month.monthKey.slice(0, 4);
    rows.set(year, [...(rows.get(year) ?? []), month]);
  });

  return [...rows.entries()].map(([year, yearMonths]) => ({ months: yearMonths, year }));
}

function getMonthInsight(month: NoProfitMonth | null, timetable: NoProfitTimetable) {
  if (!month) {
    return {
      body: "아직 표시할 월 데이터가 충분하지 않습니다.",
      title: "기다림을 계산하는 중입니다",
    };
  }

  if (month.status === "new_high") {
    return {
      body: `${timetable.assetLabel}가 이전 고점을 다시 넘어선 달입니다. 오래 기다린 뒤 찾아온 보상 같은 시간입니다.`,
      title: "새 고점을 찍은 달입니다",
    };
  }

  if (month.status === "below_principal") {
    return {
      body: "평가금액이 원금 아래였던 달입니다. 최종 결과만 보면 보이지 않는 가장 불편한 시간입니다.",
      title: "원금 아래로 내려간 달입니다",
    };
  }

  if (month.status === "recovery_wait") {
    return {
      body: "깊게 밀린 뒤 이전 고점을 회복하지 못한 달입니다. 장기 투자에서 가장 지루하고 어려운 구간입니다.",
      title: "회복을 기다리던 달입니다",
    };
  }

  return {
    body: "손실은 아니어도 이전 고점을 넘지 못한 달입니다. 수익률보다 시간이 더 길게 느껴지는 구간입니다.",
    title: "고점 아래에서 기다린 달입니다",
  };
}

function formatMonth(monthKey: string) {
  return monthKey.replace("-", ".");
}

function formatDrawdown(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatBreakout(value: number) {
  return `+${Math.max(0, value).toFixed(1)}%`;
}

export function NoProfitTimetableCard({
  formatKrw,
  onShare,
  timetable,
  timetables,
}: NoProfitTimetableCardProps) {
  const timetableOptions = useMemo(() => {
    if (timetables?.length) {
      return timetables;
    }

    return timetable
      ? [
          {
            id: "default",
            label: timetable.assetLabel,
            timetable,
          },
        ]
      : [];
  }, [timetable, timetables]);

  const [activeMapAsset, setActiveMapAsset] = useState(() => timetableOptions[0]?.id ?? "");
  const [selectedMonthPick, setSelectedMonthPick] = useState<{
    assetId: string;
    monthKey: string;
  } | null>(null);

  const resolvedActiveMapAsset = timetableOptions.some((option) => option.id === activeMapAsset)
    ? activeMapAsset
    : (timetableOptions[0]?.id ?? "");
  const activeOption =
    timetableOptions.find((option) => option.id === resolvedActiveMapAsset) ?? timetableOptions[0];
  const activeTimetable = activeOption?.timetable ?? EMPTY_TIMETABLE;
  const waitingRatio =
    activeTimetable.totalMonths === 0
      ? 0
      : Math.round((activeTimetable.belowHighMonths / activeTimetable.totalMonths) * 100);
  const defaultSelectedMonth = useMemo(
    () => getDefaultSelectedMonth(activeTimetable.months),
    [activeTimetable.months],
  );
  const worstAdversityMonth = useMemo(
    () => getWorstAdversityMonth(activeTimetable.months),
    [activeTimetable.months],
  );
  const selectedMonthKey =
    selectedMonthPick?.assetId === activeOption?.id ? selectedMonthPick.monthKey : null;
  const selectedMonth =
    activeTimetable.months.find((month) => month.monthKey === selectedMonthKey) ??
    defaultSelectedMonth;
  const selectedMonthInsight = getMonthInsight(selectedMonth, activeTimetable);
  const selectedTheme = STATUS_THEME[selectedMonth?.status ?? "below_high"];
  const isSelectedNewHigh = selectedMonth?.status === "new_high";
  const selectedComparisonLabel = isSelectedNewHigh ? "이전 고점 돌파" : "전고점 대비";
  const selectedComparisonValue =
    selectedMonth && isSelectedNewHigh
      ? formatBreakout(selectedMonth.newHighBreakoutPct)
      : selectedMonth
        ? formatDrawdown(selectedMonth.drawdownPct)
        : "";
  const yearRows = useMemo(() => buildYearRows(activeTimetable.months), [activeTimetable.months]);

  if (!activeOption) {
    return null;
  }

  return (
    <section className="surface-card mt-5 rounded-[26px] px-4 py-4 sm:px-5 sm:py-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-[var(--rz-text-muted)]">
            WAITING MAP
          </div>
          <h2 className="mt-2 text-[1.12rem] font-semibold tracking-[-0.04em] text-[var(--rz-text-primary)]">
            인내의 세월 지도
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--rz-text-secondary)]">
            최종 금액만 보면 보이지 않는 기다림을 월별로 봅니다.
          </p>
        </div>
        <button
          className="shrink-0 rounded-full border border-[var(--rz-border)] bg-[var(--rz-surface-card-elevated)] px-3 py-1.5 text-[11px] font-semibold text-[var(--rz-text-secondary)] transition hover:text-[var(--rz-text-primary)]"
          onClick={() => onShare(activeTimetable)}
          type="button"
        >
          지도 공유
        </button>
      </div>

      {timetableOptions.length > 1 ? (
        <div className="mt-4 flex max-w-full gap-1 rounded-[18px] bg-slate-100 p-1 text-xs font-semibold text-slate-500">
          {timetableOptions.map((option, index) => {
            const isActive = option.id === activeOption.id;

            return (
              <button
                className={`min-h-9 flex-1 rounded-[14px] px-3 transition ${
                  isActive
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
                key={option.id}
                onClick={() => {
                  setActiveMapAsset(option.id);
                  setSelectedMonthPick(null);
                }}
                type="button"
              >
                {index === 0 ? "🟢" : "🔵"} {option.label} 기록 보기
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="mt-5 lg:grid lg:grid-cols-12 lg:items-start lg:gap-5">
        <div className="lg:sticky lg:top-24 lg:col-span-5">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-[18px] border border-[var(--rz-border)] bg-[var(--rz-surface-card-elevated)] px-3 py-3">
              <div className="text-[11px] text-[var(--rz-text-muted)]">고점 아래 있었던 시간</div>
              <div className="mt-2 text-lg font-semibold text-[var(--rz-text-primary)]">
                {formatNoProfitDuration(activeTimetable.belowHighMonths)}
              </div>
            </div>
            <div className="rounded-[18px] border border-[var(--rz-border)] bg-[var(--rz-surface-card-elevated)] px-3 py-3">
              <div className="text-[11px] text-[var(--rz-text-muted)]">원금 아래 있었던 시간</div>
              <div className="mt-2 text-lg font-semibold text-[var(--rz-text-primary)]">
                {formatNoProfitDuration(activeTimetable.belowPrincipalMonths)}
              </div>
            </div>
            <div className="rounded-[18px] border border-[var(--rz-border)] bg-[var(--rz-surface-card-elevated)] px-3 py-3">
              <div className="text-[11px] text-[var(--rz-text-muted)]">가장 긴 회복 대기</div>
              <div className="mt-2 text-lg font-semibold text-[var(--rz-text-primary)]">
                {formatNoProfitDuration(activeTimetable.longestRecoveryWaitMonths)}
              </div>
            </div>
            <div className="rounded-[18px] border border-[var(--rz-border)] bg-[var(--rz-surface-card-elevated)] px-3 py-3">
              <div className="text-[11px] text-[var(--rz-text-muted)]">새 고점 없는 최장 기간</div>
              <div className="mt-2 text-lg font-semibold text-[var(--rz-text-primary)]">
                {formatNoProfitDuration(activeTimetable.longestNoNewHighMonths)}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-[22px] border border-slate-200 bg-white px-3 py-3 text-xs font-semibold leading-5 text-slate-700 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
            격자 칸을 터치해보세요. 선택한 달의 평가금액과 고점 대비 하락률이 바로 아래에 표시됩니다.
          </div>

          <div className="mt-3 rounded-[24px] border border-[var(--rz-border)] bg-[var(--rz-surface-card-elevated)] px-3 py-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {LEGEND_ITEMS.map((item) => (
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1.5 text-[11px] ${item.className}`}
                  key={item.label}
                >
                  {item.label}
                </span>
              ))}
            </div>

            <div
              aria-label={`${activeTimetable.assetLabel} 인내의 세월 지도`}
              className="grid gap-1.5"
              role="img"
            >
              <div className="grid grid-cols-[42px_1fr] items-center gap-2">
                <div aria-hidden="true" />
                <div className="grid grid-cols-12 gap-[3px]">
                  {MONTH_AXIS_LABELS.map((label) => (
                    <div
                      className="text-center text-[9px] font-semibold leading-4 text-slate-500"
                      key={label}
                    >
                      {label}
                    </div>
                  ))}
                </div>
              </div>
              {yearRows.map((row) => (
                <div className="grid grid-cols-[42px_1fr] items-center gap-2" key={row.year}>
                  <div className="text-[10px] font-semibold text-[var(--rz-text-muted)]">
                    {row.year}
                  </div>
                  <div className="grid grid-cols-12 gap-[3px]">
                    {Array.from({ length: 12 }, (_, index) => {
                      const month = row.months.find(
                        (candidate) => Number(candidate.monthKey.slice(5, 7)) === index + 1,
                      );

                      if (!month) {
                        return (
                          <span
                            className="aspect-square rounded-[2px] border border-slate-200 bg-slate-100"
                            key={`${row.year}-${index}`}
                          />
                        );
                      }

                      const isSelected = selectedMonth?.monthKey === month.monthKey;
                      const isWorst = worstAdversityMonth?.monthKey === month.monthKey;

                      return (
                        <button
                          aria-label={`${formatMonth(month.monthKey)} ${STATUS_LABELS[month.status]}`}
                          className={`aspect-square rounded-[2px] border transition ${STATUS_CALENDAR_CLASSES[month.status]} ${
                            isSelected ? "ring-2 ring-slate-900/30" : ""
                          } ${
                            isWorst
                              ? "relative z-10 outline outline-2 outline-offset-1 outline-rose-500/80 ring-2 ring-rose-500/70 animate-[rz-worst-month-pulse_1.8s_ease-in-out_infinite]"
                              : ""
                          }`}
                          key={month.monthKey}
                          onClick={() =>
                            setSelectedMonthPick({
                              assetId: activeOption.id,
                              monthKey: month.monthKey,
                            })
                          }
                          title={`${formatMonth(month.monthKey)} · ${STATUS_LABELS[month.status]}`}
                          type="button"
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <article
            className={`mt-2 rounded-[22px] border px-4 py-4 shadow-sm transition-colors duration-200 ${selectedTheme.card}`}
            id="mobile-cell-summary"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className={`text-[11px] uppercase tracking-[0.2em] ${selectedTheme.label}`}>
                  SELECTED MONTH
                </div>
                <h3 className={`mt-2 text-lg font-semibold tracking-[-0.04em] ${selectedTheme.title}`}>
                  {selectedMonth ? formatMonth(selectedMonth.monthKey) : "선택 없음"}
                </h3>
              </div>
              {selectedMonth ? (
                <span className={`rounded-full border px-3 py-1 text-[11px] font-extrabold ${selectedTheme.badge}`}>
                  {STATUS_LABELS[selectedMonth.status]}
                </span>
              ) : null}
            </div>
            <div className={`mt-4 text-base font-semibold tracking-[-0.04em] ${selectedTheme.title}`}>
              {selectedMonthInsight.title}
            </div>
            <p className={`mt-2 text-sm leading-6 ${selectedTheme.body}`}>
              {selectedMonthInsight.body}
            </p>
            {selectedMonth ? (
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className={`rounded-[18px] border px-3 py-3 ${selectedTheme.stat}`}>
                  <div className="text-[11px] opacity-65">그 달의 평가금액</div>
                  <div className="mt-2 font-semibold">{formatKrw(selectedMonth.value)}</div>
                </div>
                <div className={`rounded-[18px] border px-3 py-3 ${selectedTheme.stat}`}>
                  <div className="text-[11px] opacity-65">{selectedComparisonLabel}</div>
                  <div
                    className={`mt-2 font-semibold ${
                      isSelectedNewHigh
                        ? "text-emerald-600 drop-shadow-[0_0_10px_rgba(16,185,129,0.35)]"
                        : ""
                    }`}
                  >
                    {selectedComparisonValue}
                  </div>
                </div>
              </div>
            ) : null}
          </article>
        </div>

        <div className="mt-5 space-y-4 lg:col-span-7 lg:mt-0">
          <article className="rounded-[24px] border border-[var(--rz-border)] bg-[var(--rz-surface-card-elevated)] px-4 py-4">
            <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--rz-text-muted)]">
              SUMMARY
            </div>
            <h3 className="mt-2 text-lg font-semibold tracking-[-0.04em] text-[var(--rz-text-primary)]">
              {waitingRatio}%의 시간은 고점 아래였습니다
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--rz-text-secondary)]">
              결과가 커도 대부분의 시간은 편하게 벌리지 않았습니다. 이 지도는 그 기다림을 한눈에 보여줍니다.
            </p>
          </article>

          {activeTimetable.hardestStreaks.length > 0 ? (
            <article className="rounded-[24px] border border-[var(--rz-border)] bg-[var(--rz-surface-card-elevated)] px-4 py-4">
              <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--rz-text-muted)]">
                HARDEST WAITING
              </div>
              <h3 className="mt-2 text-lg font-semibold tracking-[-0.04em] text-[var(--rz-text-primary)]">
                가장 힘들었던 구간
              </h3>
              <div className="mt-4 grid gap-3">
                {activeTimetable.hardestStreaks.map((streak) => (
                  <div
                    className="rounded-[20px] border border-[var(--rz-border)] bg-white px-4 py-4"
                    key={streak.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[11px] text-[var(--rz-text-muted)]">
                          {formatMonth(streak.startMonth)} - {formatMonth(streak.endMonth)}
                        </div>
                        <div className="mt-2 font-semibold tracking-[-0.03em] text-[var(--rz-text-primary)]">
                          {streak.title}
                        </div>
                      </div>
                      <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-semibold text-rose-600">
                        {formatDrawdown(streak.maxDrawdownPct)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[var(--rz-text-secondary)]">
                      {streak.body}
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-[16px] border border-[var(--rz-border)] bg-slate-50 px-3 py-3">
                        <div className="text-[11px] text-[var(--rz-text-muted)]">최저 평가금액</div>
                        <div className="mt-1 font-semibold text-[var(--rz-text-primary)]">
                          {formatKrw(streak.minValue)}
                        </div>
                      </div>
                      <div className="rounded-[16px] border border-[var(--rz-border)] bg-slate-50 px-3 py-3">
                        <div className="text-[11px] text-[var(--rz-text-muted)]">기다린 시간</div>
                        <div className="mt-1 font-semibold text-[var(--rz-text-primary)]">
                          {formatNoProfitDuration(streak.months)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ) : null}
        </div>
      </div>
    </section>
  );
}
