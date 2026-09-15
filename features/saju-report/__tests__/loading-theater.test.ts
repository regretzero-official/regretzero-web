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
import {
  HUB_CHARACTER_ORDER,
  HUB_GRID_ITEMS,
  HUB_SHELVES,
  itemsForShelf,
  productsForShelf,
} from "../hub-shelves";
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
      const cards = itemsForShelf(shelf);
      expect(cards.length).toBe(shelf.items.length);
      expect(cards.length).toBeGreaterThanOrEqual(2);
      expect(productsForShelf(shelf).length).toBeGreaterThanOrEqual(2);
    }
  });

  it("features male counselors prominently with bright/romantic mix", () => {
    const featured = HUB_SHELVES.find((s) => s.id === "featured");
    expect(featured).toBeTruthy();
    const faces = featured!.items.map((i) => i.faceCharacterId);
    for (const male of ["lee-doryeong", "han-siwoo", "kang-seon"] as const) {
      expect(faces).toContain(male);
    }
    // First three featured faces lead with the male trio
    expect(faces.slice(0, 3)).toEqual(["lee-doryeong", "kang-seon", "han-siwoo"]);
    const tones = new Set(featured!.items.map((i) => i.tone));
    expect(tones.has("bright")).toBe(true);
    expect(tones.has("romantic")).toBe(true);
    expect(HUB_CHARACTER_ORDER[0]).toBe("lee-doryeong");
    expect(HUB_GRID_ITEMS.some((i) => i.faceCharacterId === "lee-doryeong")).toBe(true);
    expect(HUB_GRID_ITEMS.some((i) => i.faceCharacterId === "kang-seon")).toBe(true);
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
    expect(
      SAJU_PRODUCT_LANDINGS.find((l) => l.slug === "reason")?.ctaLabel,
    ).toContain("진짜 이유");
  });
});

describe("reunion canonical outline length", () => {
  it("reunion-luck has 15 sections for landing outline", () => {
    expect(getCanonicalSectionCount("reunion-luck")).toBe(15);
  });
});
