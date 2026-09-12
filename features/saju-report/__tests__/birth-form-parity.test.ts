import { describe, expect, it } from "vitest";

import { emptyBirthForm } from "../buildReport";
import { FORM_STEPS } from "../form-steps";
import {
  SAJU_AMBIENT_SRC_MP3,
  SAJU_AMBIENT_SRC_OGG,
} from "../hooks/use-theater-ambient";
import { SAJU_ENTRY_BY_SLUG } from "../entry-experience";
import { SAJU_PRODUCT_LANDINGS } from "../product-landings";

describe("Foxbunny form step parity", () => {
  it("orders 성별 → 기본정보 → 상대 → 상황 → 확인", () => {
    expect(FORM_STEPS.map((s) => s.id)).toEqual([
      "gender",
      "basic",
      "partner",
      "situation",
      "confirm",
    ]);
    expect(FORM_STEPS.map((s) => s.label)).toEqual([
      "성별",
      "기본정보",
      "상대",
      "상황",
      "확인",
    ]);
  });

  it("starts empty with no default gender or monthsApart", () => {
    const form = emptyBirthForm();
    expect(form.gender).toBe("");
    expect(form.monthsApart).toBe("");
    expect(form.birthYear).toBe("");
    expect(form.concern).toBe("");
  });
});

describe("theater ambient audio assets", () => {
  it("exposes small ambient loop paths under public/saju/audio", () => {
    expect(SAJU_AMBIENT_SRC_MP3).toBe("/saju/audio/ambient-shrine.mp3");
    expect(SAJU_AMBIENT_SRC_OGG).toBe("/saju/audio/ambient-shrine.ogg");
  });
});

describe("entry hook copy strength", () => {
  it("keeps punchy multi-line hooks and gesture-friendly sound labels", () => {
    for (const entry of Object.values(SAJU_ENTRY_BY_SLUG)) {
      expect(entry.lines.length).toBeGreaterThanOrEqual(3);
      expect(entry.lines.join(" ").length).toBeGreaterThan(40);
      expect(entry.soundEnableLabel).toMatch(/소리|사운드/);
      expect(entry.skipLabel).toBe("건너뛰기");
    }
  });
});

describe("sticky honesty", () => {
  it("avoids fake participation counts on landings", () => {
    for (const landing of SAJU_PRODUCT_LANDINGS) {
      expect(landing.stickyHint).not.toMatch(/\d+명/);
      expect(landing.stickyHint).toMatch(/미리보기|가능|데모/);
      expect(landing.ctaLabel).not.toMatch(/%/);
    }
  });
});
