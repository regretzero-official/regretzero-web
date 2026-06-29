import { describe, expect, it } from "vitest";

import { buildValueSeries } from "@/features/pain-of-holding/utils/buildValueSeries";

describe("buildValueSeries", () => {
  it("builds a monotonic uptrend without drawdown", () => {
    const valueSeries = buildValueSeries({
      initialAmount: 1_000_000,
      priceSeries: [
        { date: "2020-01-01", price: 100 },
        { date: "2020-02-01", price: 110 },
        { date: "2020-03-01", price: 125 },
      ],
    });

    expect(valueSeries).toHaveLength(3);
    expect(valueSeries[0]?.value).toBe(1_000_000);
    expect(valueSeries[2]?.value).toBe(1_250_000);
    expect(valueSeries.every((point) => point.drawdownPct === 0)).toBe(true);
  });
});
