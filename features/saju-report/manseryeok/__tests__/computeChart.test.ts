import { describe, expect, it } from "vitest";

import { emptyBirthForm } from "../../buildReport";
import { computeChart, parseBirthTime } from "../computeChart";

describe("parseBirthTime", () => {
  it("parses 24h and Korean am/pm", () => {
    expect(parseBirthTime("14:30")).toEqual({ kind: "known", hour: 14, minute: 30 });
    expect(parseBirthTime("오후 2시")).toEqual({ kind: "known", hour: 14, minute: 0 });
    expect(parseBirthTime("오후 2시 30분")).toEqual({ kind: "known", hour: 14, minute: 30 });
    expect(parseBirthTime("밤 10시")).toEqual({ kind: "known", hour: 22, minute: 0 });
    expect(parseBirthTime("오전 5시 30분")).toEqual({ kind: "known", hour: 5, minute: 30 });
  });

  it("treats empty / 모름 as unknown", () => {
    expect(parseBirthTime("")).toEqual({ kind: "unknown" });
    expect(parseBirthTime("모름")).toEqual({ kind: "unknown" });
    expect(parseBirthTime("미상")).toEqual({ kind: "unknown" });
  });
});

describe("computeChart", () => {
  it("README sample 1992-10-24 05:30 → 임신/경술/계유/을묘", () => {
    const form = {
      ...emptyBirthForm(),
      birthYear: "1992",
      birthMonth: "10",
      birthDay: "24",
      birthTime: "05:30",
      gender: "여성" as const,
    };
    const chart = computeChart(form);
    expect(chart.summaryLine).toBe("임신/경술/계유/을묘");
    expect(chart.pillars.year.korean).toBe("임신");
    expect(chart.pillars.month.korean).toBe("경술");
    expect(chart.pillars.day.korean).toBe("계유");
    expect(chart.pillars.hour?.korean).toBe("을묘");
    expect(chart.dayMaster).toBe("계");
    expect(chart.hourUnknown).toBe(false);
    expect(chart.voidBranches).toEqual(["술", "해"]);
    expect(chart.luckPillars).toBeDefined();
  });

  it("another known case 1990-05-15 14:30 male", () => {
    const form = {
      ...emptyBirthForm(),
      birthYear: "1990",
      birthMonth: "5",
      birthDay: "15",
      birthTime: "14:30",
      gender: "남성" as const,
    };
    const chart = computeChart(form);
    expect(chart.pillars.year.korean.length).toBe(2);
    expect(chart.pillars.day.korean.length).toBe(2);
    expect(chart.pillars.hour).not.toBeNull();
    expect(chart.luckPillars?.forward).toBeDefined();
    expect(chart.dayMaster).toBeTruthy();
  });

  it("hour unknown: year/month/day set, hour null, hourUnknown true", () => {
    const form = {
      ...emptyBirthForm(),
      birthYear: "1992",
      birthMonth: "10",
      birthDay: "24",
      birthTime: "모름",
      gender: "기타" as const,
    };
    const chart = computeChart(form);
    expect(chart.hourUnknown).toBe(true);
    expect(chart.pillars.hour).toBeNull();
    expect(chart.pillars.year.korean).toBe("임신");
    expect(chart.pillars.month.korean).toBe("경술");
    expect(chart.pillars.day.korean).toBe("계유");
    expect(chart.summaryLine).toContain("시주미상");
    expect(chart.tenGods.hour).toBeNull();
    expect(chart.luckPillars).toBeUndefined();
  });

  it("partner year pillar when partnerBirthYear given", () => {
    const form = {
      ...emptyBirthForm(),
      birthYear: "1992",
      birthMonth: "10",
      birthDay: "24",
      birthTime: "05:30",
      partnerBirthYear: "1993",
    };
    const chart = computeChart(form);
    expect(chart.partnerYearPillar?.korean).toBe("계유");
  });
});
