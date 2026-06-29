import { describe, expect, it } from "vitest";

import {
  DEPOSIT_ANNUAL_RATE,
  buildDepositSyntheticSeries,
  getDepositGrowthFactor,
  getDepositValueAtDate,
} from "@/lib/deposit-series";

describe("deposit-series", () => {
  it("builds a monotonic monthly synthetic series", () => {
    const points = buildDepositSyntheticSeries("2020-01-01", "2020-07-01");

    expect(points[0]).toEqual({ date: "2020-01-01", price: 1 });
    expect(points[points.length - 1]?.date).toBe("2020-07-01");
    expect(points.every((point, index) => index === 0 || point.price >= points[index - 1]!.price)).toBe(true);
  });

  it("uses the fixed annual compound baseline", () => {
    const factor = getDepositGrowthFactor("2020-01-01", "2021-01-01");

    expect(factor).toBeCloseTo(1 + DEPOSIT_ANNUAL_RATE, 2);
  });

  it("returns a compounded value for arbitrary dates", () => {
    expect(getDepositValueAtDate(10_000_000, "2020-01-01", "2021-01-01")).toBeGreaterThan(
      10_000_000,
    );
  });
});
