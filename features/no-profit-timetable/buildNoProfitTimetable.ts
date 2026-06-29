import type { ValuePoint } from "@/features/pain-of-holding/types";

export type NoProfitMonthStatus =
  | "below_high"
  | "below_principal"
  | "new_high"
  | "recovery_wait";

export interface NoProfitMonth {
  date: string;
  drawdownPct: number;
  monthKey: string;
  newHighBreakoutPct: number;
  previousPeakValue: number;
  runningPeakValue: number;
  status: NoProfitMonthStatus;
  value: number;
}

export interface NoProfitStreak {
  body: string;
  endDate: string;
  endMonth: string;
  id: string;
  maxDrawdownPct: number;
  minValue: number;
  months: number;
  startDate: string;
  startMonth: string;
  status: Exclude<NoProfitMonthStatus, "new_high">;
  title: string;
}

export interface NoProfitTimetable {
  assetLabel: string;
  belowHighMonths: number;
  belowPrincipalMonths: number;
  hardestStreaks: NoProfitStreak[];
  longestNoNewHighMonths: number;
  longestRecoveryWaitMonths: number;
  months: NoProfitMonth[];
  totalMonths: number;
}

interface BuildNoProfitTimetableInput {
  assetLabel: string;
  initialAmount: number;
  valueSeries: ValuePoint[];
}

function getMonthKey(date: string) {
  return date.slice(0, 7);
}

function formatMonth(monthKey: string) {
  return monthKey.replace("-", ".");
}

export function formatNoProfitDuration(months: number) {
  if (months <= 0) {
    return "없음";
  }

  const years = Math.floor(months / 12);
  const restMonths = months % 12;

  if (years === 0) {
    return `${months}개월`;
  }

  if (restMonths === 0) {
    return `${years}년`;
  }

  return `${years}년 ${restMonths}개월`;
}

function getStatus(
  value: number,
  initialAmount: number,
  drawdownPct: number,
  noNewHighStreak: number,
): NoProfitMonthStatus {
  if (value < initialAmount) {
    return "below_principal";
  }

  if (drawdownPct <= -30 || noNewHighStreak >= 6) {
    return "recovery_wait";
  }

  return "below_high";
}

function buildStreakTitle(
  status: Exclude<NoProfitMonthStatus, "new_high">,
  months: number,
) {
  const durationLabel = formatNoProfitDuration(months);

  if (status === "below_principal") {
    return `${durationLabel} 동안 원금 아래였습니다`;
  }

  if (status === "recovery_wait") {
    return `${durationLabel} 동안 새 고점이 없었습니다`;
  }

  return `${durationLabel} 동안 고점 아래에 머물렀습니다`;
}

function buildStreakBody(status: Exclude<NoProfitMonthStatus, "new_high">) {
  if (status === "below_principal") {
    return "평가금액이 원금보다 낮았던 구간입니다. 최종 결과만 보면 보이지 않지만, 실제로는 가장 불편한 시간이었을 수 있습니다.";
  }

  if (status === "recovery_wait") {
    return "이전 고점을 다시 넘지 못하고 기다린 구간입니다. 하락보다 지루함이 더 힘들 수 있는 시간입니다.";
  }

  return "고점 아래에서 기다린 구간입니다. 계좌가 무너지지는 않았지만, 마음은 길게 흔들렸을 수 있습니다.";
}

function toStreak(
  assetLabel: string,
  status: Exclude<NoProfitMonthStatus, "new_high">,
  streakMonths: NoProfitMonth[],
  index: number,
): NoProfitStreak {
  const minMonth = streakMonths.reduce((hardest, month) =>
    month.drawdownPct < hardest.drawdownPct ? month : hardest,
  );
  const minValueMonth = streakMonths.reduce((hardest, month) =>
    month.value < hardest.value ? month : hardest,
  );
  const startMonth = streakMonths[0]!;
  const endMonth = streakMonths[streakMonths.length - 1]!;
  const duration = streakMonths.length;

  return {
    body: buildStreakBody(status),
    endDate: endMonth.date,
    endMonth: endMonth.monthKey,
    id: `${assetLabel}-${status}-${startMonth.monthKey}-${index}`,
    maxDrawdownPct: minMonth.drawdownPct,
    minValue: minValueMonth.value,
    months: duration,
    startDate: startMonth.date,
    startMonth: startMonth.monthKey,
    status,
    title: buildStreakTitle(status, duration),
  };
}

