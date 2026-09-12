import { describe, expect, it } from "vitest";

import {
  getLoadingCounselorLine,
  SAJU_LOADING_COUNSELOR_LINES,
  SAJU_LOADING_STAGES,
} from "../loading-theater";
import { SAJU_ENTRY_BY_SLUG } from "../entry-experience";
import { getCanonicalSectionCount } from "../canonical-sections";

describe("loading theater copy", () => {
  it("has four staged progress lines", () => {
    expect(SAJU_LOADING_STAGES).toHaveLength(4);
    expect(SAJU_LOADING_STAGES[0]).toContain("출생 원국");
    expect(SAJU_LOADING_STAGES[3]).toContain("점사");
  });

  it("provides counselor lines for all characters", () => {
    expect(Object.keys(SAJU_LOADING_COUNSELOR_LINES).length).toBeGreaterThanOrEqual(7);
    expect(getLoadingCounselorLine("baek-ryeon")).toContain("기운");
    expect(getLoadingCounselorLine("unknown-id", "상담사")).toContain("상담사");
  });
});

describe("entry experience", () => {
  it("keeps skip label and 점사 meet labels", () => {
    for (const entry of Object.values(SAJU_ENTRY_BY_SLUG)) {
      expect(entry.skipLabel).toBe("건너뛰기");
      expect(entry.meetLabel).toMatch(/점사/);
      expect(entry.lines.length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe("reunion canonical outline length", () => {
  it("reunion-luck has 15 sections for landing outline", () => {
    expect(getCanonicalSectionCount("reunion-luck")).toBe(15);
  });
});
