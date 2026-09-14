import { describe, expect, it } from "vitest";
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";

import { emptyBirthForm } from "../buildReport";
import { FORM_STEPS } from "../form-steps";
import {
  SAJU_AMBIENT_PAD_MP3,
  SAJU_AMBIENT_PAD_OGG,
  SAJU_AMBIENT_PREF_KEY,
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
  it("exposes shrine + soft pad loops under public/saju/audio", () => {
    expect(SAJU_AMBIENT_SRC_MP3).toBe("/saju/audio/ambient-shrine.mp3");
    expect(SAJU_AMBIENT_SRC_OGG).toBe("/saju/audio/ambient-shrine.ogg");
    expect(SAJU_AMBIENT_PAD_MP3).toBe("/saju/audio/ambient-pad.mp3");
    expect(SAJU_AMBIENT_PAD_OGG).toBe("/saju/audio/ambient-pad.ogg");
    expect(SAJU_AMBIENT_PREF_KEY).toBe("saju-theater-ambient-on");
  });

  it("keeps ambient files small on disk", () => {
    const root = join(process.cwd(), "public");
    for (const rel of [
      SAJU_AMBIENT_SRC_MP3,
      SAJU_AMBIENT_SRC_OGG,
      SAJU_AMBIENT_PAD_MP3,
      SAJU_AMBIENT_PAD_OGG,
    ]) {
      const path = join(root, rel.replace(/^\//, ""));
      expect(existsSync(path), path).toBe(true);
      const size = statSync(path).size;
      expect(size).toBeGreaterThan(8_000);
      expect(size).toBeLessThan(250_000);
    }
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

describe("form polish source contracts", () => {
  it("wires aria-describedby reasons and soft optional copy", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const src = readFileSync(
      join(process.cwd(), "features/saju-report/components/saju-birth-form.tsx"),
      "utf8",
    );
    expect(src).toContain("aria-describedby");
    expect(src).toContain("비워도 돼요");
    expect(src).toContain('setStep("gender")');
    expect(src).toContain('setStep("basic")');
    expect(src).toContain('setStep("partner")');
    expect(src).toContain('setStep("situation")');
    expect(src).toContain("ConfirmEditButton");
    expect(src).toContain("bottom-[calc(env(safe-area-inset-bottom)+64px)]");
    expect(src).toContain("pb-[calc(env(safe-area-inset-bottom)+168px)]");
    // do not regress ambient sound hooks in theater
    const ambient = readFileSync(
      join(process.cwd(), "features/saju-report/hooks/use-theater-ambient.ts"),
      "utf8",
    );
    expect(ambient).toContain("SAJU_AMBIENT_SRC_MP3");
    expect(ambient).toContain("SAJU_AMBIENT_PAD_MP3");
  });
});
