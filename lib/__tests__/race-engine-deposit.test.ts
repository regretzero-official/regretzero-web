import { describe, expect, it } from "vitest";

import {
  buildAssetPriceSeries,
  buildMonthlyContributionRaceData,
  buildRaceData,
  buildStartPointResult,
  type MarketBundle,
} from "@/lib/race-engine";

const usdSeries = {
  daily: [
    { close: 1100, date: "2020-01-01" },
    { close: 1110, date: "2020-02-01" },
    { close: 1120, date: "2020-03-01" },
  ],
  meta: {
    currency: "KRW" as const,
    priceBasis: "close" as const,
    provider: "yahoo-finance" as const,
    resolvedEndDate: "2020-03-01",
    resolvedStartDate: "2020-01-01",
    ticker: "USDKRW",
  },
  monthly: [
    { close: 1100, date: "2020-01-01" },
    { close: 1110, date: "2020-02-01" },
    { close: 1120, date: "2020-03-01" },
  ],
  stats: {
    firstClose: 1100,
    firstDate: "2020-01-01",
    lastClose: 1120,
    lastDate: "2020-03-01",
    maxDrawdownDate: "2020-01-01",
    maxDrawdownPct: 0,
    returnPct: 1.81,
  },
};

const qqqSeries = {
  daily: [
    { close: 100, date: "2020-01-01" },
    { close: 110, date: "2020-02-01" },
    { close: 120, date: "2020-03-01" },
  ],
  meta: {
    currency: "USD" as const,
    priceBasis: "adjusted_close" as const,
    provider: "yahoo-finance" as const,
    resolvedEndDate: "2020-03-01",
    resolvedStartDate: "2020-01-01",
    ticker: "QQQ",
  },
  monthly: [
    { close: 100, date: "2020-01-01" },
    { close: 110, date: "2020-02-01" },
    { close: 120, date: "2020-03-01" },
  ],
  stats: {
    firstClose: 100,
    firstDate: "2020-01-01",
    lastClose: 120,
    lastDate: "2020-03-01",
    maxDrawdownDate: "2020-01-01",
    maxDrawdownPct: 0,
    returnPct: 20,
  },
};

const bundle: MarketBundle = {
  seriesByAsset: {
    qqq: qqqSeries,
  },
  source: "live",
  usdkrw: usdSeries,
};

function buildFlatMonthlySeries() {
  const dates = [
    "2020-01-01",
    "2020-02-01",
    "2020-03-01",
    "2020-04-01",
    "2020-05-01",
    "2020-06-01",
    "2020-07-01",
    "2020-08-01",
    "2020-09-01",
    "2020-10-01",
    "2020-11-01",
    "2020-12-01",
    "2021-01-01",
  ];
  const points = dates.map((date) => ({
    close: 100,
    date,
  }));

  return {
    daily: points,
    meta: {
      currency: "USD" as const,
      priceBasis: "adjusted_close" as const,
      provider: "yahoo-finance" as const,
      resolvedEndDate: "2021-01-01",
      resolvedStartDate: "2020-01-01",
      ticker: "QQQ",
    },
    monthly: points,
    stats: {
      firstClose: 100,
      firstDate: "2020-01-01",
      lastClose: 100,
      lastDate: "2021-01-01",
      maxDrawdownDate: "2020-01-01",
      maxDrawdownPct: 0,
      returnPct: 0,
    },
  };
}

const flatBundle: MarketBundle = {
  seriesByAsset: {
    qqq: buildFlatMonthlySeries(),
  },
  source: "live",
  usdkrw: {
    ...usdSeries,
    daily: buildFlatMonthlySeries().daily.map((point) => ({
      ...point,
      close: 1,
    })),
    monthly: buildFlatMonthlySeries().monthly.map((point) => ({
      ...point,
      close: 1,
    })),
  },
};

describe("race-engine deposit integration", () => {
  it("builds a synthetic deposit price series", () => {
    const series = buildAssetPriceSeries("deposit", bundle, "2020-01-01", "2020-03-01");

    expect(series[0]).toEqual({ date: "2020-01-01", price: 1 });
    expect(series[series.length - 1]?.price).toBeGreaterThan(1);
  });

  it("supports deposit in race data alongside market assets", () => {
    const race = buildRaceData(
      ["deposit", "qqq"],
      bundle,
      10_000_000,
      "2020-01-01",
      "2020-03-01",
    );

    expect(race.points.length).toBeGreaterThan(0);
    expect(race.results).toHaveLength(2);
    expect(Number(race.points[race.points.length - 1]?.deposit ?? 0)).toBeGreaterThan(10_000_000);
  });

  it("supports start-point calculations for deposit", () => {
    const result = buildStartPointResult(
      "deposit",
      bundle,
      10_000_000,
      "2020-01-01",
      "2021-01-01",
    );

    expect(result.finalValue).toBeGreaterThan(10_000_000);
    expect(result.totalReturnPct).toBeGreaterThan(0);
  });

  it("builds monthly contribution totals from the number of monthly deposits", () => {
    const race = buildMonthlyContributionRaceData(
      ["deposit"],
      bundle,
      300_000,
      "2020-01-01",
      "2021-01-01",
    );

    expect(race.results[0]?.totalInvestedKrw).toBe(3_600_000);
    expect(race.results[0]?.finalValue).toBeGreaterThan(3_600_000);
    expect(race.results[0]?.annualizedReturnMethod).toBe("xirr");
    expect(race.results[0]?.moneyWeightedReturnPct).toBeGreaterThan(0);
  });

  it("keeps a flat market asset close to the total contributed amount", () => {
    const race = buildMonthlyContributionRaceData(
      ["qqq"],
      flatBundle,
      300_000,
      "2020-01-01",
      "2021-01-01",
    );

    expect(race.results[0]?.totalInvestedKrw).toBe(3_600_000);
    expect(race.results[0]?.finalValue).toBeCloseTo(3_600_000, 0);
    expect(race.results[0]?.returnOnInvestedPct).toBeCloseTo(0, 2);
    expect(race.results[0]?.cagrPct).toBeUndefined();
    expect(race.results[0]?.annualizedReturnMethod).toBe("xirr");
    expect(race.results[0]?.moneyWeightedReturnPct).toBeCloseTo(0, 2);
  });

  it("produces a different result for monthly contributions than lump sum", () => {
    const monthlyRace = buildMonthlyContributionRaceData(
      ["qqq"],
      bundle,
      300_000,
      "2020-01-01",
      "2020-03-01",
    );
    const lumpSumRace = buildRaceData(
      ["qqq"],
      bundle,
      600_000,
      "2020-01-01",
      "2020-03-01",
    );

    expect(monthlyRace.results[0]?.totalInvestedKrw).toBe(600_000);
    expect(monthlyRace.results[0]?.finalValue).not.toBeCloseTo(
      lumpSumRace.results[0]?.finalValue ?? 0,
      0,
    );
  });

  it("blocks real-estate assets from monthly contribution mode", () => {
    expect(() =>
      buildMonthlyContributionRaceData(
        ["seoul_apt", "deposit"],
        bundle,
        300_000,
        "2020-01-01",
        "2021-01-01",
      ),
    ).toThrow("적립식은 예금, 주식, ETF, 금, 코인부터 지원합니다.");
  });
});
