import { describe, expect, it } from "vitest";

import { buildRaceMoments } from "@/features/chart-race/buildRaceMoments";
import { buildHoldingPainReport } from "@/features/pain-of-holding";
import type { AssetOption } from "@/lib/home-content";
import type { RacePoint } from "@/lib/race-engine";

function asset(id: string, label: string): AssetOption {
  return {
    accent: "#6AB8FF",
    basis: "테스트",
    category: "미국ETF",
    description: label,
    glow: "rgba(106,184,255,0.16)",
    id,
    isAvailable: true,
    label,
    searchTerms: [label],
    shortLabel: label,
  };
}

function point(index: number, a: number, b = 100): RacePoint {
  return {
    a,
    b,
    date: `2020-${String(index + 1).padStart(2, "0")}-01`,
    index,
    label: `2020.${String(index + 1).padStart(2, "0")}`,
  };
}

const assets = [asset("a", "A"), asset("b", "B")];

describe("buildRaceMoments", () => {
  it("finds the first breakaway after the final leader gets 1.25x ahead", () => {
    const moments = buildRaceMoments({
      assets,
      points: [point(0, 100), point(1, 120), point(2, 130), point(3, 150)],
      results: [{ assetId: "a", finalValue: 150 }],
    });

    expect(moments.find((moment) => moment.type === "breakaway")).toMatchObject({
      assetId: "a",
      index: 2,
      title: "격차가 벌어진 순간",
    });
  });

  it("keeps only the deepest max drawdown moment", () => {
    const aReport = buildHoldingPainReport({
      initialAmount: 100,
      priceSeries: [
        { date: "2020-01-01", price: 100 },
        { date: "2020-02-01", price: 180 },
        { date: "2020-03-01", price: 90 },
        { date: "2020-04-01", price: 160 },
      ],
    });
    const bReport = buildHoldingPainReport({
      initialAmount: 100,
      priceSeries: [
        { date: "2020-01-01", price: 100 },
        { date: "2020-02-01", price: 110 },
        { date: "2020-03-01", price: 101 },
        { date: "2020-04-01", price: 115 },
      ],
    });

    const moments = buildRaceMoments({
      assets,
      minIndexGap: 1,
      points: [point(0, 100), point(1, 180, 110), point(2, 90, 101), point(3, 160, 115)],
      reports: { a: aReport, b: bReport },
    });

    expect(moments.filter((moment) => moment.type === "max_drawdown")).toHaveLength(1);
    expect(moments.find((moment) => moment.type === "max_drawdown")).toMatchObject({
      assetId: "a",
      index: 2,
      valueLabel: "A · -50.0%",
    });
  });

  it("creates a recovery moment when the final leader recovers its prior high", () => {
    const report = buildHoldingPainReport({
      initialAmount: 100,
      priceSeries: [
        { date: "2020-01-01", price: 100 },
        { date: "2020-02-01", price: 150 },
        { date: "2020-03-01", price: 75 },
        { date: "2020-04-01", price: 160 },
      ],
    });

    const moments = buildRaceMoments({
      assets,
      minIndexGap: 1,
      points: [point(0, 100), point(1, 150), point(2, 75), point(3, 160)],
      reports: { a: report },
      results: [{ assetId: "a", finalValue: 160 }],
    });

    expect(moments.find((moment) => moment.type === "recovery")).toMatchObject({
      assetId: "a",
      index: 3,
      title: "전고점 회복",
    });
  });

  it("removes nearby duplicate moments by keeping the higher priority one", () => {
    const report = buildHoldingPainReport({
      initialAmount: 100,
      priceSeries: [
        { date: "2020-01-01", price: 100 },
        { date: "2020-02-01", price: 160 },
        { date: "2020-03-01", price: 80 },
        { date: "2020-04-01", price: 170 },
      ],
    });

    const moments = buildRaceMoments({
      assets,
      minIndexGap: 3,
      points: [point(0, 100), point(1, 160), point(2, 80), point(3, 170)],
      reports: { a: report },
      results: [{ assetId: "a", finalValue: 170 }],
    });

    expect(moments).toHaveLength(1);
    expect(moments[0]?.type).toBe("max_drawdown");
  });

  it("does not create moments for flat data", () => {
    const report = buildHoldingPainReport({
      initialAmount: 100,
      priceSeries: [
        { date: "2020-01-01", price: 100 },
        { date: "2020-02-01", price: 100 },
        { date: "2020-03-01", price: 100 },
      ],
    });

    expect(
      buildRaceMoments({
        assets,
        points: [point(0, 100), point(1, 100), point(2, 100)],
        reports: { a: report, b: report },
        results: [{ assetId: "a", finalValue: 100 }],
      }),
    ).toEqual([]);
  });
});
