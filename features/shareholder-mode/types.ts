import type { HoldingPainReport } from "@/features/pain-of-holding";
import type { ComparisonAssetId } from "@/lib/home-content";

export type ShareholderModeStage =
  | "decision"
  | "entry"
  | "final"
  | "progress"
  | "rules"
  | "summary";

export type ShareholderPsychologyState =
  | "approaching_recovery"
  | "deeper_drawdown"
  | "entry_optimism"
  | "recovered_or_near_recovery"
  | "sideways_stagnation"
  | "uncertain_rebound";

export type ShareholderDecisionChoice = "hold" | "sell_all";

export interface ShareholderPathPoint {
  date: string;
  drawdownPct: number;
  index: number;
  label: string;
  monthsSinceEntry: number;
  newLowCount: number;
  peakValue: number;
  price: number;
  recoveryGainNeededPct: number;
  returnPct: number;
  unrecoveredMonths: number;
  value: number;
}

export interface ShareholderDecisionEvent {
  index: number;
  insight: string;
  statLine: string;
  summary: string;
  title: string;
  type: ShareholderPsychologyState;
}

export interface ShareholderExperience {
  assetId: ComparisonAssetId;
  assetLabel: string;
  decisionEvents: ShareholderDecisionEvent[];
  endDate: string;
  hardestPeriodLabel: string;
  initialAmount: number;
  purchasePrice: number;
  report: HoldingPainReport;
  series: ShareholderPathPoint[];
  startDate: string;
  summaryIndices: number[];
}

export interface ShareholderActionLog {
  choice: ShareholderDecisionChoice;
  date: string;
  index: number;
  note: string;
  returnPct: number;
  value: number;
}

export interface ShareholderProgressView {
  bestReturnPct: number;
  currentPoint: ShareholderPathPoint;
  message: string;
  messageEyebrow: string;
  messageStat: string;
  pressureScore: number;
  revealedSeries: ShareholderPathPoint[];
  sidewaysMonths: number;
  state: ShareholderPsychologyState;
  summaryLine: string;
  worstReturnPct: number;
}

export interface ShareholderStoredSession {
  actionLog: ShareholderActionLog[];
  decisionIndex: number | null;
  finishedAt: string | null;
  key: string;
  revealedIndex: number;
  savedAt: string;
  seenSummaryIndices: number[];
  soldIndex: number | null;
  stage: ShareholderModeStage;
  summaryIndex: number | null;
  version: number;
}
