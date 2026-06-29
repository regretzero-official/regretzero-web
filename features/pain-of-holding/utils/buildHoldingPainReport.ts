import type { HoldingPainReport, InvestmentInput } from "@/features/pain-of-holding/types";
import { buildValueSeries } from "@/features/pain-of-holding/utils/buildValueSeries";
import { buildWorstMomentCardData } from "@/features/pain-of-holding/utils/buildWorstMomentCardData";
import { calculateCrises } from "@/features/pain-of-holding/utils/calculateCrises";
import { calculateDifficultyScore } from "@/features/pain-of-holding/utils/calculateDifficultyScore";
import { calculateMaxDrawdown } from "@/features/pain-of-holding/utils/calculateMaxDrawdown";
import { calculateRecoveryPeriod } from "@/features/pain-of-holding/utils/calculateRecoveryPeriod";

export function buildHoldingPainReport(input: InvestmentInput): HoldingPainReport {
  const valueSeries = buildValueSeries(input);
  const maxDrawdown = calculateMaxDrawdown(valueSeries);
  const recovery = calculateRecoveryPeriod(valueSeries, maxDrawdown);
  const crises = calculateCrises(valueSeries);
  const difficulty = calculateDifficultyScore(maxDrawdown, recovery, crises);
  const worstMoment = buildWorstMomentCardData(maxDrawdown, recovery);

  if (
    process.env.NODE_ENV !== "production" &&
    crises.crisisCount > 0 &&
    maxDrawdown.maxDrawdownPct > crises.crisisThresholdPct
  ) {
    console.warn("[holding-pain] crisis count and max drawdown are inconsistent", {
      crisisCount: crises.crisisCount,
      crisisThresholdPct: crises.crisisThresholdPct,
      maxDrawdownPct: maxDrawdown.maxDrawdownPct,
    });
  }

  return {
    crises,
    difficulty,
    maxDrawdown,
    recovery,
    valueSeries,
    worstMoment,
  };
}
