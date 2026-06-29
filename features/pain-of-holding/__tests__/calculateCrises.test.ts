import { describe, expect, it } from "vitest";

import { buildValueSeries } from "@/features/pain-of-holding/utils/buildValueSeries";
import { calculateCrises } from "@/features/pain-of-holding/utils/calculateCrises";

describe("calculateCrises", () => {
  it("counts multiple separate drawdown crises", () => {
    const valueSeries = buildValueSeries({
      initialAmount: 1_000_000,
      priceSeries: [
        { date: "2020-01-01", price: 100 },
        { date: "2020-02-01", price: 120 },
        { date: "2020-03-01", price: 80 },
        { date: "2020-04-01", price: 116 },
        { date: "2020-05-01", price: 130 },
        { date: "2020-06-01", price: 90 },
        { date: "2020-07-01", price: 126 },
        { date: "2020-08-01", price: 140 },
      ],
    });

    const crises = calculateCrises(valueSeries);

    expect(crises.crisisCount).toBe(2);
    expect(crises.crises[0]?.startDate).toBe("2020-02-01");
    expect(crises.crises[0]?.troughDate).toBe("2020-03-01");
    expect(crises.crises[1]?.startDate).toBe("2020-05-01");
    expect(crises.crises[1]?.troughDate).toBe("2020-06-01");
  });

  it("does not double-count a long drawdown with partial rebounds before a full recovery", () => {
    const valueSeries = buildValueSeries({
      initialAmount: 1_000_000,
      priceSeries: [
        { date: "2020-01-01", price: 100 },
        { date: "2020-02-01", price: 140 },
        { date: "2020-03-01", price: 90 },
        { date: "2020-04-01", price: 105 },
        { date: "2020-05-01", price: 97 },
        { date: "2020-06-01", price: 118 },
        { date: "2020-07-01", price: 140 },
      ],
    });

    const crises = calculateCrises(valueSeries);

    expect(crises.crisisCount).toBe(1);
    expect(crises.crises[0]?.startDate).toBe("2020-02-01");
    expect(crises.crises[0]?.troughDate).toBe("2020-03-01");
    expect(crises.crises[0]?.endDate).toBe("2020-07-01");
  });

  it("counts a new hardship only after the prior peak is fully recovered", () => {
    const valueSeries = buildValueSeries({
      initialAmount: 1_000_000,
      priceSeries: [
        { date: "2020-01-01", price: 100 },
        { date: "2020-02-01", price: 140 },
        { date: "2020-03-01", price: 90 },
        { date: "2020-04-01", price: 140 },
        { date: "2020-05-01", price: 135 },
        { date: "2020-06-01", price: 95 },
        { date: "2020-07-01", price: 150 },
      ],
    });

    const crises = calculateCrises(valueSeries);

    expect(crises.crisisCount).toBe(2);
    expect(crises.crises[0]?.startDate).toBe("2020-02-01");
    expect(crises.crises[0]?.endDate).toBe("2020-04-01");
    expect(crises.crises[1]?.startDate).toBe("2020-04-01");
    expect(crises.crises[1]?.troughDate).toBe("2020-06-01");
  });

  it("uses the prior peak as the crisis start, not the later threshold breach day", () => {
    const valueSeries = buildValueSeries({
      initialAmount: 1_000_000,
      priceSeries: [
        { date: "2020-01-01", price: 100 },
        { date: "2020-02-01", price: 160 },
        { date: "2020-03-01", price: 145 },
        { date: "2020-04-01", price: 124 },
        { date: "2020-05-01", price: 96 },
        { date: "2020-06-01", price: 164 },
      ],
    });

    const crises = calculateCrises(valueSeries);

    expect(crises.crises[0]).toMatchObject({
      endDate: "2020-06-01",
      startDate: "2020-02-01",
      troughDate: "2020-05-01",
    });
  });
});
