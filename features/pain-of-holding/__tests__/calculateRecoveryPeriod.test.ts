import { describe, expect, it } from "vitest";

import { buildValueSeries } from "@/features/pain-of-holding/utils/buildValueSeries";
import { calculateMaxDrawdown } from "@/features/pain-of-holding/utils/calculateMaxDrawdown";
import { calculateRecoveryPeriod } from "@/features/pain-of-holding/utils/calculateRecoveryPeriod";

describe("calculateRecoveryPeriod", () => {
  it("calculates recovery after a 50% crash", () => {
    const valueSeries = buildValueSeries({
      initialAmount: 1_000_000,
      priceSeries: [
        { date: "2020-01-01", price: 100 },
        { date: "2020-02-01", price: 150 },
        { date: "2020-03-01", price: 75 },
        { date: "2020-05-01", price: 150 },
      ],
    });

    const maxDrawdown = calculateMaxDrawdown(valueSeries);
    const recovery = calculateRecoveryPeriod(valueSeries, maxDrawdown);

    expect(recovery.recovered).toBe(true);
    expect(recovery.recoveryDate).toBe("2020-05-01");
    expect(recovery.recoveryDays).toBeGreaterThan(0);
  });

  it("returns not recovered when the previous peak never comes back", () => {
    const valueSeries = buildValueSeries({
      initialAmount: 1_000_000,
      priceSeries: [
        { date: "2020-01-01", price: 100 },
        { date: "2020-02-01", price: 150 },
        { date: "2020-03-01", price: 70 },
        { date: "2020-04-01", price: 90 },
      ],
    });

    const maxDrawdown = calculateMaxDrawdown(valueSeries);
    const recovery = calculateRecoveryPeriod(valueSeries, maxDrawdown);

    expect(recovery.recovered).toBe(false);
    expect(recovery.recoveryDate).toBeNull();
    expect(recovery.recoveryMonths).toBeNull();
  });
});
