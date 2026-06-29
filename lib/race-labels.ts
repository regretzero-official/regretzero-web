import type { AssetOption } from "@/lib/home-content";

export function getRaceDisplayLabel(
  asset: Pick<AssetOption, "label" | "marketTicker" | "shortLabel">,
) {
  if (asset.shortLabel) {
    return asset.shortLabel;
  }

  if (asset.label.length <= 12) {
    return asset.label;
  }

  if (asset.marketTicker && asset.marketTicker.length <= 8) {
    return asset.marketTicker;
  }

  return asset.label;
}
