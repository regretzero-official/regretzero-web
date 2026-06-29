import { describe, expect, it } from "vitest";

import {
  buildRaceData,
  buildStartPointResult,
  type MarketBundle,
} from "@/lib/race-engine";

const usdSeries = {
  daily: [
    { close: 1300, date: "2020-01-02" },
    { close: 1310, date: "2020-01-03" },
    { close: 1320, date: "2020-01-06" },
  ],
  meta: {
    currency: "KRW" as const,
    priceBasis: "close" as const,
    provider: "yahoo-finance" as const,
    resolvedEndDate: "2020-01-06",
    resolvedStartDate: "2020-01-02",
    ticker: "USDKRW",
  },
  monthly: [
    { close: 1300, date: "2020-01-02" },
    { close: 1310, date: "2020-01-03" },
    { close: 1320, date: "2020-01-06" },
  ],
  stats: {
    firstClose: 1300,
    firstDate: "2020-01-02",
    lastClose: 1320,
    lastDate: "2020-01-06",
    maxDrawdownDate: "2020-01-02",
    maxDrawdownPct: 0,
    returnPct: 1.5,
  },
};

const appleSeries = {
  daily: [
    { close: 100, date: "2020-01-02" },
    { close: 101, date: "2020-01-03" },
    { close: 104, date: "2020-01-06" },
  ],
  meta: {
    currency: "USD" as const,
    priceBasis: "adjusted_close" as const,
    provider: "yahoo-finance" as const,
    resolvedEndDate: "2020-01-06",
    resolvedStartDate: "2020-01-02",
    ticker: "AAPL",
  },
  monthly: [
    { close: 100, date: "2020-01-02" },
    { close: 101, date: "2020-01-03" },
    { close: 104, date: "2020-01-06" },
  ],
  stats: {
    firstClose: 100,
    firstDate: "2020-01-02",
    lastClose: 104,
    lastDate: "2020-01-06",
    maxDrawdownDate: "2020-01-02",
    maxDrawdownPct: 0,
    returnPct: 4,
  },
};

const nvidiaSeries = {
  daily: [
    { close: 200, date: "2020-01-06" },
  ],
  meta: {
    currency: "USD" as const,
    priceBasis: "adjusted_close" as const,
    provider: "yahoo-finance" as const,
    resolvedEndDate: "2020-01-06",
    resolvedStartDate: "2020-01-06",
    ticker: "NVDA",
  },
  monthly: [
    { close: 200, date: "2020-01-06" },
  ],
  stats: {
    firstClose: 200,
    firstDate: "2020-01-06",
    lastClose: 200,
    lastDate: "2020-01-06",
    maxDrawdownDate: "2020-01-06",
    maxDrawdownPct: 0,
    returnPct: 0,
  },
};

const bundle: MarketBundle = {
  seriesByAsset: {
    aapl: appleSeries,
  },
  source: "live",
  usdkrw: usdSeries,
};

const bundleWithNewerAsset: MarketBundle = {
  seriesByAsset: {
    aapl: appleSeries,
    nvda: nvidiaSeries,
  },
  source: "live",
  usdkrw: usdSeries,
};

describe("race-engine start date resolution", () => {
  it("uses the next valid trading day when the requested start date is a non-trading day", () => {
    const race = buildRaceData(
      ["aapl"],
      bundle,
      1_000_000,
      "2020-01-04",
      "2020-01-06",
    );

    expect(race.requestedStartDate).toBe("2020-01-04");
    expect(race.resolvedStartDate).toBe("2020-01-06");
  });

  it("uses the same next valid trading day rule for start-point results", () => {
    const result = buildStartPointResult(
      "aapl",
      bundle,
      1_000_000,
      "2020-01-04",
      "2020-01-06",
    );

    expect(result.requestedStartDate).toBe("2020-01-04");
    expect(result.resolvedStartDate).toBe("2020-01-06");
  });

  it("moves the common race start to the first date shared by newer assets", () => {
    const race = buildRaceData(
      ["aapl", "nvda"],
      bundleWithNewerAsset,
      1_000_000,
      "2020-01-02",
      "2020-01-06",
    );

    expect(race.requestedStartDate).toBe("2020-01-02");
    expect(race.resolvedStartDate).toBe("2020-01-06");
    expect(race.points[0]?.date).toBe("2020-01-06");
  });
});
