import type { ComparisonAssetId } from "@/lib/home-content";

export const MIN_COMPARISON_ASSETS = 2;
export const MAX_COMPARISON_ASSETS = 3;

export interface SelectionQueueResult {
  nextAssetIds: ComparisonAssetId[];
  removedAssetId: ComparisonAssetId | null;
  type: "added" | "removed" | "replaced";
}

export function canStartComparison(assetIds: ComparisonAssetId[]) {
  return (
    assetIds.length >= MIN_COMPARISON_ASSETS &&
    assetIds.length <= MAX_COMPARISON_ASSETS
  );
}

export function isSelectionFull(assetIds: ComparisonAssetId[]) {
  return assetIds.length >= MAX_COMPARISON_ASSETS;
}

export function canAddAnotherAsset(assetIds: ComparisonAssetId[]) {
  return assetIds.length < MAX_COMPARISON_ASSETS;
}

export function toggleAssetInSelectionQueue(
  currentAssetIds: ComparisonAssetId[],
  assetId: ComparisonAssetId,
): SelectionQueueResult {
  if (currentAssetIds.includes(assetId)) {
    return {
      nextAssetIds: currentAssetIds.filter((currentAssetId) => currentAssetId !== assetId),
      removedAssetId: assetId,
      type: "removed",
    };
  }

  if (currentAssetIds.length < MAX_COMPARISON_ASSETS) {
    return {
      nextAssetIds: [...currentAssetIds, assetId],
      removedAssetId: null,
      type: "added",
    };
  }

  const [removedAssetId, ...remainingAssetIds] = currentAssetIds;

  return {
    nextAssetIds: [...remainingAssetIds, assetId],
    removedAssetId: removedAssetId ?? null,
    type: "replaced",
  };
}

export function applyPresetSelection(
  assetIds: ComparisonAssetId[],
) {
  return Array.from(new Set(assetIds)).slice(0, MAX_COMPARISON_ASSETS);
}
