import type { MaxDrawdownResult, ValuePoint } from "@/features/pain-of-holding/types";

export function calculateMaxDrawdown(valueSeries: ValuePoint[]): MaxDrawdownResult {
  if (valueSeries.length === 0) {
    throw new Error("Value series must contain at least one point.");
  }

  let result: MaxDrawdownResult = {
    maxDrawdownPct: 0,
    peakDate: valueSeries[0]!.date,
    peakIndex: 0,
    peakValue: valueSeries[0]!.value,
    troughDate: valueSeries[0]!.date,
    troughIndex: 0,
    troughValue: valueSeries[0]!.value,
  };

  for (let index = 0; index < valueSeries.length; index += 1) {
    const point = valueSeries[index]!;

    if (point.drawdownPct < result.maxDrawdownPct) {
      const peakPoint = valueSeries[point.peakIndex]!;

      result = {
        maxDrawdownPct: point.drawdownPct,
        peakDate: peakPoint.date,
        peakIndex: point.peakIndex,
        peakValue: peakPoint.value,
        troughDate: point.date,
        troughIndex: index,
        troughValue: point.value,
      };
    }
  }

  return result;
}
