import { describe, expect, it } from "vitest";

import { buildHoldingPainReport } from "@/features/pain-of-holding/utils/buildHoldingPainReport";

describe("buildHoldingPainReport", () => {
  it("recalculates pain metrics when the effective start window changes", () => {
    const fullSeries = [
      { date: "2020-01-01", price: 100 },
      { date: "2020-02-01", price: 150 },
      { date: "2020-03-01", price: 75 },
      { date: "2020-04-01", price: 130 },
      { date: "2020-05-01", price: 170 },
    ];

    const fullWindowReport = buildHoldingPainReport({
      initialAmount: 1_000_000,
      priceSeries: fullSeries,
    });
    const shiftedWindowReport = buildHoldingPainReport({
      initialAmount: 1_000_000,
      priceSeries: fullSeries.slice(2),
    });

    expect(fullWindowReport.maxDrawdown.maxDrawdownPct).toBe(-50);
    expect(shiftedWindowReport.maxDrawdown.maxDrawdownPct).toBe(0);
    expect(fullWindowReport.difficulty.score).not.toBe(shiftedWindowReport.difficulty.score);
  });

  it("keeps hardship count and max drawdown internally consistent", () => {
    const report = buildHoldingPainReport({
      initialAmount: 1_000_000,
      priceSeries: [
        { date: "2020-01-01", price: 100 },
        { date: "2020-02-01", price: 150 },
        { date: "2020-03-01", price: 95 },
        { date: "2020-04-01", price: 75 },
        { date: "2020-05-01", price: 80 },
      ],
    });

    expect(report.crises.crisisCount).toBeGreaterThan(0);
    expect(report.maxDrawdown.maxDrawdownPct).toBeLessThanOrEqual(-30);
  });
});
