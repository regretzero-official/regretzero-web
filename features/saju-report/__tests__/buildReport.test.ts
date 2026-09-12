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
    expect(len).toBeGreaterThanOrEqual(38000);
    expect(report.characterName).toBe("백련");
    expect(report.sections.some((s) => s.id === "notice")).toBe(true);
    expect(report.sections.some((s) => /한줄결론|한 줄 결론/.test(s.title))).toBe(true);
    const joined = report.sections.map((s) => s.body).join("\n");
    expect(joined).toContain("민재");
    expect(joined).toContain("수진");
    expect(joined).not.toContain("예시용");
    expect(joined).toMatch(/만세력/);
    expect(joined).toMatch(/참고용이에요/);
    expect(report.chart?.summaryLine).toBeTruthy();
    expect(report.sections.some((s) => s.id === "origin-compare")).toBe(true);
    expect(report.sections.length).toBe(15);
    expect(joined).toMatch(/근거 한 줄/);
    expect(joined).toMatch(/기운이 보여/);
    expect(joined).toMatch(/밤의 점사|밤이다|기억의 장면|대화창/);
    expect(joined).toMatch(/다음에 네가 할 선택/);
    expect(joined).not.toMatch(/십성으로 보면/);
    expect(joined).not.toMatch(/호흡 누적/);
    expect(joined).not.toMatch(/용신 감각/);
    expect(joined).not.toMatch(/### 용신·희신·기신/);
    expect(joined).not.toMatch(/- 년: .+\/- 월: .+\/- 일:/s);
  });

  it("other products are Foxbunny-length web-novel with character voice", () => {
    expect(bodyLen("partner-heart")).toBeGreaterThanOrEqual(35000);
    expect(buildTemplateReport("partner-heart", form).characterName).toBe("서나리");
    expect(bodyLen("breakup-decision")).toBeGreaterThanOrEqual(35000);
    expect(buildTemplateReport("breakup-decision", form).characterName).toBe("차유리");
    expect(bodyLen("reunion-strategy")).toBeGreaterThanOrEqual(35000);
    expect(buildTemplateReport("reunion-strategy", form).characterName).toBe("한보라");
    const seo = buildTemplateReport("partner-heart", form).sections.map((s) => s.body).join("\n");
    const cha = buildTemplateReport("breakup-decision", form).sections.map((s) => s.body).join("\n");
    const bora = buildTemplateReport("reunion-strategy", form).sections.map((s) => s.body).join("\n");
    expect(seo).toMatch(/느낌이 왔어|잔향|언니/);
    expect(cha).toMatch(/팩트|아껴도 돼|퍼줘/);
    expect(bora).toMatch(/헐|네 마음부터/);
    expect(seo).toMatch(/다음에 네가 할 선택/);
    expect(cha).toMatch(/다음에 네가 할 선택/);
    expect(bora).toMatch(/다음에 네가 할 선택/);
    expect(seo).toMatch(/근거 한 줄/);
    expect(cha).toMatch(/근거 한 줄/);
    expect(bora).toMatch(/근거 한 줄/);
    expect(seo).toMatch(/만세력|원국/);
    expect(seo).not.toMatch(/십성으로 보면/);
    expect(seo).not.toMatch(/### 용신·희신·기신/);
  });
});

