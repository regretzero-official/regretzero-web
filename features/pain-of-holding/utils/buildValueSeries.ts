import type { InvestmentInput, ValuePoint } from "@/features/pain-of-holding/types";
import { validateSeries } from "@/features/pain-of-holding/utils/validateSeries";

export function buildValueSeries(input: InvestmentInput): ValuePoint[] {
  const { initialAmount, priceSeries } = input;

  if (!Number.isFinite(initialAmount) || Number.isNaN(initialAmount) || initialAmount <= 0) {
    throw new Error("Initial investment amount must be a positive number.");
  }

  validateSeries(priceSeries);

  const firstPrice = priceSeries[0]!.price;
  const shares = initialAmount / firstPrice;

  let runningPeakValue = initialAmount;
  let runningPeakIndex = 0;

  return priceSeries.map((point, index) => {
    const value = shares * point.price;

    if (value > runningPeakValue) {
      runningPeakValue = value;
      runningPeakIndex = index;
    }

    return {
      date: point.date,
      drawdownPct:
        runningPeakValue === 0 ? 0 : ((value / runningPeakValue) - 1) * 100,
      peakIndex: runningPeakIndex,
      peakValue: runningPeakValue,
      price: point.price,
      shares,
      value,
    };
  });
}
