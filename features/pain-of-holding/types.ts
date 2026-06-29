export interface PricePoint {
  date: string;
  price: number;
}

export interface InvestmentInput {
  initialAmount: number;
  priceSeries: PricePoint[];
}

export interface ValuePoint extends PricePoint {
  drawdownPct: number;
  peakIndex: number;
  peakValue: number;
  shares: number;
  value: number;
}

export interface MaxDrawdownResult {
  maxDrawdownPct: number;
  peakDate: string;
  peakIndex: number;
  peakValue: number;
  troughDate: string;
  troughIndex: number;
  troughValue: number;
}

export interface RecoveryResult {
  recovered: boolean;
  recoveryDate: string | null;
  recoveryDays: number | null;
  recoveryIndex: number | null;
  recoveryMonths: number | null;
}

export interface CrisisRange {
  endDate: string | null;
  endIndex: number | null;
  maxDrawdownPct: number;
  recoveredToNearHigh: boolean;
  startDate: string;
  startIndex: number;
  troughDate: string;
  troughIndex: number;
}

export interface CrisisResult {
  crisisThresholdPct: number;
  crises: CrisisRange[];
  crisisCount: number;
  recoveryThresholdPct: number;
}

export type DifficultyLabel = "쉬움" | "보통" | "어려움" | "매우 어려움" | "극한";

export interface DifficultyResult {
  crisisScore: number;
  explanation: string;
  label: DifficultyLabel;
  mddScore: number;
  recoveryScore: number;
  score: number;
}

export interface WorstMomentCardData {
  date: string;
  drawdownPct: number;
  lossAmount: number;
  peakValue: number;
  recoveryText: string;
  troughValue: number;
}

export interface HoldingPainReport {
  crises: CrisisResult;
  difficulty: DifficultyResult;
  maxDrawdown: MaxDrawdownResult;
  recovery: RecoveryResult;
  valueSeries: ValuePoint[];
  worstMoment: WorstMomentCardData;
}
