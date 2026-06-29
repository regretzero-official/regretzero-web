import type { HoldingPainReport } from "@/features/pain-of-holding";
import type {
  HistoricalMomentChartPoint,
  HistoricalMomentExperience,
} from "@/features/historical-moment/types";

function formatYearMonth(date: string) {
  const [year, month] = date.split("-");
  return `${year}년 ${month}월`;
}

function getApproxMonthsBetween(startDate: string, endDate: string) {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    return 0;
  }

  return Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24 * 30.44)));
}

function formatIsoDate(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function addMonths(date: string, monthOffset: number) {
  const value = new Date(`${date}T00:00:00`);
  value.setMonth(value.getMonth() + monthOffset);
  return formatIsoDate(value);
}

function buildMonthlyFutureSeries(fullSeries: HistoricalMomentChartPoint[], momentIndex: number) {
  const futureSeries = fullSeries.slice(momentIndex + 1);

  if (!futureSeries.length) {
    return [] as HistoricalMomentChartPoint[];
  }

  const selected: HistoricalMomentChartPoint[] = [];
  let lastSelectedDate = fullSeries[momentIndex]!.date;
  let monthOffset = 1;

  while (lastSelectedDate < futureSeries[futureSeries.length - 1]!.date) {
    const targetDate = addMonths(fullSeries[momentIndex]!.date, monthOffset);
    const checkpoint = futureSeries
      .filter((point) => point.date > lastSelectedDate && point.date <= targetDate)
      .at(-1);

    if (!checkpoint) {
      if (targetDate >= futureSeries[futureSeries.length - 1]!.date) {
        break;
      }

      monthOffset += 1;
      continue;
    }

    selected.push(checkpoint);
    lastSelectedDate = checkpoint.date;
    monthOffset += 1;
  }

  const finalPoint = futureSeries[futureSeries.length - 1]!;
  if (selected.at(-1)?.date !== finalPoint.date) {
    selected.push(finalPoint);
  }

  return selected;
}

function buildRevealSummary(report: HoldingPainReport, finalPoint: HistoricalMomentChartPoint) {
  const unrecoveredLines = [
    "이후 흐름까지 열어보면, 그 시점의 손실은 끝내 전부 지워지지 않았어요.",
    "버틴 시간이 길어져도, 이전 고점이 다시 열리지 않는 경우도 있었어요.",
    "시간이 더 흘렀지만 당시의 하락은 완전히 회복되지 않았어요.",
    "이후 구간을 모두 봐도 전고점은 끝내 다시 보이지 않았어요.",
    "가장 힘들었던 순간을 지나도, 결과가 항상 회복으로 이어지진 않았어요.",
    "기다림이 길어져도 이전 고점을 다시 넘지 못한 채 마무리된 흐름이에요.",
  ];
  const recoveredQuicklyLines = [
    `생각보다 빠르게 흐름이 돌아섰고, ${formatYearMonth(finalPoint.date)}에는 더 높은 구간에 닿았어요.`,
    `그 뒤 회복은 예상보다 빨랐어요. ${formatYearMonth(finalPoint.date)}에는 이미 낙폭을 지운 상태였어요.`,
    `당시엔 보이지 않았지만, 이후 흐름은 빠르게 전고점을 되찾는 쪽으로 움직였어요.`,
    `한동안의 불확실성은 길지 않았고, 이후에는 다시 이전 고점을 넘어섰어요.`,
    `그 시점 이후 흐름은 비교적 빠르게 돌아섰고, ${formatYearMonth(finalPoint.date)}에는 더 위에 있었어요.`,
    `짧은 기다림 뒤에 전고점이 다시 열렸고, 이후 구간은 더 높은 레벨로 이어졌어요.`,
  ];
  const recoveredLines = [
    `바로 답이 보이진 않았지만, ${report.recovery.recoveryMonths}개월 뒤 전고점을 다시 회복했어요.`,
    `회복까지는 시간이 더 필요했어요. 그래도 ${report.recovery.recoveryMonths}개월 뒤에는 이전 고점이 다시 열렸어요.`,
    `당시엔 멀어 보였지만, 시간이 지나며 결국 ${report.recovery.recoveryMonths}개월 뒤 전고점을 되찾았어요.`,
    `하락 직후에는 알 수 없었지만, 이후 흐름은 ${report.recovery.recoveryMonths}개월 동안 버틴 끝에 회복으로 이어졌어요.`,
    `반등은 한 번에 오지 않았어요. 그래도 ${report.recovery.recoveryMonths}개월 뒤에는 이전 고점을 회복했어요.`,
    `가장 힘들었던 시점을 지나고도 시간이 더 필요했지만, 결국 ${report.recovery.recoveryMonths}개월 뒤에는 회복이 확인됐어요.`,
  ];

  if (!report.recovery.recovered) {
    return unrecoveredLines[Math.abs(finalPoint.index) % unrecoveredLines.length]!;
  }

  if ((report.recovery.recoveryMonths ?? 0) < 1) {
    return recoveredQuicklyLines[Math.abs(finalPoint.index) % recoveredQuicklyLines.length]!;
  }

  return recoveredLines[
    Math.abs((report.recovery.recoveryMonths ?? 0) + finalPoint.index) % recoveredLines.length
  ]!;
}

export function buildHistoricalMomentExperience(input: {
  assetId: string;
  assetLabel: string;
  initialAmount: number;
  report: HoldingPainReport;
}): HistoricalMomentExperience {
  const { assetId, assetLabel, initialAmount, report } = input;
  const fullSeries = report.valueSeries.map<HistoricalMomentChartPoint>((point, index) => ({
    date: point.date,
    index,
    label: point.date.replace(/-/g, "."),
    multiple: point.value / initialAmount,
    value: point.value,
  }));

  const momentIndex = Math.min(report.maxDrawdown.troughIndex, fullSeries.length - 1);
  const finalPoint = fullSeries.at(-1);

  if (!fullSeries.length || !finalPoint) {
    throw new Error("가장 힘들었던 순간 체험에 필요한 시계열 데이터가 부족합니다.");
  }

  return {
    assetId,
    assetLabel,
    drawdownPct: report.worstMoment.drawdownPct,
    fullSeries,
    futureSeries: buildMonthlyFutureSeries(fullSeries, momentIndex),
    initialAmount,
    lossAmount: report.worstMoment.lossAmount,
    momentDate: report.worstMoment.date,
    momentValue: report.worstMoment.troughValue,
    monthsSincePeak: getApproxMonthsBetween(report.maxDrawdown.peakDate, report.worstMoment.date),
    peakDate: report.maxDrawdown.peakDate,
    peakValue: report.worstMoment.peakValue,
    report,
    reveal: {
      finalDate: finalPoint.date,
      finalValue: finalPoint.value,
      recovered: report.recovery.recovered,
      recoveryDate: report.recovery.recoveryDate,
      recoveryMonths: report.recovery.recoveryMonths,
      summary: buildRevealSummary(report, finalPoint),
    },
    truncatedSeries: fullSeries.slice(0, momentIndex + 1),
  };
}
