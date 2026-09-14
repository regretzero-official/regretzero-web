import { describe, expect, it } from "vitest";

import {
  getLoadingCounselorLine,
  SAJU_LOADING_COUNSELOR_LINES,
  SAJU_LOADING_STAGES,
} from "../loading-theater";
import {
  getNextEntryBeat,
  SAJU_ENTRY_BEAT_ORDER,
  SAJU_ENTRY_BY_SLUG,
} from "../entry-experience";
import { getCanonicalSectionCount } from "../canonical-sections";
import { HUB_SHELVES, productsForShelf } from "../hub-shelves";
import { SAJU_PRODUCT_LANDINGS } from "../product-landings";

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

describe("entry theater beats", () => {
  it("orders shrine → hook → selfId → invite", () => {
    expect(SAJU_ENTRY_BEAT_ORDER).toEqual(["shrine", "hook", "selfId", "invite"]);
    expect(getNextEntryBeat("shrine")).toBe("hook");
    expect(getNextEntryBeat("hook")).toBe("selfId");
    expect(getNextEntryBeat("selfId")).toBe("invite");
    expect(getNextEntryBeat("invite")).toBeNull();
  });

  it("keeps skip, shrine, invite, and sound stub copy per slug", () => {
    for (const entry of Object.values(SAJU_ENTRY_BY_SLUG)) {
      expect(entry.skipLabel).toBe("건너뛰기");
      expect(entry.meetLabel).toMatch(/점사/);
      expect(entry.lines.length).toBeGreaterThanOrEqual(2);
      expect(entry.shrineTitle.length).toBeGreaterThan(0);
      expect(entry.shrineLine.length).toBeGreaterThan(0);
      expect(entry.inviteTitle).toMatch(/연/);
      expect(entry.inviteLine.length).toBeGreaterThan(0);
      expect(entry.soundEnableLabel).toContain("소리");
      expect(entry.concernChips.length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe("hub discovery shelves", () => {
  it("groups related products without empty shelves", () => {
    expect(HUB_SHELVES.length).toBeGreaterThanOrEqual(3);
    for (const shelf of HUB_SHELVES) {
      const products = productsForShelf(shelf);
      expect(products.length).toBe(shelf.productIds.length);
      expect(products.length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe("landing sticky copy honesty", () => {
  it("uses strong CTAs and honest sticky hints without fake counts", () => {
    for (const landing of SAJU_PRODUCT_LANDINGS) {
      expect(landing.ctaLabel.length).toBeGreaterThan(6);
      expect(landing.stickyHint).toMatch(/미리보기|가능/);
      expect(landing.stickyHint).not.toMatch(/\d+명/);
      expect(landing.ctaLabel).not.toMatch(/\d+명/);
    }
    expect(
      SAJU_PRODUCT_LANDINGS.find((l) => l.slug === "heart")?.ctaLabel,
    ).toContain("속마음");
  });
});

describe("reunion canonical outline length", () => {
  it("reunion-luck has 15 sections for landing outline", () => {
    expect(getCanonicalSectionCount("reunion-luck")).toBe(15);
  });
});
