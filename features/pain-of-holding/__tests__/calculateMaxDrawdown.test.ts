import { describe, expect, it } from "vitest";

import { buildValueSeries } from "@/features/pain-of-holding/utils/buildValueSeries";
import { calculateMaxDrawdown } from "@/features/pain-of-holding/utils/calculateMaxDrawdown";

describe("calculateMaxDrawdown", () => {
  it("finds a 50% crash peak and trough correctly", () => {
    const valueSeries = buildValueSeries({
      initialAmount: 1_000_000,
      priceSeries: [
        { date: "2020-01-01", price: 100 },
        { date: "2020-02-01", price: 150 },
        { date: "2020-03-01", price: 75 },
        { date: "2020-04-01", price: 160 },
      ],
    });

    const result = calculateMaxDrawdown(valueSeries);

    expect(result.maxDrawdownPct).toBe(-50);
    expect(result.peakIndex).toBe(1);
    expect(result.troughIndex).toBe(2);
    expect(result.peakDate).toBe("2020-02-01");
    expect(result.troughDate).toBe("2020-03-01");
  });

  it("treats the start as the first peak when the series drops immediately", () => {
    const valueSeries = buildValueSeries({
      initialAmount: 1_000_000,
      priceSeries: [
        { date: "2020-01-01", price: 100 },
        { date: "2020-02-01", price: 80 },
        { date: "2020-03-01", price: 90 },
      ],
    });

    const result = calculateMaxDrawdown(valueSeries);

    expect(result.maxDrawdownPct).toBeCloseTo(-20, 8);
    expect(result.peakIndex).toBe(0);
    expect(result.peakDate).toBe("2020-01-01");
    expect(result.troughIndex).toBe(1);
    expect(result.troughDate).toBe("2020-02-01");
  });
});
