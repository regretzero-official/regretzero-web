import { describe, expect, it } from "vitest";

import { buildTemplateReport, emptyBirthForm } from "../buildReport";
import type { SajuProductId } from "../types";

const form = {
  ...emptyBirthForm(),
  displayName: "수진",
  birthYear: "1995",
  birthMonth: "3",
  birthDay: "14",
  birthTime: "밤 10시",
  birthPlace: "서울",
  partnerName: "민재",
  partnerBirthYear: "1993",
  monthsApart: "3",
  breakupNote: "서로 지쳐 헤어진 느낌",
  concern: "재회 가능 여부 / 지금 연락해도 되는지",
};

function bodyLen(productId: SajuProductId) {
  const report = buildTemplateReport(productId, form);
  return report.sections.reduce((n, s) => n + s.title.length + s.body.length, 0);
}

describe("buildTemplateReport depth", () => {
  it("reunion-luck template is long and structured", () => {
    const report = buildTemplateReport("reunion-luck", form);
    const len = bodyLen("reunion-luck");
    expect(report.sections.length).toBeGreaterThanOrEqual(12);
    expect(len).toBeGreaterThanOrEqual(6000);
    expect(report.characterName).toBe("백련");
    expect(report.sections.some((s) => s.id === "notice")).toBe(true);
    expect(report.sections.some((s) => /한줄결론|한 줄 결론/.test(s.title))).toBe(true);
    const joined = report.sections.map((s) => s.body).join("\n");
    expect(joined).toContain("민재");
    expect(joined).toContain("수진");
    expect(joined).toContain("예시용");
    expect(joined).toMatch(/엔터테인먼트/);
  });

  it("other products stay substantial with character voice", () => {
    expect(bodyLen("partner-heart")).toBeGreaterThanOrEqual(5000);
    expect(buildTemplateReport("partner-heart", form).characterName).toBe("서나리");
    expect(bodyLen("breakup-decision")).toBeGreaterThanOrEqual(4500);
    expect(buildTemplateReport("breakup-decision", form).characterName).toBe("차유리");
    expect(bodyLen("reunion-strategy")).toBeGreaterThanOrEqual(5000);
    expect(buildTemplateReport("reunion-strategy", form).characterName).toBe("한보라");
  });
});
