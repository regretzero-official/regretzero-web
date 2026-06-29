import { describe, expect, it } from "vitest";

import {
  COMPARISON_SLOT_COLORS,
  getAssetColor,
  getComparisonSlotColor,
  getComparisonSlotGlow,
} from "@/lib/asset-colors";

describe("getAssetColor", () => {
  it("keeps known assets on stable deterministic colors", () => {
    expect(getAssetColor("tsla")).toBe(getAssetColor("tsla"));
    expect(getAssetColor("tsla")).not.toBe(getAssetColor("qqq"));
    expect(getAssetColor("btc")).not.toBe(getAssetColor("tsla"));
  });

  it("uses a deterministic palette fallback for unknown assets", () => {
    expect(getAssetColor("unknown-asset")).toBe(getAssetColor("unknown-asset"));
    expect(getAssetColor("unknown-asset")).not.toBe(getAssetColor("different-asset"));
  });
});

describe("comparison slot colors", () => {
  it("keeps slot colors fixed by selection order", () => {
    expect(getComparisonSlotColor(0)).toBe(COMPARISON_SLOT_COLORS[0]);
    expect(getComparisonSlotColor(1)).toBe(COMPARISON_SLOT_COLORS[1]);
    expect(getComparisonSlotColor(2)).toBe(COMPARISON_SLOT_COLORS[2]);
  });

  it("uses the same glow for the same slot", () => {
    expect(getComparisonSlotGlow(0)).toBe(getComparisonSlotGlow(0));
    expect(getComparisonSlotGlow(0)).not.toBe(getComparisonSlotGlow(1));
  });
});