function buildHardestStreaks(assetLabel: string, months: NoProfitMonth[]) {
  const streaks: NoProfitStreak[] = [];
  let currentStatus: Exclude<NoProfitMonthStatus, "new_high"> | null = null;
  let currentMonths: NoProfitMonth[] = [];

  const flush = () => {
    if (currentStatus && currentMonths.length > 0) {
      streaks.push(toStreak(assetLabel, currentStatus, currentMonths, streaks.length + 1));
    }

    currentStatus = null;
    currentMonths = [];
  };

  months.forEach((month) => {
    if (month.status === "new_high") {
      flush();
      return;
    }

    if (currentStatus && currentStatus !== month.status) {
      flush();
    }

    currentStatus = month.status;
    currentMonths.push(month);
  });

  flush();

  return streaks
    .sort((left, right) => {
      if (right.months !== left.months) {
        return right.months - left.months;
      }

      return left.maxDrawdownPct - right.maxDrawdownPct;
    })
    .slice(0, 3);
}

function compressByMonth(valueSeries: ValuePoint[]) {
  const monthly = new Map<string, ValuePoint>();

  valueSeries.forEach((point) => {
    monthly.set(getMonthKey(point.date), point);
  });

  return [...monthly.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([monthKey, point]) => ({ monthKey, point }));
}

export function buildNoProfitTimetable({
  assetLabel,
  initialAmount,
  valueSeries,
}: BuildNoProfitTimetableInput): NoProfitTimetable | null {
  if (!valueSeries.length || initialAmount <= 0) {
    return null;
  }

  const monthlyPoints = compressByMonth(valueSeries);
  if (!monthlyPoints.length) {
    return null;
  }

  let runningPeakValue = initialAmount;
  let noNewHighStreak = 0;
  let longestNoNewHighMonths = 0;
  let longestRecoveryWaitMonths = 0;
  let currentRecoveryWaitMonths = 0;

  const months = monthlyPoints.map(({ monthKey, point }) => {
    const value = point.value;
    const previousPeakValue = runningPeakValue;
    const isNewHigh = previousPeakValue > 0 ? value >= previousPeakValue : value > 0;
    const newHighBreakoutPct =
      isNewHigh && previousPeakValue > 0
        ? ((value - previousPeakValue) / previousPeakValue) * 100
        : 0;

    if (isNewHigh) {
      runningPeakValue = Math.max(runningPeakValue, value);
      noNewHighStreak = 0;
    } else {
      noNewHighStreak += 1;
      longestNoNewHighMonths = Math.max(longestNoNewHighMonths, noNewHighStreak);
    }

    const drawdownPct = runningPeakValue === 0 ? 0 : (value / runningPeakValue - 1) * 100;
    const status = isNewHigh
      ? "new_high"
      : getStatus(value, initialAmount, drawdownPct, noNewHighStreak);

    if (status === "recovery_wait") {
      currentRecoveryWaitMonths += 1;
      longestRecoveryWaitMonths = Math.max(
        longestRecoveryWaitMonths,
        currentRecoveryWaitMonths,
      );
    } else {
      currentRecoveryWaitMonths = 0;
    }

    return {
      date: point.date,
      drawdownPct,
      monthKey,
      newHighBreakoutPct,
      previousPeakValue,
      runningPeakValue,
      status,
      value,
    } satisfies NoProfitMonth;
  });

  const belowHighMonths = months.filter((month) => month.status !== "new_high").length;
  const belowPrincipalMonths = months.filter(
    (month) => month.status === "below_principal",
  ).length;

  return {
    assetLabel,
    belowHighMonths,
    belowPrincipalMonths,
    hardestStreaks: buildHardestStreaks(assetLabel, months),
    longestNoNewHighMonths,
    longestRecoveryWaitMonths,
    months,
    totalMonths: months.length,
  };
}

export function buildNoProfitTimetableShareText(timetable: NoProfitTimetable) {
  return [
    `Regretzero ${timetable.assetLabel} 인내의 세월 지도`,
    `${timetable.assetLabel}의 최종 숫자만큼 기다림도 길었습니다.`,
    `고점 아래 있었던 시간: ${formatNoProfitDuration(timetable.belowHighMonths)}`,
    `원금 아래 있었던 시간: ${formatNoProfitDuration(timetable.belowPrincipalMonths)}`,
    `새 고점 없이 지나간 최장 기간: ${formatNoProfitDuration(timetable.longestNoNewHighMonths)}`,
    "투자 권유가 아닌 과거 시뮬레이션입니다.",
  ].join("\n");
}

export { formatMonth };