describe("character voice distinctness", () => {
  it("baek-ryeon vs cha-yuri openers feel different", () => {
    const baek = buildTemplateReport("reunion-luck", form);
    const cha = buildTemplateReport("breakup-decision", form);
    const baekBody = baek.sections.map((s) => s.body).join("\n");
    const chaBody = cha.sections.map((s) => s.body).join("\n");
    expect(baekBody).toMatch(/기운이 보여|氣/);
    expect(chaBody).toMatch(/퍼줘|아껴도 돼|팩트/);
    expect(baekBody.slice(0, 400)).not.toEqual(chaBody.slice(0, 400));
    expect(baek.sections.find((s) => s.id === "cover")?.body).toContain("백련");
    expect(cha.sections.find((s) => s.id === "cover")?.body).toContain("차유리");
  });

  it("seo-nari vs han-bora openers feel different", () => {
    const seo = buildTemplateReport("partner-heart", form);
    const bora = buildTemplateReport("reunion-strategy", form);
    const seoOpen = seo.sections.find((s) => s.id === "cover")!.body;
    const boraOpen = bora.sections.find((s) => s.id === "cover")!.body;
    expect(seoOpen).toMatch(/느낌이 왔어|언니/);
    expect(boraOpen).toMatch(/헐|네 마음부터/);
    expect(seoOpen.slice(0, 280)).not.toEqual(boraOpen.slice(0, 280));
  });
});

describe("partner chart in reunion origin-compare", () => {
  it("full partner YMD shows both pillars and day masters", () => {
    const full = {
      ...form,
      partnerBirthMonth: "7",
      partnerBirthDay: "21",
      partnerBirthTime: "15:00",
    };
    const report = buildTemplateReport("reunion-luck", full);
    const compare = report.sections.find((s) => s.id === "origin-compare")!.body;
    expect(report.chart?.partnerChart?.detailLevel).toBe("full");
    expect(compare).toContain("민재");
    expect(compare).toMatch(/일간/);
    expect(compare).toContain(report.chart!.partnerChart!.summaryLine.split("/")[0]);
    expect(compare).toMatch(/일간 페어/);
  });

  it("year-only partner keeps year-pillar compare", () => {
    const report = buildTemplateReport("reunion-luck", form);
    const compare = report.sections.find((s) => s.id === "origin-compare")!.body;
    expect(report.chart?.partnerChart?.detailLevel).toBe("year-only");
    expect(compare).toMatch(/연주/);
    expect(compare).toMatch(/월·일·시주가 더 있으면|연도만으로는/);
  });

  it("name-only partner soft compare", () => {
    const soft = {
      ...form,
      partnerBirthYear: "",
      partnerBirthMonth: "",
      partnerBirthDay: "",
      partnerBirthTime: "",
    };
    const report = buildTemplateReport("reunion-luck", soft);
    const compare = report.sections.find((s) => s.id === "origin-compare")!.body;
    expect(report.chart?.partnerChart).toBeUndefined();
    expect(compare).toMatch(/소프트 비교|이름만/);
  });
});

describe("male counselor selection", () => {
  it("narrates reunion-luck as lee-doryeong when selected", () => {
    const report = buildTemplateReport("reunion-luck", form, "lee-doryeong");
    expect(report.characterId).toBe("lee-doryeong");
    expect(report.characterName).toBe("이도령");
    const cover = report.sections.find((s) => s.id === "cover")!.body;
    expect(cover).toMatch(/다치지 않게|곁에서 읽어/);
    expect(cover).toContain("이도령");
  });

  it("narrates reunion-strategy as han-siwoo when selected", () => {
    const report = buildTemplateReport("reunion-strategy", form, "han-siwoo");
    expect(report.characterId).toBe("han-siwoo");
    expect(report.characterName).toBe("한시우");
    const cover = report.sections.find((s) => s.id === "cover")!.body;
    expect(cover).toMatch(/급할수록 한 박자|氣/);
  });

  it("narrates partner-heart and breakup-decision as kang-seon when selected", () => {
    const heart = buildTemplateReport("partner-heart", form, "kang-seon");
    const breakup = buildTemplateReport("breakup-decision", form, "kang-seon");
    expect(heart.characterName).toBe("강세온");
    expect(breakup.characterName).toBe("강세온");
    expect(heart.sections.find((s) => s.id === "cover")!.body).toMatch(/괜찮아\. 같이 정리하자|같이 정리/);
  });

  it("falls back to default when character is not on product", () => {
    const report = buildTemplateReport("reunion-luck", form, "cha-yuri");
    expect(report.characterId).toBe("baek-ryeon");
  });
});
