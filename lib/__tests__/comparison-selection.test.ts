import { describe, expect, it } from "vitest";

import {
  MAX_COMPARISON_ASSETS,
  MIN_COMPARISON_ASSETS,
  applyPresetSelection,
  canAddAnotherAsset,
  canStartComparison,
  isSelectionFull,
  toggleAssetInSelectionQueue,
} from "@/lib/comparison-selection";

describe("comparison-selection", () => {
  it("enables comparison only for 2 or 3 selected assets", () => {
    expect(canStartComparison([])).toBe(false);
    expect(canStartComparison(["qqq"])).toBe(false);
    expect(canStartComparison(["qqq", "voo"])).toBe(true);
    expect(canStartComparison(["qqq", "voo", "nvda"])).toBe(true);
  });

  it("recognizes when more assets can still be added", () => {
    expect(canAddAnotherAsset(["qqq"])).toBe(true);
    expect(canAddAnotherAsset(["qqq", "voo"])).toBe(true);
    expect(canAddAnotherAsset(["qqq", "voo", "nvda"])).toBe(false);
  });

  it("marks the selection as full only at the maximum size", () => {
    expect(MIN_COMPARISON_ASSETS).toBe(2);
    expect(MAX_COMPARISON_ASSETS).toBe(3);
    expect(isSelectionFull(["qqq", "voo"])).toBe(false);
    expect(isSelectionFull(["qqq", "voo", "nvda"])).toBe(true);
  });

  it("adds and removes assets in queue order", () => {
    expect(toggleAssetInSelectionQueue([], "qqq")).toEqual({
      nextAssetIds: ["qqq"],
      removedAssetId: null,
      type: "added",
    });

    expect(toggleAssetInSelectionQueue(["qqq", "voo"], "qqq")).toEqual({
      nextAssetIds: ["voo"],
      removedAssetId: "qqq",
      type: "removed",
    });
  });

  it("replaces the oldest asset once 3 are already selected", () => {
    expect(toggleAssetInSelectionQueue(["seoul_apt", "qqq", "tsla"], "gold")).toEqual({
      nextAssetIds: ["qqq", "tsla", "gold"],
      removedAssetId: "seoul_apt",
      type: "replaced",
    });
  });

  it("normalizes preset selections to the first 3 unique assets", () => {
    expect(applyPresetSelection(["deposit", "qqq", "qqq", "tsla"])).toEqual([
      "deposit",
      "qqq",
      "tsla",
    ]);
  });
});
