import { describe, expect, it } from "vitest";

import { getCanonicalSectionCount } from "../canonical-sections";
import { FORM_STEPS } from "../form-steps";
import { getReportBooks } from "../report-books";
import { buildTemplateReport, emptyBirthForm } from "../buildReport";
import { GOOGLE_OAUTH_ENV_TODO } from "../auth-shell";

describe("mobile rebuild shell contracts", () => {
  it("keeps form to ~3 screens", () => {
    expect(FORM_STEPS).toHaveLength(3);
    expect(FORM_STEPS.map((s) => s.id)).toEqual(["me", "partner", "situation"]);
  });

  it("reunion stays 15 sections with 4-book TOC", () => {
    expect(getCanonicalSectionCount("reunion-luck")).toBe(15);
    const form = emptyBirthForm();
    form.gender = "여성";
    form.birthYear = "1995";
    form.birthMonth = "3";
    form.birthDay = "12";
    form.monthsApart = "3";
    form.concern = "그 사람 마음이 궁금해요";
    const report = buildTemplateReport("reunion-luck", form);
    expect(report.sections.length).toBe(15);
    const books = getReportBooks("reunion-luck", report.sections);
    expect(books).toHaveLength(4);
    expect(books.flatMap((b) => b.sectionIndexes).sort((a, b) => a - b)).toEqual(
      Array.from({ length: 15 }, (_, i) => i),
    );
  });

  it("documents Google OAuth env TODO for stub builds", () => {
    expect(GOOGLE_OAUTH_ENV_TODO).toMatch(/GOOGLE_CLIENT/);
  });
});
