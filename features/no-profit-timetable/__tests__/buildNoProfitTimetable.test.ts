import { describe, expect, it } from "vitest";

import {
  buildNoProfitTimetable,
  buildNoProfitTimetableShareText,
  formatNoProfitDuration,
} from "@/features/no-profit-timetable/buildNoProfitTimetable";
import type { ValuePoint } from "@/features/pain-of-holding/types";

function valuePoint(date: string, value: number): ValuePoint {
  return {
    date,
    drawdownPct: 0,
    peakIndex: 0,
    peakValue: value,
    price: value,
    shares: 1,
    value,
  };
}

describe("buildNoProfitTimetable", () => {
  it("compresses a month to the last point in that month", () => {
    const timetable = buildNoProfitTimetable({
      assetLabel: "테스트",
      initialAmount: 100,
      valueSeries: [
        valuePoint("2020-01-02", 90),
        valuePoint("2020-01-31", 120),
        valuePoint("2020-02-28", 110),
      ],
    });

    expect(timetable?.months).toHaveLength(2);
    expect(timetable?.months[0]?.value).toBe(120);
    expect(timetable?.months[0]?.status).toBe("new_high");
    expect(timetable?.months[0]?.previousPeakValue).toBe(100);
    expect(timetable?.months[0]?.newHighBreakoutPct).toBeCloseTo(20);
    expect(timetable?.months[1]?.status).toBe("below_high");
  });

  it("keeps the previous peak breakout rate for new-high months", () => {
    const timetable = buildNoProfitTimetable({
      assetLabel: "NVIDIA",
      initialAmount: 100,
      valueSeries: [
        valuePoint("2020-01-31", 100),
        valuePoint("2020-02-29", 120),
        valuePoint("2020-03-31", 115),
        valuePoint("2020-04-30", 150),
      ],
    });

    expect(timetable?.months[3]?.status).toBe("new_high");
    expect(timetable?.months[3]?.previousPeakValue).toBe(120);
    expect(timetable?.months[3]?.newHighBreakoutPct).toBeCloseTo(25);
  });

  it("counts months below the previous high and below principal", () => {
    const timetable = buildNoProfitTimetable({
      assetLabel: "테스트",
      initialAmount: 100,
      valueSeries: [
        valuePoint("2020-01-31", 100),
        valuePoint("2020-02-29", 140),
        valuePoint("2020-03-31", 90),
        valuePoint("2020-04-30", 80),
        valuePoint("2020-05-31", 150),
      ],
    });

    expect(timetable?.belowHighMonths).toBe(2);
    expect(timetable?.belowPrincipalMonths).toBe(2);
    expect(timetable?.longestNoNewHighMonths).toBe(2);
    expect(timetable?.hardestStreaks[0]?.months).toBe(2);
    expect(timetable?.hardestStreaks[0]?.status).toBe("below_principal");
  });

  it("marks a long no-new-high stretch as recovery wait", () => {
    const timetable = buildNoProfitTimetable({
      assetLabel: "테스트",
      initialAmount: 100,
      valueSeries: [
        valuePoint("2020-01-31", 100),
        valuePoint("2020-02-29", 140),
        valuePoint("2020-03-31", 132),
        valuePoint("2020-04-30", 130),
        valuePoint("2020-05-31", 128),
        valuePoint("2020-06-30", 126),
        valuePoint("2020-07-31", 124),
        valuePoint("2020-08-31", 122),
      ],
    });

    expect(timetable?.longestNoNewHighMonths).toBe(6);
    expect(timetable?.longestRecoveryWaitMonths).toBeGreaterThan(0);
    expect(timetable?.months.at(-1)?.status).toBe("recovery_wait");
  });

  it("keeps each month tied to the previous peak for calendar explanations", () => {
    const timetable = buildNoProfitTimetable({
      assetLabel: "테스트",
      initialAmount: 100,
      valueSeries: [
        valuePoint("2020-01-31", 100),
        valuePoint("2020-02-29", 200),
        valuePoint("2020-03-31", 120),
      ],
    });

    expect(timetable?.months[2]?.runningPeakValue).toBe(200);
    expect(timetable?.months[2]?.drawdownPct).toBeCloseTo(-40);
    expect(timetable?.months[2]?.status).toBe("recovery_wait");
  });

  it("keeps steadily rising data mostly as new highs", () => {
    const timetable = buildNoProfitTimetable({
      assetLabel: "테스트",
      initialAmount: 100,
      valueSeries: [
        valuePoint("2020-01-31", 100),
        valuePoint("2020-02-29", 110),
        valuePoint("2020-03-31", 120),
      ],
    });

    expect(timetable?.belowHighMonths).toBe(0);
    expect(timetable?.belowPrincipalMonths).toBe(0);
    expect(timetable?.longestNoNewHighMonths).toBe(0);
    expect(timetable?.hardestStreaks).toHaveLength(0);
  });
});

describe("formatNoProfitDuration", () => {
  it("formats Korean duration labels", () => {
    expect(formatNoProfitDuration(0)).toBe("없음");
    expect(formatNoProfitDuration(8)).toBe("8개월");
    expect(formatNoProfitDuration(24)).toBe("2년");
    expect(formatNoProfitDuration(31)).toBe("2년 7개월");
  });
});

describe("buildNoProfitTimetableShareText", () => {
  it("summarizes waiting time for sharing", () => {
    const timetable = buildNoProfitTimetable({
      assetLabel: "NVIDIA",
      initialAmount: 100,
      valueSeries: [
        valuePoint("2020-01-31", 100),
        valuePoint("2020-02-29", 150),
        valuePoint("2020-03-31", 90),
      ],
    });

    expect(timetable).not.toBeNull();
    const shareText = buildNoProfitTimetableShareText(timetable!);
    expect(shareText).toContain("NVIDIA");
    expect(shareText).toContain("고점 아래 있었던 시간");
    expect(shareText).not.toMatch(/[�]/);
  });
});
