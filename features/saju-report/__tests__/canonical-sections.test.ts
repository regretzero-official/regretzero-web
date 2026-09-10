import { describe, expect, it } from "vitest";

import { buildTemplateReport, emptyBirthForm } from "../buildReport";
import { CANONICAL_SECTIONS, getCanonicalSectionCount } from "../canonical-sections";
import { SAJU_PRODUCTS } from "../products";
import type { SajuProductId } from "../types";

const form = {
  ...emptyBirthForm(),
  displayName: "수진",
  birthYear: "1995",
  birthMonth: "3",
  birthDay: "14",
  partnerName: "민재",
  monthsApart: "3",
  concern: "재회",
};

describe("canonical sections sync", () => {
  it.each(Object.keys(CANONICAL_SECTIONS) as SajuProductId[])(
    "%s product/landing/report share exact section count & titles",
    (productId) => {
      const product = SAJU_PRODUCTS.find((p) => p.id === productId)!;
      const report = buildTemplateReport(productId, form);
      const n = getCanonicalSectionCount(productId);
      expect(product.sections.length).toBe(n);
      expect(report.sections.length).toBe(n);
      expect(report.sections.map((s) => s.title)).toEqual([...CANONICAL_SECTIONS[productId]]);
      expect(product.sections).toEqual([...CANONICAL_SECTIONS[productId]]);
    },
  );

  it("does not leak raw markdown markers in reunion cover body when bold is intended", () => {
    const report = buildTemplateReport("reunion-luck", form);
    const joined = report.sections.map((s) => s.body).join("\n");
    expect(joined).toContain("**");
    expect(joined).not.toMatch(/다시 쓰야/);
    expect(joined).toMatch(/다시 써야/);
    // table pipes removed in favor of lists
    expect(joined).not.toMatch(/\| 십성 \|/);
  });
});
