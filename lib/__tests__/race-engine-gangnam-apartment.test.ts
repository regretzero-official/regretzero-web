import { describe, expect, it } from "vitest";

import { buildAssetPriceSeries, buildRaceData, buildStartPointResult, type MarketBundle } from "@/lib/race-engine";

const usdSeries = {
  daily: [
    { close: 1100, date: "2020-01-01" },
    { close: 1110, date: "2020-02-01" },
    { close: 1120, date: "2020-03-01" },
    { close: 1130, date: "2021-01-01" },
  ],
  meta: {
    currency: "KRW" as const,
    priceBasis: "close" as const,
    provider: "yahoo-finance" as const,
    resolvedEndDate: "2021-01-01",
    resolvedStartDate: "2020-01-01",
    ticker: "USDKRW",
  },
  monthly: [
    { close: 1100, date: "2020-01-01" },
    { close: 1110, date: "2020-02-01" },
    { close: 1120, date: "2020-03-01" },
    { close: 1130, date: "2021-01-01" },
  ],
  stats: {
    firstClose: 1100,
    firstDate: "2020-01-01",
    lastClose: 1130,
    lastDate: "2021-01-01",
    maxDrawdownDate: "2020-01-01",
    maxDrawdownPct: 0,
    returnPct: 2.72,
  },
};

const qqqSeries = {
  daily: [
    { close: 100, date: "2020-01-01" },
    { close: 110, date: "2020-02-01" },
    { close: 120, date: "2020-03-01" },
    { close: 140, date: "2021-01-01" },
  ],
  meta: {
    currency: "USD" as const,
    priceBasis: "adjusted_close" as const,
    provider: "yahoo-finance" as const,
    resolvedEndDate: "2021-01-01",
    resolvedStartDate: "2020-01-01",
    ticker: "QQQ",
  },
  monthly: [
    { close: 100, date: "2020-01-01" },
    { close: 110, date: "2020-02-01" },
    { close: 120, date: "2020-03-01" },
    { close: 140, date: "2021-01-01" },
  ],
  stats: {
    firstClose: 100,
    firstDate: "2020-01-01",
    lastClose: 140,
    lastDate: "2021-01-01",
    maxDrawdownDate: "2020-01-01",
    maxDrawdownPct: 0,
    returnPct: 40,
  },
};

const bundle: MarketBundle = {
  seriesByAsset: {
    qqq: qqqSeries,
  },
  source: "live",
  usdkrw: usdSeries,
};

describe("race-engine gangnam apartment integration", () => {
  it("builds a synthetic price series for gangnam-gu apartment", () => {
    const series = buildAssetPriceSeries("gangnam_gu_apt", bundle, "2015-08-01", "2025-08-01");

    expect(series[0]).toEqual({ date: "2015-08-01", price: 900_000_000 });
    expect(series[series.length - 1]).toEqual({ date: "2025-08-01", price: 3_350_000_000 });
  });

  it("supports gangnam-gu apartment in race data alongside market assets", () => {
    const race = buildRaceData(
      ["gangnam_gu_apt", "deposit"],
      bundle,
      10_000_000,
      "2015-08-01",
      "2025-08-01",
    );

    expect(race.points.length).toBeGreaterThan(0);
    expect(race.results).toHaveLength(2);
    expect(Number(race.points[race.points.length - 1]?.gangnam_gu_apt ?? 0)).toBeCloseTo(
      10_000_000 * (3_350_000_000 / 900_000_000),
      -1,
    );
  });

  it("does not share the same 10-year result path as seoul apartment", () => {
    const race = buildRaceData(
      ["seoul_apt", "gangnam_gu_apt"],
      bundle,
      10_000_000,
      "2015-08-01",
      "2025-08-01",
    );

    const finalPoint = race.points[race.points.length - 1]!;
    const seoulFinal = Number(finalPoint.seoul_apt ?? 0);
    const gangnamGuFinal = Number(finalPoint.gangnam_gu_apt ?? 0);

    expect(gangnamGuFinal).toBeGreaterThan(seoulFinal);
    expect(gangnamGuFinal).not.toBeCloseTo(seoulFinal, 6);
    expect(gangnamGuFinal - seoulFinal).toBeGreaterThan(1_000_000);
  });

  it("supports start-point calculations for gangnam-gu apartment", () => {
    const result = buildStartPointResult(
      "gangnam_gu_apt",
      bundle,
      10_000_000,
      "2020-01-01",
      "2021-01-01",
    );

    expect(result.finalValue).toBeGreaterThan(10_000_000);
    expect(result.totalReturnPct).toBeGreaterThan(0);
  });
});
