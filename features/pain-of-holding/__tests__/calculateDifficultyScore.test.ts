import { describe, expect, it } from "vitest";

import { buildValueSeries } from "@/features/pain-of-holding/utils/buildValueSeries";
import { buildHoldingPainReport } from "@/features/pain-of-holding/utils/buildHoldingPainReport";
import { calculateCrises } from "@/features/pain-of-holding/utils/calculateCrises";
import { calculateDifficultyScore } from "@/features/pain-of-holding/utils/calculateDifficultyScore";
import { calculateMaxDrawdown } from "@/features/pain-of-holding/utils/calculateMaxDrawdown";
import { calculateRecoveryPeriod } from "@/features/pain-of-holding/utils/calculateRecoveryPeriod";
import type {
  CrisisResult,
  MaxDrawdownResult,
  RecoveryResult,
} from "@/features/pain-of-holding/types";

function maxDrawdown(maxDrawdownPct: number): MaxDrawdownResult {
  return {
    maxDrawdownPct,
    peakDate: "2020-01-01",
    peakIndex: 0,
    peakValue: 100,
    troughDate: "2020-02-01",
    troughIndex: 1,
    troughValue: 100 * (1 + maxDrawdownPct / 100),
  };
}

function recovery(recoveryMonths: number | null, recovered = true): RecoveryResult {
  return {
    recovered,
    recoveryDate: recovered ? "2020-06-01" : null,
    recoveryDays: recoveryMonths === null ? null : recoveryMonths * 30,
    recoveryIndex: recovered ? 2 : null,
    recoveryMonths,
  };
}

function crises(crisisCount: number): CrisisResult {
  return {
    crises: [],
    crisisCount,
    crisisThresholdPct: -30,
    recoveryThresholdPct: -5,
  };
}

describe("calculateDifficultyScore", () => {
  it("scores a volatile series with no major crisis as easy", () => {
    const valueSeries = buildValueSeries({
      initialAmount: 1_000_000,
      priceSeries: [
        { date: "2020-01-01", price: 100 },
        { date: "2020-02-01", price: 110 },
        { date: "2020-03-01", price: 102 },
        { date: "2020-04-01", price: 118 },
        { date: "2020-05-01", price: 112 },
        { date: "2020-06-01", price: 126 },
      ],
    });

    const maxDrawdown = calculateMaxDrawdown(valueSeries);
    const recovery = calculateRecoveryPeriod(valueSeries, maxDrawdown);
    const crises = calculateCrises(valueSeries);
    const difficulty = calculateDifficultyScore(maxDrawdown, recovery, crises);

    expect(crises.crisisCount).toBe(0);
    expect(difficulty.score).toBeLessThan(4);
    expect(difficulty.label).toBe("쉬움");
  });

  it("builds a hard report when a large crash never recovers", () => {
    const report = buildHoldingPainReport({
      initialAmount: 1_000_000,
      priceSeries: [
        { date: "2020-01-01", price: 100 },
        { date: "2020-02-01", price: 160 },
        { date: "2020-03-01", price: 70 },
        { date: "2020-04-01", price: 68 },
        { date: "2020-05-01", price: 90 },
      ],
    });

    expect(report.recovery.recovered).toBe(false);
    expect(report.difficulty.score).toBeGreaterThanOrEqual(7.5);
    expect(report.worstMoment.recoveryText.length).toBeGreaterThan(0);
    expect(report.maxDrawdown.maxDrawdownPct).toBeLessThanOrEqual(-30);
    expect(report.crises.crisisCount).toBeGreaterThan(0);
  });

  it("uses different natural Korean explanations for each path", () => {
    const easy = calculateDifficultyScore(maxDrawdown(-8), recovery(2), crises(0));
    const hard = calculateDifficultyScore(maxDrawdown(-45), recovery(18), crises(1));
    const unrecovered = calculateDifficultyScore(maxDrawdown(-55), recovery(null, false), crises(4));

    expect(easy.label).toBe("쉬움");
    expect(hard.label).toBe("어려움");
    expect(unrecovered.label).toBe("극한");
    expect(easy.explanation).toContain("회복이 빨랐습니다");
    expect(hard.explanation).toContain("회복을 기다리는 시간이 길었습니다");
    expect(unrecovered.explanation).toContain("아직 이전 고점을 되찾지 못했습니다");
    const brokenTextMarkers = ["\uFFFD", "\u5A9B", "\u8E42", "\u6E72", "\u6028", "\u5360"];
    const joinedExplanation = [easy.explanation, hard.explanation, unrecovered.explanation].join("\n");

    brokenTextMarkers.forEach((marker) => {
      expect(joinedExplanation).not.toContain(marker);
    });
  });
});
