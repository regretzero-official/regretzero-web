import type { ComparisonAssetId } from "@/lib/home-content";

export type CriticalMomentType =
  | "longest_stagnation"
  | "maximum_drawdown"
  | "profit_protection"
  | "recovery_uncertainty";

export type FundamentalState = "broken_signals" | "intact" | "shaken";

export type CriticalMomentReflectionResponse =
  | "continue_holding"
  | "not_sure"
  | "partial_exit"
  | "sold_and_left";

export interface CriticalMomentChartPoint {
  date: string;
  drawdownPct: number;
  index: number;
  label: string;
  monthsSinceEntry: number;
  price: number;
  value: number;
}

export interface CriticalMomentMetric {
  label: string;
  value: string;
}

export interface CriticalMomentTeaser {
  facts: string[];
  hardestPeriodSummary: string;
  headline: string;
}

export interface CriticalMoment {
  afterMathLines: string[];
  afterMathStats: CriticalMomentMetric[];
  atmosphereSummary: string;
  badNewsPoints: string[];
  cardDescription: string;
  currentReturnPct: number;
  date: string;
  dateLabel: string;
  drawdownPct: number;
  expertReactionTitle: string;
  fundamentals: {
    label: string;
    state: FundamentalState;
    summary: string;
  };
  id: string;
  lessonLines: string[];
  marketPriceLabel: string;
  metricCards: CriticalMomentMetric[];
  momentIndex: number;
  monthsSinceEntry: number;
  recoveryGainNeededPct: number;
  reflectionQuestion: string;
  shortLabel: string;
  type: CriticalMomentType;
  wallStreetReactionPoints: string[];
  waitingMonths: number;
  whyItWasHard: string;
}

export interface CriticalMomentExperience {
  assetId: ComparisonAssetId;
  assetLabel: string;
  moments: CriticalMoment[];
  series: CriticalMomentChartPoint[];
  teaser: CriticalMomentTeaser;
}
