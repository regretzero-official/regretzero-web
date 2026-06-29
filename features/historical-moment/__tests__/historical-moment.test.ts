import { describe, expect, it } from "vitest";

import { buildHoldingPainReport } from "@/features/pain-of-holding/utils/buildHoldingPainReport";
import { buildHistoricalMomentExperience } from "@/features/historical-moment/utils/buildHistoricalMomentExperience";
import {
  FULL_REVEAL_MIN_MONTHS,
  getHistoricalMomentViewData,
} from "@/features/historical-moment/utils/getHistoricalMomentViewData";

describe("historical moment experience", () => {
  const report = buildHoldingPainReport({
    initialAmount: 1_000_000,
    priceSeries: [
      { date: "2020-01-01", price: 100 },
      { date: "2020-02-01", price: 130 },
      { date: "2020-03-01", price: 80 },
      { date: "2020-04-01", price: 90 },
      { date: "2020-05-01", price: 95 },
      { date: "2020-06-01", price: 102 },
      { date: "2020-07-01", price: 110 },
      { date: "2020-08-01", price: 140 },
    ],
  });

  const experience = buildHistoricalMomentExperience({
    assetId: "nvda",
    assetLabel: "NVIDIA",
    initialAmount: 1_000_000,
    report,
  });

  it("does not expose future outcome in the initial immersive state", () => {
    const view = getHistoricalMomentViewData(experience, "immersive", 0);

    expect(view.chartSeries).toHaveLength(experience.truncatedSeries.length);
    expect(view.futureOutcome).toBeNull();
    expect(view.canRevealOutcome).toBe(false);
  });

  it("reveals exactly one month on one advance", () => {
    const before = getHistoricalMomentViewData(experience, "progressing", 0);
    const after = getHistoricalMomentViewData(experience, "progressing", 1);

    expect(after.chartSeries).toHaveLength(before.chartSeries.length + 1);
    expect(after.chartSeries.at(-1)?.date).toBe(experience.futureSeries[0]?.date);
  });

  it("reveals months in order as progression continues", () => {
    const secondMonth = getHistoricalMomentViewData(experience, "progressing", 2);

    expect(secondMonth.chartSeries.at(-1)?.date).toBe(experience.futureSeries[1]?.date);
    expect(secondMonth.revealedMonthCount).toBe(2);
  });

  it("gates full reveal until a milestone is reached", () => {
    const early = getHistoricalMomentViewData(experience, "progressing", 1);
    const milestone = getHistoricalMomentViewData(
      experience,
      "progressing",
      Math.min(FULL_REVEAL_MIN_MONTHS, experience.futureSeries.length),
    );

    expect(early.canRevealOutcome).toBe(false);
    expect(milestone.canRevealOutcome).toBe(true);
  });
});
