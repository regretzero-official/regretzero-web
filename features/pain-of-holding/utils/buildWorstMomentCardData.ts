import type {
  MaxDrawdownResult,
  RecoveryResult,
  WorstMomentCardData,
} from "@/features/pain-of-holding/types";

function buildRecoveryText(recovery: RecoveryResult, maxDrawdownPct: number) {
  if (maxDrawdownPct === 0) {
    return "큰 하락 없이 최고가 흐름을 이어갔어요.";
  }

  if (!recovery.recovered) {
    return "아직 전고점을 회복하지 못했어요.";
  }

  if ((recovery.recoveryMonths ?? 0) === 0) {
    return "짧은 조정 뒤 빠르게 회복했어요.";
  }

  return `${recovery.recoveryMonths}개월 뒤 전고점을 회복했어요.`;
}

export function buildWorstMomentCardData(
  maxDrawdown: MaxDrawdownResult,
  recovery: RecoveryResult,
): WorstMomentCardData {
  return {
    date: maxDrawdown.troughDate,
    drawdownPct: maxDrawdown.maxDrawdownPct,
    lossAmount: maxDrawdown.peakValue - maxDrawdown.troughValue,
    peakValue: maxDrawdown.peakValue,
    recoveryText: buildRecoveryText(recovery, maxDrawdown.maxDrawdownPct),
    troughValue: maxDrawdown.troughValue,
  };
}
