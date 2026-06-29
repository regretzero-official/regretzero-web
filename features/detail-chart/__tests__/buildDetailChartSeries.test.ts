import { describe, expect, it } from "vitest";

import {
  buildCrisisChartMarkers,
  buildDetailChartSeries,
  buildInitialFocusRange,
  formatCrisisPeriodLabel,
} from "@/features/detail-chart/utils/buildDetailChartSeries";

describe("buildDetailChartSeries", () => {
  const daily = [
    { close: 102, date: "2024-01-02", high: 103, low: 99, open: 100 },
    { close: 104, date: "2024-01-03", high: 105, low: 101, open: 102 },
    { close: 108, date: "2024-01-08", high: 109, low: 103, open: 104 },
    { close: 106, date: "2024-02-01", high: 110, low: 105, open: 108 },
  ];

  it("aggregates weekly and monthly OHLC data", () => {
    const result = buildDetailChartSeries(daily);

    expect(result.daily).toHaveLength(4);
    expect(result.weekly).toHaveLength(3);
    expect(result.monthly).toHaveLength(2);
    expect(result.weekly[0]).toMatchObject({
      open: 100,
      close: 104,
      high: 105,
      low: 99,
    });
    expect(result.monthly[0]).toMatchObject({
      open: 100,
      close: 108,
      high: 109,
      low: 99,
    });
  });

  it("builds a readable crisis label and focus range", () => {
    const crisis = {
      endDate: "2024-02-01",
      endIndex: 3,
      maxDrawdownPct: -34.8,
      recoveredToNearHigh: true,
      startDate: "2024-01-03",
      startIndex: 1,
      troughDate: "2024-01-08",
      troughIndex: 2,
    };

    expect(formatCrisisPeriodLabel(crisis)).toBe("2024.01.03 ~ 2024.02.01 고비");
    expect(buildInitialFocusRange(daily, crisis, "weekly")).toEqual({
      from: 0,
      to: 3,
    });
  });

  it("maps crisis timeline markers onto available chart points", () => {
    const crisis = {
      endDate: "2024-02-01",
      endIndex: 3,
      maxDrawdownPct: -34.8,
      recoveredToNearHigh: true,
      startDate: "2024-01-03",
      startIndex: 1,
      troughDate: "2024-01-08",
      troughIndex: 2,
    };

    expect(buildCrisisChartMarkers(daily, crisis)).toEqual([
      expect.objectContaining({
        date: "2024-01-03",
        id: "start",
        label: "하락 시작",
        position: "aboveBar",
      }),
      expect.objectContaining({
        date: "2024-01-08",
        id: "trough",
        label: "가장 힘든 날",
        position: "belowBar",
      }),
      expect.objectContaining({
        date: "2024-02-01",
        id: "recovery",
        label: "회복",
        position: "aboveBar",
      }),
    ]);
  });

  it("does not create a recovery marker for unrecovered crises", () => {
    const crisis = {
      endDate: null,
      endIndex: null,
      maxDrawdownPct: -34.8,
      recoveredToNearHigh: false,
      startDate: "2024-01-03",
      startIndex: 1,
      troughDate: "2024-01-08",
      troughIndex: 2,
    };

    expect(buildCrisisChartMarkers(daily, crisis).map((marker) => marker.id)).toEqual([
      "start",
      "trough",
    ]);
  });
});
