import type { CrisisRange } from "@/features/pain-of-holding";

export interface CrisisDetailTimelineItem {
  dateLabel: string;
  description: string;
  id: "recovery" | "start" | "trough";
  label: string;
  tone: "danger" | "neutral" | "positive";
  valueLabel: string;
}

export interface CrisisDetailInsight {
  declineDurationLabel: string;
  drawdownLabel: string;
  recoveryLabel: string;
  severityDescription: string;
  severityLabel: string;
  summary: string;
  timeline: CrisisDetailTimelineItem[];
  totalDurationLabel: string;
  watchPoints: string[];
}

function formatDateLabel(date: string) {
  return date.replace(/-/g, ".");
}

function getDateDiffDays(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00Z`).getTime();
  const end = new Date(`${endDate}T00:00:00Z`).getTime();
  const diff = Math.max(0, end - start);
  return Math.round(diff / 86_400_000);
}

function formatDuration(startDate: string, endDate: string) {
  const days = getDateDiffDays(startDate, endDate);

  if (days < 32) {
    return `${Math.max(1, days)}일`;
  }

  const months = Math.max(1, Math.round(days / 30.4375));

  if (months < 12) {
    return `${months}개월`;
  }

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  return remainingMonths > 0 ? `${years}년 ${remainingMonths}개월` : `${years}년`;
}

function formatDrawdown(pct: number) {
  return `${Math.abs(pct).toFixed(1)}%`;
}

function getSeverity(maxDrawdownPct: number) {
  const drawdown = Math.abs(maxDrawdownPct);

  if (drawdown >= 60) {
    return {
      description: "평가액이 크게 밀려, 결과를 알고 봐도 버티기 어려운 구간입니다.",
      label: "극한 구간",
    };
  }

  if (drawdown >= 50) {
    return {
      description: "반토막에 가까운 하락을 지나야 했던 구간입니다.",
      label: "매우 힘든 구간",
    };
  }

  if (drawdown >= 40) {
    return {
      description: "단기 변동이 아니라, 긴 시간 흔들림을 견뎌야 했던 구간입니다.",
      label: "힘든 구간",
    };
  }

  return {
    description: "하락과 회복 흐름을 함께 봐야 하는 구간입니다.",
    label: "주요 고비",
  };
}

export function buildCrisisDetailInsight(
  crisis: CrisisRange,
  assetLabel: string,
  raceEndDate: string,
): CrisisDetailInsight {
  const drawdownLabel = formatDrawdown(crisis.maxDrawdownPct);
  const declineDurationLabel = formatDuration(crisis.startDate, crisis.troughDate);
  const endDate = crisis.endDate ?? raceEndDate;
  const totalDurationLabel = formatDuration(crisis.startDate, endDate);
  const recoveryDurationLabel = crisis.endDate
    ? formatDuration(crisis.troughDate, crisis.endDate)
    : null;
  const recoveryLabel = recoveryDurationLabel ? `${recoveryDurationLabel} 뒤 회복` : "아직 회복 전";
  const severity = getSeverity(crisis.maxDrawdownPct);
  const summary = crisis.endDate
    ? `${assetLabel}는 이 구간에서 전고점 대비 ${drawdownLabel}까지 하락했고, 바닥 이후 ${recoveryDurationLabel} 만에 회복했습니다.`
    : `${assetLabel}는 이 구간에서 전고점 대비 ${drawdownLabel}까지 하락했고, 기준일 현재 아직 전고점을 회복하지 못했습니다.`;

  return {
    declineDurationLabel,
    drawdownLabel,
    recoveryLabel,
    severityDescription: severity.description,
    severityLabel: severity.label,
    summary,
    timeline: [
      {
        dateLabel: formatDateLabel(crisis.startDate),
        description: "전고점 이후 하락 구간이 시작된 날입니다.",
        id: "start",
        label: "하락 시작",
        tone: "neutral",
        valueLabel: "전고점",
      },
      {
        dateLabel: formatDateLabel(crisis.troughDate),
        description: "이 고비에서 가장 깊게 밀린 지점입니다.",
        id: "trough",
        label: "가장 힘든 날",
        tone: "danger",
        valueLabel: `-${drawdownLabel}`,
      },
      {
        dateLabel: crisis.endDate ? formatDateLabel(crisis.endDate) : "미회복",
        description: crisis.endDate
          ? "이전 고점을 다시 넘어선 날입니다."
          : "비교 기준일까지 이전 고점을 회복하지 못했습니다.",
        id: "recovery",
        label: "회복",
        tone: crisis.endDate ? "positive" : "danger",
        valueLabel: recoveryLabel,
      },
    ],
    totalDurationLabel,
    watchPoints: [
      `${declineDurationLabel} 동안 가격이 계속 밀렸습니다.`,
      `최대 낙폭은 전고점 대비 -${drawdownLabel}입니다.`,
      crisis.endDate
        ? `바닥 이후 ${recoveryDurationLabel} 만에 회복했고, 전체 고비는 ${totalDurationLabel} 이어졌습니다.`
        : `이 고비는 ${totalDurationLabel}째 이어졌고, 아직 회복 전입니다.`,
    ],
  };
}
