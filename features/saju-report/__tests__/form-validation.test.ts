import { describe, expect, it } from "vitest";

import {
  birthTimeReason,
  concernReason,
  genderReason,
  monthsApartReason,
  solarDateReason,
} from "../form-validation";

describe("form field-level reasons", () => {
  it("genderReason → 성별 미선택", () => {
    expect(genderReason("")).toBe("성별 미선택");
    expect(genderReason("여성")).toBeNull();
  });

  it("solarDateReason → 날짜 불완전", () => {
    expect(solarDateReason("", "", "")).toBe("날짜 불완전");
    expect(solarDateReason("1992", "3", "")).toBe("날짜 불완전");
    expect(solarDateReason("1992", "3", "14")).toBeNull();
  });

  it("monthsApartReason → 이별 개월 0–120", () => {
    expect(monthsApartReason("")).toBe("이별 개월 0–120");
    expect(monthsApartReason("121")).toBe("이별 개월 0–120");
    expect(monthsApartReason("3")).toBeNull();
    expect(monthsApartReason("0")).toBeNull();
    expect(monthsApartReason("120")).toBeNull();
  });

  it("birthTimeReason → 시간 HH:MM 형식", () => {
    expect(birthTimeReason("")).toBeNull();
    expect(birthTimeReason("모름")).toBeNull();
    expect(birthTimeReason("14:30")).toBeNull();
    expect(birthTimeReason("오후 2시")).toBeNull();
    expect(birthTimeReason("14")).toBe("시간 HH:MM 형식");
    expect(birthTimeReason("25:00")).toBe("시간 HH:MM 형식");
    expect(birthTimeReason("14:99")).toBe("시간 HH:MM 형식");
  });

  it("concernReason when empty", () => {
    expect(concernReason("")).toBe("궁금한 것을 적어 주세요");
    expect(concernReason("남아 있을까")).toBeNull();
  });
});
