import type {
  HistoricalMomentChartPoint,
  HistoricalMomentExperience,
  HistoricalMomentMode,
  HistoricalMomentSnapshot,
  HistoricalMomentViewData,
} from "@/features/historical-moment/types";
import { buildHistoricalMomentMessage } from "@/features/historical-moment/utils/interpretHistoricalMomentMessage";

export const FULL_REVEAL_MIN_MONTHS = 3;

function buildSnapshot(series: HistoricalMomentChartPoint[]): HistoricalMomentSnapshot {
  const currentPoint = series[series.length - 1]!;
  let peakPoint = series[0]!;

  for (const point of series) {
    if (point.value > peakPoint.value) {
      peakPoint = point;
    }
  }

  const drawdownPct = peakPoint.value > 0 ? (currentPoint.value - peakPoint.value) / peakPoint.value : 0;

  return {
    date: currentPoint.date,
    drawdownPct,
    lossAmount: Math.max(0, peakPoint.value - currentPoint.value),
    peakDate: peakPoint.date,
    peakValue: peakPoint.value,
    value: currentPoint.value,
  };
}

export function getHistoricalMomentViewData(
  experience: HistoricalMomentExperience,
  mode: HistoricalMomentMode,
  revealedMonthCount = 0,
): HistoricalMomentViewData {
  if (mode === "revealed") {
    const revealedMessage = buildHistoricalMomentMessage({
      revealedMonthCount: experience.futureSeries.length,
      visibleSeries: experience.fullSeries,
    });

    return {
      canRevealOutcome: false,
      chartSeries: experience.fullSeries,
      currentSnapshot: buildSnapshot(experience.fullSeries),
      enduranceLabel: revealedMessage.enduranceLabel,
      futureOutcome: experience.reveal,
      hasMoreMonths: false,
      helperText: experience.reveal.summary,
      messageBadge: "이후 흐름 공개",
      messageState: revealedMessage.state,
      messageStat: revealedMessage.statLine,
      mode,
      progressLabel: "이후 흐름 공개",
      revealedMonthCount: experience.futureSeries.length,
    };
  }

  const clampedMonthCount = Math.max(0, Math.min(revealedMonthCount, experience.futureSeries.length));
  const visibleFuture = experience.futureSeries.slice(0, clampedMonthCount);
  const chartSeries = [...experience.truncatedSeries, ...visibleFuture];
  const currentSnapshot = buildSnapshot(chartSeries);
  const currentDate = chartSeries[chartSeries.length - 1]?.date ?? experience.momentDate;
  const hasRecovered =
    Boolean(experience.reveal.recoveryDate) &&
    currentDate >= (experience.reveal.recoveryDate as string);
  const message = buildHistoricalMomentMessage({
    revealedMonthCount: clampedMonthCount,
    visibleSeries: chartSeries,
  });
  const canRevealOutcome =
    experience.futureSeries.length > 0 &&
    (hasRecovered ||
      clampedMonthCount >= Math.min(FULL_REVEAL_MIN_MONTHS, experience.futureSeries.length) ||
      clampedMonthCount >= experience.futureSeries.length);

  return {
    canRevealOutcome,
    chartSeries,
    currentSnapshot,
    enduranceLabel: message.enduranceLabel,
    futureOutcome: null,
    hasMoreMonths: clampedMonthCount < experience.futureSeries.length,
    helperText: message.message,
    messageBadge: message.badge,
    messageState: message.state,
    messageStat: message.statLine,
    mode,
    progressLabel: message.progressLabel,
    revealedMonthCount: clampedMonthCount,
  };
}
