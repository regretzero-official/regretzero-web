import type { CrisisRange, CrisisResult, ValuePoint } from "@/features/pain-of-holding/types";

const CRISIS_THRESHOLD = -30;
const RECOVERY_THRESHOLD = 0;

interface ActiveCrisis {
  maxDrawdownPct: number;
  peakValue: number;
  startIndex: number;
  troughIndex: number;
}

function calculateDrawdownPct(value: number, peakValue: number) {
  return peakValue > 0 ? (value / peakValue - 1) * 100 : 0;
}

export function calculateCrises(valueSeries: ValuePoint[]): CrisisResult {
  if (valueSeries.length === 0) {
    throw new Error("Value series must contain at least one point.");
  }

  const crises: CrisisRange[] = [];
  let activeCrisis: ActiveCrisis | null = null;
  let currentPeakIndex = 0;
  let currentPeakValue = valueSeries[0]!.value;

  for (let index = 0; index < valueSeries.length; index += 1) {
    const point = valueSeries[index]!;

    if (!activeCrisis) {
      if (point.value >= currentPeakValue) {
        currentPeakIndex = index;
        currentPeakValue = point.value;
      }

      const drawdownPct = calculateDrawdownPct(point.value, currentPeakValue);

      if (drawdownPct <= CRISIS_THRESHOLD) {
        activeCrisis = {
          maxDrawdownPct: drawdownPct,
          peakValue: currentPeakValue,
          startIndex: currentPeakIndex,
          troughIndex: index,
        };
      }

      continue;
    }

    const drawdownPct = calculateDrawdownPct(point.value, activeCrisis.peakValue);

    if (drawdownPct < activeCrisis.maxDrawdownPct) {
      activeCrisis.maxDrawdownPct = drawdownPct;
      activeCrisis.troughIndex = index;
    }

    const recoveredToPriorPeak = point.value >= activeCrisis.peakValue;

    if (recoveredToPriorPeak) {
      crises.push({
        endDate: point.date,
        endIndex: index,
        maxDrawdownPct: activeCrisis.maxDrawdownPct,
        recoveredToNearHigh: true,
        startDate: valueSeries[activeCrisis.startIndex]!.date,
        startIndex: activeCrisis.startIndex,
        troughDate: valueSeries[activeCrisis.troughIndex]!.date,
        troughIndex: activeCrisis.troughIndex,
      });
      activeCrisis = null;
      currentPeakIndex = index;
      currentPeakValue = point.value;
    }
  }

  if (activeCrisis) {
    crises.push({
      endDate: null,
      endIndex: null,
      maxDrawdownPct: activeCrisis.maxDrawdownPct,
      recoveredToNearHigh: false,
      startDate: valueSeries[activeCrisis.startIndex]!.date,
      startIndex: activeCrisis.startIndex,
      troughDate: valueSeries[activeCrisis.troughIndex]!.date,
      troughIndex: activeCrisis.troughIndex,
    });
  }

  return {
    crisisThresholdPct: CRISIS_THRESHOLD,
    crises,
    crisisCount: crises.length,
    recoveryThresholdPct: RECOVERY_THRESHOLD,
  };
}
