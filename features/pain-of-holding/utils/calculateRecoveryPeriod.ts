import type {
  MaxDrawdownResult,
  RecoveryResult,
  ValuePoint,
} from "@/features/pain-of-holding/types";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const DAYS_PER_MONTH = 30.44;

function getDayDifference(startDate: string, endDate: string) {
  const startTime = new Date(`${startDate}T00:00:00`).getTime();
  const endTime = new Date(`${endDate}T00:00:00`).getTime();

  return Math.max(0, Math.round((endTime - startTime) / DAY_IN_MS));
}

export function calculateRecoveryPeriod(
  valueSeries: ValuePoint[],
  maxDrawdown: MaxDrawdownResult,
): RecoveryResult {
  if (valueSeries.length === 0) {
    throw new Error("Value series must contain at least one point.");
  }

  if (maxDrawdown.maxDrawdownPct === 0) {
    return {
      recovered: true,
      recoveryDate: maxDrawdown.troughDate,
      recoveryDays: 0,
      recoveryIndex: maxDrawdown.troughIndex,
      recoveryMonths: 0,
    };
  }

  for (let index = maxDrawdown.troughIndex + 1; index < valueSeries.length; index += 1) {
    const point = valueSeries[index]!;

    if (point.value >= maxDrawdown.peakValue) {
      const recoveryDays = getDayDifference(maxDrawdown.troughDate, point.date);

      return {
        recovered: true,
        recoveryDate: point.date,
        recoveryDays,
        recoveryIndex: index,
        recoveryMonths: Math.max(0, Math.round(recoveryDays / DAYS_PER_MONTH)),
      };
    }
  }

  return {
    recovered: false,
    recoveryDate: null,
    recoveryDays: null,
    recoveryIndex: null,
    recoveryMonths: null,
  };
}
