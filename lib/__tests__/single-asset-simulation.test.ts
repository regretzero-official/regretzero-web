import { describe, expect, it } from "vitest";

import { buildHoldingPainReport } from "@/features/pain-of-holding";
import {
  buildSingleAssetSimulation,
  type MarketBundle,
} from "@/lib/race-engine";

function buildBundle(points: Array<{ close: number; date: string }>): MarketBundle {
  return {
    seriesByAsset: {
      "005930": {
        daily: points,
        dailyOhlc: points.map((point) => ({
          close: point.close,
          date: point.date,
          high: point.close,
          low: point.close,
          open: point.close,
        })),
        meta: {
          currency: "KRW",
          priceBasis: "adjusted_close",
          provider: "yahoo-finance",
          resolvedEndDate: points[points.length - 1]?.date ?? "",
          resolvedStartDate: points[0]?.date ?? "",
          ticker: "005930.KS",
        },
        monthly: points,
        stats: {
          firstClose: points[0]?.close ?? 0,
          firstDate: points[0]?.date ?? "",
          lastClose: points[points.length - 1]?.close ?? 0,
          lastDate: points[points.length - 1]?.date ?? "",
          maxDrawdownDate: points[0]?.date ?? "",
          maxDrawdownPct: 0,
          returnPct: 0,
        },
      },
    },
    source: "live",
    usdkrw: null,
  };
}

describe("buildSingleAssetSimulation", () => {
  it("builds a single-asset result against a fixed principal line", () => {
    const result = buildSingleAssetSimulation(
      "005930",
      buildBundle([
        { date: "2020-01-01", close: 100 },
        { date: "2021-01-01", close: 200 },
      ]),
      10_000_000,
      "2020-01-01",
      "2021-01-01",
      "monthly",
    );

    expect(result.assetId).toBe("005930");
    expect(result.result.finalValue).toBe(20_000_000);
    expect(result.result.totalReturnPct).toBeCloseTo(100);
    expect(result.principalSeries.map((point) => point.value)).toEqual([
      10_000_000,
      10_000_000,
    ]);
  });

  it("keeps the actual data start date when the asset is newer than the request", () => {
    const result = buildSingleAssetSimulation(
      "005930",
      buildBundle([
        { date: "2022-05-01", close: 100 },
        { date: "2023-05-01", close: 130 },
      ]),
      10_000_000,
      "2020-01-01",
      "2023-05-01",
      "monthly",
    );

    expect(result.requestedStartDate).toBe("2020-01-01");
    expect(result.resolvedStartDate).toBe("2022-05-01");
  });

  it("can feed holding-pain metrics for drawdown and recovery", () => {
    const result = buildSingleAssetSimulation(
      "005930",
      buildBundle([
        { date: "2020-01-01", close: 100 },
        { date: "2020-06-01", close: 50 },
        { date: "2021-01-01", close: 120 },
      ]),
      10_000_000,
      "2020-01-01",
      "2021-01-01",
      "monthly",
    );
    const report = buildHoldingPainReport({
      initialAmount: 10_000_000,
      priceSeries: result.points.map((point) => ({
        date: point.date,
        price: Number(point["005930"]),
      })),
    });

    expect(report.maxDrawdown.maxDrawdownPct).toBeCloseTo(-50);
    expect(report.recovery.recovered).toBe(true);
  });
});
