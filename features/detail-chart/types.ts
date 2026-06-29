import type { CrisisRange } from "@/features/pain-of-holding";
import type { ComparisonAssetId } from "@/lib/home-content";
import type { MarketDataTicker, OhlcPoint } from "@/lib/market-data";

export type DetailChartTimeframe = "daily" | "monthly" | "weekly";

export interface DetailChartContext {
  assetId: ComparisonAssetId;
  assetLabel: string;
  crisis: CrisisRange;
  crisisLabel: string;
  marketTicker: MarketDataTicker;
  raceEndDate: string;
  raceStartDate: string;
}

export interface DetailChartSeriesByTimeframe {
  daily: OhlcPoint[];
  monthly: OhlcPoint[];
  weekly: OhlcPoint[];
}
