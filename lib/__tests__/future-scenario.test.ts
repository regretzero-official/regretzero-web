import { describe, expect, it } from "vitest";

import {
  buildFutureScenarioResults,
  buildFutureScenarioShareText,
  buildFutureStressTest,
  buildFutureStressTestShareText,
  deriveAnnualReturnPctFromMultiple,
} from "@/lib/future-scenario";

describe("buildFutureScenarioResults", () => {
  it("compounds an initial-only scenario for 10 years", () => {
    const results = buildFutureScenarioResults({
      initialKrw: 10_000_000,
      monthlyKrw: 0,
      years: 10,
    });

    const conservative = results.find((result) => result.presetId === "conservative");

    expect(conservative?.totalInvestedKrw).toBe(10_000_000);
    expect(conservative?.futureValueKrw).toBeCloseTo(13_439_164, 0);
  });

  it("uses 36 million won as total contributions for 300k monthly over 10 years", () => {
    const results = buildFutureScenarioResults({
      initialKrw: 0,
      monthlyKrw: 300_000,
      years: 10,
    });

    expect(results[0]?.totalInvestedKrw).toBe(36_000_000);
  });

  it("returns conservative, base, and optimistic scenarios in ascending result order", () => {
    const results = buildFutureScenarioResults({
      initialKrw: 10_000_000,
      monthlyKrw: 300_000,
      years: 10,
    });

    expect(results.map((result) => result.presetId)).toEqual([
      "conservative",
      "base",
      "optimistic",
    ]);
    expect(results[0]!.futureValueKrw).toBeLessThan(results[1]!.futureValueKrw);
    expect(results[1]!.futureValueKrw).toBeLessThan(results[2]!.futureValueKrw);
  });

  it("calculates the stress value from each drawdown assumption", () => {
    const results = buildFutureScenarioResults({
      initialKrw: 10_000_000,
      monthlyKrw: 300_000,
      years: 10,
    });

    for (const result of results) {
      expect(result.stressValueKrw).toBeCloseTo(
        result.futureValueKrw * (1 + result.stressDrawdownPct / 100),
        5,
      );
    }
  });
});

describe("buildFutureStressTest", () => {
  it("allows zero monthly contributions", () => {
    const result = buildFutureStressTest({
      assetLabel: "SOXL",
      initialKrw: 50_000_000,
      monthlyKrw: 0,
      referenceAnnualReturnPct: deriveAnnualReturnPctFromMultiple(180),
      referenceDrawdownPct: -75,
      referenceRecoveryMonths: 30,
      years: 10,
    });

    expect(result.totalInvestedKrw).toBe(50_000_000);
    expect(result.finalValueKrw).toBeGreaterThan(5_000_000_000);
    expect(result.events).toHaveLength(4);
    expect(result.events[0]?.title).toContain("첫 번째 하락");
  });

  it("derives extreme annual return from an extreme past multiple", () => {
    const annualReturnPct = deriveAnnualReturnPctFromMultiple(180);

    expect(annualReturnPct).toBeGreaterThan(60);
    expect(annualReturnPct).toBeLessThan(80);
  });

  it("builds stress events around drawdown and stagnation rather than fixed 3 scenarios", () => {
    const result = buildFutureStressTest({
      assetLabel: "NVIDIA",
      initialKrw: 10_000_000,
      monthlyKrw: 300_000,
      referenceAnnualReturnPct: 40,
      referenceDrawdownPct: -55,
      referenceRecoveryMonths: 8,
      years: 10,
    });

    expect(result.events.map((event) => event.id)).toEqual([
      "first_drop",
      "stagnation",
      "second_drop",
      "final",
    ]);
    expect(result.worstDrawdownPct).toBeLessThanOrEqual(-35);
    expect(result.events[1]?.shockLabel).toContain("정체");
  });
});

describe("buildFutureScenarioShareText", () => {
  it("makes clear that the scenario is an assumption, not a forecast", () => {
    const results = buildFutureScenarioResults({
      initialKrw: 10_000_000,
      monthlyKrw: 300_000,
      years: 10,
    });
    const text = buildFutureScenarioShareText({
      formatKrw: (value) => `${Math.round(value).toLocaleString("ko-KR")}원`,
      initialKrw: 10_000_000,
      monthlyKrw: 300_000,
      results,
    });

    expect(text).toContain("다음 10년 시나리오");
    expect(text).toContain("미래 예측이 아니라");
    expect(text).toContain("보수 가정");
    expect(text).toContain("기준 가정");
    expect(text).toContain("낙관 가정");
  });
});

describe("buildFutureStressTestShareText", () => {
  it("shares the rehearsal as a stress test, not a prediction", () => {
    const result = buildFutureStressTest({
      assetLabel: "SOXL",
      initialKrw: 50_000_000,
      monthlyKrw: 0,
      referenceAnnualReturnPct: deriveAnnualReturnPctFromMultiple(180),
      referenceDrawdownPct: -75,
      referenceRecoveryMonths: 30,
      years: 10,
    });
    const text = buildFutureStressTestShareText({
      formatKrw: (value) => `${Math.round(value).toLocaleString("ko-KR")}원`,
      monthlyKrw: 0,
      result,
    });

    expect(text).toContain("미래 하락장 리허설");
    expect(text).toContain("매달 납입: 0원");
    expect(text).toContain("미래 예측이 아니라");
    expect(text).toContain("가장 큰 리허설 하락");
  });
});
