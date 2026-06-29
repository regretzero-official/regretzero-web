import { describe, expect, it } from "vitest";

import type { HistoricalMomentChartPoint } from "@/features/historical-moment/types";
import {
  buildHistoricalMomentMessage,
  classifyHistoricalMomentState,
} from "@/features/historical-moment/utils/interpretHistoricalMomentMessage";

function point(date: string, value: number, index: number): HistoricalMomentChartPoint {
  return {
    date,
    index,
    label: date,
    multiple: value / 100,
    value,
  };
}

describe("interpretHistoricalMomentMessage", () => {
  it("maps deeper drawdown months to deeper_drawdown", () => {
    const series = [
      point("2022-01-01", 100, 0),
      point("2022-02-01", 130, 1),
      point("2022-03-01", 80, 2),
      point("2022-04-01", 68, 3),
    ];

    expect(classifyHistoricalMomentState(series, 1)).toBe("deeper_drawdown");
  });

  it("maps sideways behavior to sideways_stagnation", () => {
    const series = [
      point("2022-01-01", 100, 0),
      point("2022-02-01", 130, 1),
      point("2022-03-01", 80, 2),
      point("2022-04-01", 81, 3),
      point("2022-05-01", 80.5, 4),
      point("2022-06-01", 81, 5),
    ];

    expect(classifyHistoricalMomentState(series, 3)).toBe("sideways_stagnation");
  });

  it("maps rebound without recovery to uncertain_rebound", () => {
    const series = [
      point("2022-01-01", 100, 0),
      point("2022-02-01", 130, 1),
      point("2022-03-01", 80, 2),
      point("2022-04-01", 96, 3),
    ];

    expect(classifyHistoricalMomentState(series, 1)).toBe("uncertain_rebound");
  });

  it("avoids immediately repeating the same sentence where the same state continues", () => {
    const firstSeries = [
      point("2022-01-01", 100, 0),
      point("2022-02-01", 130, 1),
      point("2022-03-01", 80, 2),
      point("2022-04-01", 86, 3),
    ];
    const secondSeries = [...firstSeries, point("2022-05-01", 92, 4)];

    const first = buildHistoricalMomentMessage({
      revealedMonthCount: 1,
      visibleSeries: firstSeries,
    });
    const second = buildHistoricalMomentMessage({
      revealedMonthCount: 2,
      visibleSeries: secondSeries,
    });

    expect(first.state).toBe("uncertain_rebound");
    expect(second.state).toBe("uncertain_rebound");
    expect(second.message).not.toBe(first.message);
  });

  it("does not require future-only data to build the message", () => {
    const visibleSeries = [
      point("2022-01-01", 100, 0),
      point("2022-02-01", 130, 1),
      point("2022-03-01", 80, 2),
    ];

    const message = buildHistoricalMomentMessage({
      revealedMonthCount: 0,
      visibleSeries,
    });

    expect(message.state).toBe("historical_moment");
    expect(message.statLine).toContain("전고점 대비");
    expect(message.enduranceLabel.length).toBeGreaterThan(0);
  });
});
