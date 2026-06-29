import type { HoldingPainReport } from "@/features/pain-of-holding";

export type HistoricalMomentMode = "immersive" | "progressing" | "revealed";

export type HistoricalMomentMessageState =
  | "historical_moment"
  | "deeper_drawdown"
  | "sideways_stagnation"
  | "uncertain_rebound"
  | "approaching_recovery"
  | "recovered_or_near_recovery";

export interface HistoricalMomentChartPoint {
  date: string;
  index: number;
  label: string;
  multiple: number;
  value: number;
}

export interface HistoricalMomentRevealData {
  finalDate: string;
  finalValue: number;
  recovered: boolean;
  recoveryDate: string | null;
  recoveryMonths: number | null;
  summary: string;
}

export interface HistoricalMomentSnapshot {
  date: string;
  drawdownPct: number;
  lossAmount: number;
  peakDate: string;
  peakValue: number;
  value: number;
}

export interface HistoricalMomentExperience {
  assetId: string;
  assetLabel: string;
  drawdownPct: number;
  fullSeries: HistoricalMomentChartPoint[];
  futureSeries: HistoricalMomentChartPoint[];
  initialAmount: number;
  lossAmount: number;
  momentDate: string;
  momentValue: number;
  monthsSincePeak: number;
  peakDate: string;
  peakValue: number;
  report: HoldingPainReport;
  reveal: HistoricalMomentRevealData;
  truncatedSeries: HistoricalMomentChartPoint[];
}

export interface HistoricalMomentViewData {
  canRevealOutcome: boolean;
  chartSeries: HistoricalMomentChartPoint[];
  currentSnapshot: HistoricalMomentSnapshot;
  enduranceLabel: string;
  futureOutcome: HistoricalMomentRevealData | null;
  hasMoreMonths: boolean;
  helperText: string;
  messageBadge: string;
  messageState: HistoricalMomentMessageState;
  messageStat: string | null;
  mode: HistoricalMomentMode;
  progressLabel: string;
  revealedMonthCount: number;
}
