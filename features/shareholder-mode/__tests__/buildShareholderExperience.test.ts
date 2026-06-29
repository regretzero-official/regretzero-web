import { describe, expect, it } from "vitest";

import {
  buildShareholderExperience,
  buildShareholderProgressView,
} from "@/features/shareholder-mode/utils/buildShareholderExperience";

function buildSyntheticPriceSeries() {
  return [
    { date: "2016-01-04", price: 100 },
    { date: "2016-02-01", price: 108 },
    { date: "2016-03-01", price: 101 },
    { date: "2016-04-01", price: 92 },
    { date: "2016-05-02", price: 88 },
    { date: "2016-06-01", price: 84 },
    { date: "2016-07-01", price: 86 },
    { date: "2016-08-01", price: 85 },
    { date: "2016-09-01", price: 87 },
    { date: "2016-10-04", price: 93 },
    { date: "2016-11-01", price: 98 },
    { date: "2016-12-01", price: 105 },
    { date: "2017-01-02", price: 112 },
  ];
}

describe("buildShareholderExperience", () => {
  it("builds a monthly shareholder journey with decision events", () => {
    const experience = buildShareholderExperience({
      assetId: "qqq",
      assetLabel: "QQQ",
      initialAmount: 100_000_000,
      priceSeries: buildSyntheticPriceSeries(),
    });

    expect(experience.series.length).toBeGreaterThanOrEqual(12);
    expect(experience.startDate).toBe("2016-01-04");
    expect(experience.endDate).toBe("2017-01-02");
    expect(experience.decisionEvents.length).toBeGreaterThan(0);
    expect(experience.summaryIndices.length).toBeGreaterThan(0);
  });

  it("builds progress insight from the revealed path only", () => {
    const experience = buildShareholderExperience({
      assetId: "qqq",
      assetLabel: "QQQ",
      initialAmount: 100_000_000,
      priceSeries: buildSyntheticPriceSeries(),
    });

    const progress = buildShareholderProgressView(experience, 6);

    expect(progress.currentPoint.index).toBe(6);
    expect(progress.revealedSeries).toHaveLength(7);
    expect(progress.pressureScore).toBeGreaterThan(0);
    expect(progress.message.length).toBeGreaterThan(0);
    expect(progress.summaryLine.length).toBeGreaterThan(0);
  });
});
