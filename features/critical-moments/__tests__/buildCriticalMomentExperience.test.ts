import { describe, expect, it } from "vitest";

import { buildCriticalMomentExperience } from "@/features/critical-moments/utils/buildCriticalMomentExperience";
import { buildHoldingPainReport } from "@/features/pain-of-holding";
import { assetCatalog } from "@/lib/home-content";

function buildSyntheticSeries() {
  const monthlyPrices = [
    100, 108, 114, 118, 122, 116, 103, 92, 80, 76, 82, 88, 84, 86, 91, 97, 102, 106, 111, 117,
    126, 132, 138, 146, 154, 149, 141, 136, 144, 152, 168, 176, 189, 198, 208, 224,
  ];

  return monthlyPrices.map((price, index) => {
    const date = new Date("2020-01-01T00:00:00");
    date.setMonth(date.getMonth() + index);

    return {
      date: [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
      ].join("-"),
      price,
    };
  });
}

describe("buildCriticalMomentExperience", () => {
  it("extracts multiple distinct critical moments with narrative blocks", () => {
    const report = buildHoldingPainReport({
      initialAmount: 300_000_000,
      priceSeries: buildSyntheticSeries(),
    });

    const experience = buildCriticalMomentExperience({
      asset: assetCatalog.aapl,
      initialAmount: 300_000_000,
      report,
    });

    expect(experience.moments.length).toBeGreaterThanOrEqual(3);
    expect(new Set(experience.moments.map((moment) => moment.id)).size).toBe(
      experience.moments.length,
    );
    expect(experience.moments.some((moment) => moment.type === "maximum_drawdown")).toBe(true);
    expect(experience.moments.some((moment) => moment.type === "profit_protection")).toBe(true);
    expect(experience.series.length).toBe(report.valueSeries.length);
    expect(experience.teaser.facts.length).toBeGreaterThanOrEqual(3);

    for (const moment of experience.moments) {
      expect(moment.atmosphereSummary.length).toBeGreaterThan(0);
      expect(moment.badNewsPoints.length).toBeGreaterThan(0);
      expect(moment.wallStreetReactionPoints.length).toBeGreaterThan(0);
      expect(moment.lessonLines.length).toBeGreaterThan(0);
      expect(moment.metricCards.length).toBeGreaterThanOrEqual(6);
      expect(moment.afterMathStats.length).toBe(3);
    }
  });
});
