import { describe, expect, it } from "vitest";

import {
  comparisonPresetGroups,
  comparisonPresetLibrary,
  featuredHomePresets,
} from "@/lib/comparison-presets";

describe("comparison-presets", () => {
  it("keeps a curated preset library with real-estate comparison options", () => {
    expect(comparisonPresetLibrary).toHaveLength(22);
    expect(
      comparisonPresetLibrary.every(
        (preset) => preset.assetIds.length >= 2 && preset.assetIds.length <= 3,
      ),
    ).toBe(true);
    expect(comparisonPresetLibrary.some((preset) => preset.assetIds.includes("gangnam_gu_apt"))).toBe(true);
  });

  it("exposes 9 featured presets for the home screen", () => {
    expect(featuredHomePresets).toHaveLength(9);
  });

  it("groups presets by category for browsing", () => {
    expect(comparisonPresetGroups.length).toBeGreaterThanOrEqual(5);
    expect(comparisonPresetGroups.every((group) => group.presets.length > 0)).toBe(true);
  });
});
