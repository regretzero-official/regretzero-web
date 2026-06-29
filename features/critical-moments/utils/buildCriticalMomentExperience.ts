import type { HoldingPainReport, ValuePoint } from "@/features/pain-of-holding";
import type {
  CriticalMoment,
  CriticalMomentChartPoint,
  CriticalMomentExperience,
  CriticalMomentTeaser,
  CriticalMomentType,
  FundamentalState,
} from "@/features/critical-moments/types";
import type { AssetOption } from "@/lib/home-content";
import { formatKrwCompact, formatPercent } from "@/lib/race-engine";

interface BuildCriticalMomentExperienceInput {
  asset: AssetOption;
  initialAmount: number;
  report: HoldingPainReport;
}

interface MomentContext {
  futureMaxIndexByIndex: number[];
  futureMaxValueByIndex: number[];
  previousWorstDrawdownByIndex: number[];
}

interface CandidateMoment {
  index: number;
  type: CriticalMomentType;
}

interface MomentOutcome {
  gainContributionPct: number;
  postMomentGainPct: number;
  recoveryMonths: number | null;
}

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const DAYS_PER_MONTH = 30.44;
const MIN_MOMENT_GAP_DAYS = 120;

function formatMonthYear(date: string) {
  const [year, month] = date.split("-");
  return `${year}년 ${Number(month)}월`;
}

function getDayDiff(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00`).getTime();
  const end = new Date(`${endDate}T00:00:00`).getTime();
  return Math.max(0, Math.round((end - start) / DAY_IN_MS));
}

function getMonthDiff(startDate: string, endDate: string) {
  return Math.max(0, Math.round(getDayDiff(startDate, endDate) / DAYS_PER_MONTH));
}

function formatMonthSpan(months: number | null) {
  if (months === null) {
    return "미회복";
  }

  const safeMonths = Math.max(0, Math.round(months));
  const years = Math.floor(safeMonths / 12);
  const remainingMonths = safeMonths % 12;

  if (years > 0 && remainingMonths > 0) {
    return `${years}년 ${remainingMonths}개월`;
  }

  if (years > 0) {
    return `${years}년`;
  }

  return `${safeMonths}개월`;
}

function getCategoryTone(asset: AssetOption) {
  if (asset.category === "부동산") {
    return "real-estate";
  }

  if (asset.category === "코인") {
    return "coin";
  }

  if (asset.id === "deposit" || asset.id === "gold" || asset.id === "usd") {
    return "safe";
  }

  return "equity";
}

function buildChartSeries(series: ValuePoint[]): CriticalMomentChartPoint[] {
  return series.map((point, index) => ({
    date: point.date,
    drawdownPct: point.drawdownPct * 100,
    index,
    label: formatMonthYear(point.date),
    monthsSinceEntry: getMonthDiff(series[0]!.date, point.date),
    price: point.price,
    value: point.value,
  }));
}

function buildMomentContext(series: ValuePoint[]): MomentContext {
  const futureMaxIndexByIndex = new Array<number>(series.length);
  const futureMaxValueByIndex = new Array<number>(series.length);
  const previousWorstDrawdownByIndex = new Array<number>(series.length);

  let runningFutureMaxValue = Number.NEGATIVE_INFINITY;
  let runningFutureMaxIndex = series.length - 1;

  for (let index = series.length - 1; index >= 0; index -= 1) {
    const point = series[index]!;

    if (point.value >= runningFutureMaxValue) {
      runningFutureMaxValue = point.value;
      runningFutureMaxIndex = index;
    }

    futureMaxValueByIndex[index] = runningFutureMaxValue;
    futureMaxIndexByIndex[index] = runningFutureMaxIndex;
  }

  let runningWorstDrawdown = 0;

  for (let index = 0; index < series.length; index += 1) {
    const point = series[index]!;

    if (point.drawdownPct <= runningWorstDrawdown) {
      runningWorstDrawdown = point.drawdownPct;
    }

    previousWorstDrawdownByIndex[index] = runningWorstDrawdown;
  }

  return {
    futureMaxIndexByIndex,
    futureMaxValueByIndex,
    previousWorstDrawdownByIndex,
  };
}

function isDateFarEnough(
  series: ValuePoint[],
  targetIndex: number,
  usedIndices: number[],
  minGapDays = MIN_MOMENT_GAP_DAYS,
) {
  return usedIndices.every((usedIndex) => {
    const days = getDayDiff(series[usedIndex]!.date, series[targetIndex]!.date);
    return days >= minGapDays;
  });
}

function getReturnPct(point: ValuePoint, initialAmount: number) {
  return initialAmount > 0 ? (point.value / initialAmount - 1) * 100 : 0;
}

function getRecoveryMonthsAfterPoint(series: ValuePoint[], pointIndex: number) {
  const point = series[pointIndex]!;

  if (point.drawdownPct >= -0.005) {
    return 0;
  }

  for (let index = pointIndex + 1; index < series.length; index += 1) {
    if (series[index]!.value >= point.peakValue) {
      return getMonthDiff(point.date, series[index]!.date);
    }
  }

  return null;
}

function getMomentLabel(type: CriticalMomentType, point: ValuePoint) {
  if (type === "maximum_drawdown") {
    return point.drawdownPct <= -0.08 ? "최대 낙폭 고비" : "답답함 고비";
  }

  if (type === "longest_stagnation") {
    return "최장 횡보 고비";
  }

  if (type === "recovery_uncertainty") {
    return "회복 불확실성 고비";
  }

  return "수익 확정 유혹 고비";
}

function getReactionBlockTitle(asset: AssetOption) {
  if (
    asset.category === "미국ETF" ||
    asset.category === "미국주식" ||
    asset.category === "코인"
  ) {
    return "당시 월가의 반응";
  }

  return "당시 전문가의 반응";
}

function buildMarketAtmosphere(asset: AssetOption, type: CriticalMomentType) {
  const tone = getCategoryTone(asset);

  const copy: Record<string, Record<CriticalMomentType, string>> = {
    coin: {
      longest_stagnation:
        "시장은 반등보다 추가 이탈 가능성을 더 크게 의식했고, 확신보다 관망이 먼저 나오는 분위기에 가까웠습니다.",
      maximum_drawdown:
        "공포가 가격보다 더 빠르게 번지며 손절과 이탈이 겹치기 쉬운 시기였습니다.",
      profit_protection:
        "수익이 다시 보이기 시작했지만, 더 갈 가능성보다 다시 밀릴 위험을 먼저 떠올리기 쉬운 분위기였습니다.",
      recovery_uncertainty:
        "반등은 시작됐지만 신뢰는 아직 돌아오지 않았고, 시장 해석은 희망보다 의심에 더 가까웠습니다.",
    },
    equity: {
      longest_stagnation:
        "추가 상승보다 실망이 더 길어질 수 있다는 해석이 우세했고, 매수보다 관망이 더 자연스럽게 느껴지던 구간이었습니다.",
      maximum_drawdown:
        "하락의 크기만큼이나 심리가 무너지는 속도도 빨랐고, 반등보다 추가 악재 가능성이 더 크게 읽히기 쉬웠습니다.",
      profit_protection:
        "큰 수익이 다시 보이자 이번엔 챙기고 싶다는 심리가 커지기 쉬웠고, 더 갈 수도 있다는 기대보다 재차 조정을 먼저 걱정하기 쉬웠습니다.",
      recovery_uncertainty:
        "가격은 반등했지만 확신은 가장 늦게 돌아오고, 시장은 아직 진짜 회복보다 일시 반등에 더 가까운 시선을 보내던 구간이었습니다.",
    },
    "real-estate": {
      longest_stagnation:
        "거래보다 관망이 길어지며 회복의 체감이 잘 오지 않았고, 가격보다 심리와 유동성이 먼저 얼어붙기 쉬운 시기였습니다.",
      maximum_drawdown:
        "가격 하락보다 시장 분위기가 얼어붙었다는 체감이 더 크게 남기 쉬웠고, 바닥보다 추가 조정을 걱정하는 해석이 우세했을 가능성이 큽니다.",
      profit_protection:
        "가격이 다시 올라와도 이번엔 정리해야 하나라는 생각이 강해지기 쉬웠고, 회복을 반기면서도 다시 꺾일 가능성을 함께 의식하게 되는 시점이었습니다.",
      recovery_uncertainty:
        "반등의 신호가 보여도 거래와 심리가 함께 살아나는지는 여전히 불확실했고, 시장에서는 잠깐의 반등으로 보는 시선도 적지 않았을 수 있습니다.",
    },
    safe: {
      longest_stagnation:
        "큰 하락은 없었지만 체감상으론 답답함과 기회비용이 더 크게 느껴질 수 있었고, 오래 들고 가는 이유가 흔들리기 쉬운 구간이었습니다.",
      maximum_drawdown:
        "공포보다는 기대를 낮춰야 하는 답답함이 더 크게 느껴질 수 있었고, 계속 들고 가야 할 이유를 다시 묻게 되는 시점이었습니다.",
      profit_protection:
        "수익이 다시 보여도 더 큰 업사이드를 기대하기보다 지금 멈추고 싶어질 수 있는 구간이었습니다.",
      recovery_uncertainty:
        "움직임은 살아났지만 추세라고 부르기엔 아직 조심스러웠고, 안정감은 있지만 강한 확신까지 이어지지는 않는 흐름에 가까웠습니다.",
    },
  };

  return copy[tone][type];
}

function buildBadNewsPoints(asset: AssetOption, type: CriticalMomentType) {
  const tone = getCategoryTone(asset);

  const copy: Record<string, Record<CriticalMomentType, string[]>> = {
    coin: {
      longest_stagnation: ["거래 감소 우려 확대", "규제 리스크 재부각", "추가 이탈 가능성 언급"],
      maximum_drawdown: ["강제 청산 확대", "추가 급락 가능성 우세", "회복 시점 불확실"],
      profit_protection: ["반등 이후 재차 조정 우려", "고점 회귀 실패 가능성", "변동성 재확대 경계"],
      recovery_uncertainty: ["일시 반등 해석", "거래대금 회복 미약", "확신 부족 구간"],
    },
    equity: {
      longest_stagnation: ["실적 둔화 우려", "수요 회복 지연 전망", "성장 기대 재조정"],
      maximum_drawdown: ["추가 하락 가능성 우세", "성장 둔화 우려 확대", "밸류에이션 부담 재부각"],
      profit_protection: ["수익 실현 매물 우려", "재차 조정 가능성", "이번엔 챙겨야 한다는 심리"],
      recovery_uncertainty: ["반등 신뢰 부족", "실적 확인 전 관망 우세", "추세 전환 의심"],
    },
    "real-estate": {
      longest_stagnation: ["거래 위축 우려", "매수 심리 냉각", "금리 부담 장기화"],
      maximum_drawdown: ["추가 하락 전망", "유동성 위축 우려", "거래 절벽 해석"],
      profit_protection: ["회복 이후 재조정 우려", "정리 매물 증가 가능성", "상승 지속성 의문"],
      recovery_uncertainty: ["반등 지속성 의문", "거래량 회복 미약", "관망 우세 분위기"],
    },
    safe: {
      longest_stagnation: ["기회비용 확대", "상대 수익률 아쉬움", "체감 매력 약화"],
      maximum_drawdown: ["기대수익 둔화", "매력 약화 해석", "보유 이유 재점검"],
      profit_protection: ["여기서 멈출 유혹", "추가 상승 의문", "상대 성과 부담"],
      recovery_uncertainty: ["추세 전환 미확인", "관성 약화 우려", "확신 부족 흐름"],
    },
  };

  return copy[tone][type];
}

function buildWallStreetReactionPoints(asset: AssetOption, type: CriticalMomentType) {
  const tone = getCategoryTone(asset);

  const copy: Record<string, Record<CriticalMomentType, string[]>> = {
    coin: {
      longest_stagnation: ["보수적 시각 우세", "추가 하락 가능성 경고", "위험 관리 강조"],
      maximum_drawdown: ["낙관론 후퇴", "리스크 관리 우선", "단기 반등보다 추가 충격 경계"],
      profit_protection: ["반등 신뢰 부족", "고점 회귀 확신 부족", "성과 방어 우선 시각"],
      recovery_uncertainty: ["일시 반등 가능성 언급", "추세 전환 유보", "보수적 접근 유지"],
    },
    equity: {
      longest_stagnation: ["목표가 하향", "성장성 재평가 요구", "보수적 시각 우세"],
      maximum_drawdown: ["추가 하락 가능성 경고", "실적 추정 하향 조정", "리스크 프리미엄 확대"],
      profit_protection: ["이익 실현 권고 강화", "재차 하락 가능성 점검", "상승 지속성 검증 요구"],
      recovery_uncertainty: ["추세 전환 확인 필요", "반등 신뢰 보류", "보수적 접근 유지"],
    },
    "real-estate": {
      longest_stagnation: ["보수적 전망 우세", "거래 회복 확인 필요", "가격 반등 지속성 의문"],
      maximum_drawdown: ["추가 조정 가능성 언급", "유동성 회복 지연 전망", "관망 기조 우세"],
      profit_protection: ["정리 수요 증가 가능성", "상승 지속성 확인 필요", "보수적 전망 유지"],
      recovery_uncertainty: ["반등 지속성 유보", "관망 우세", "실수요 회복 확인 필요"],
    },
    safe: {
      longest_stagnation: ["상대 매력 재점검", "기회비용 우려", "성과 기대 보수화"],
      maximum_drawdown: ["매력 약화 해석", "대기 전략 선호", "리스크 대비 수익 재평가"],
      profit_protection: ["여기서 충분하다는 시각", "추가 상승 확신 부족", "방어적 해석 우세"],
      recovery_uncertainty: ["확인 후 접근 권고", "추세 판단 유보", "보수적 해석 유지"],
    },
  };

  return copy[tone][type];
}

function buildFundamentalState(
  asset: AssetOption,
  series: ValuePoint[],
  pointIndex: number,
  context: MomentContext,
): { label: string; state: FundamentalState; summary: string } {
  const point = series[pointIndex]!;
  const futureMaxValue = context.futureMaxValueByIndex[pointIndex]!;
  const futureUpsidePct = point.value > 0 ? (futureMaxValue / point.value - 1) * 100 : 0;
  const recoveredLater = futureMaxValue >= point.peakValue * 0.98;
  const tone = getCategoryTone(asset);

  if (recoveredLater && futureUpsidePct >= 18) {
    if (tone === "real-estate") {
      return {
        label: "유지됨",
        state: "intact",
        summary:
          "가격의 흔들림은 컸지만 장기 시장 흐름 자체가 완전히 꺾였다고 보기엔 아직 이른 구간이었습니다.",
      };
    }

    if (tone === "safe") {
      return {
        label: "유지됨",
        state: "intact",
        summary:
          "단기 매력은 약해졌어도, 이 자산이 맡는 역할과 논리 자체가 무너졌다고 보기 어려운 구간이었습니다.",
      };
    }

    return {
      label: "유지됨",
      state: "intact",
      summary:
        "주가 하락은 컸지만 장기 투자 논리를 깨는 구조적 손상이 아직 명확했다고 보긴 어려운 시점이었습니다.",
    };
  }

  if (futureUpsidePct >= 6) {
    return {
      label: "일부 흔들림",
      state: "shaken",
      summary:
        "단기 기대와 실적에 대한 의문은 커졌지만, 핵심 투자 논리가 완전히 무너졌다고 보기는 어려운 구간이었습니다.",
    };
  }

  return {
    label: "훼손 신호 있음",
    state: "broken_signals",
    summary:
      "이 시점은 단순 공포를 넘어, 투자 논리 자체를 다시 점검해야 하는 신호가 일부 나타났던 구간에 가까웠습니다.",
  };
}

function buildLessonLines(type: CriticalMomentType) {
  if (type === "maximum_drawdown") {
    return [
      "주가의 공포와 투자 논리의 훼손은 같은 것이 아닙니다.",
      "가장 비관적인 순간이 항상 끝은 아닙니다.",
    ];
  }

  if (type === "longest_stagnation") {
    return [
      "장기투자를 어렵게 만드는 것은 급락보다 끝이 보이지 않는 시간일 수 있습니다.",
      "좋은 자산의 장기수익률은 종종 가장 지루하고 답답한 시간을 지난 뒤에 만들어집니다.",
    ];
  }

  if (type === "recovery_uncertainty") {
    return [
      "반등이 시작돼도 확신은 가장 늦게 돌아옵니다.",
      "버티는 기준은 차트의 공포가 아니라 펀더멘탈입니다.",
    ];
  }

  return [
    "많은 투자자는 공포 속에서만이 아니라, 안도감이 돌아왔을 때도 너무 일찍 떠납니다.",
    "장기수익의 큰 부분은 수익을 지키고 싶어질 때 이후에 만들어지기도 합니다.",
  ];
}

function buildMomentOutcome(
  series: ValuePoint[],
  pointIndex: number,
  context: MomentContext,
  initialAmount: number,
): MomentOutcome {
  const point = series[pointIndex]!;
  const finalPoint = series[series.length - 1]!;
  const futureMaxPoint = series[context.futureMaxIndexByIndex[pointIndex]!]!;
  const recoveryMonths = getRecoveryMonthsAfterPoint(series, pointIndex);
  const postMomentGainPct = point.value > 0 ? (finalPoint.value / point.value - 1) * 100 : 0;
  const totalGain = finalPoint.value - initialAmount;
  const gainAfterMoment = finalPoint.value - point.value;
  const gainContributionPct =
    totalGain > 0 ? Math.max(0, Math.round((gainAfterMoment / totalGain) * 100)) : 0;

  return {
    gainContributionPct,
    postMomentGainPct:
      point.value > 0 ? Math.max(postMomentGainPct, (futureMaxPoint.value / point.value - 1) * 100) : 0,
    recoveryMonths,
  };
}

function buildCardDescription(
  type: CriticalMomentType,
  point: ValuePoint,
  initialAmount: number,
  waitingMonths: number,
) {
  if (type === "maximum_drawdown") {
    if (point.drawdownPct <= -0.12) {
      return "큰 하락 이후에도 회복의 신호가 약해, 많은 투자자가 끝이 안 보인다고 느끼기 쉬운 시기였습니다.";
    }

    return "크게 무너지진 않았지만 체감상 기다림이 길고 확신이 약해지기 쉬운 구간이었습니다.";
  }

  if (type === "longest_stagnation") {
    return "급락보다도, 오래 이어지는 답답함과 무기력이 더 크게 느껴질 수 있는 구간이었습니다.";
  }

  if (type === "recovery_uncertainty") {
    return "반등처럼 보였지만 아직 확신하기 어려워, 다시 꺾일까 걱정되기 쉬운 시점이었습니다.";
  }

  const currentReturnPct = getReturnPct(point, initialAmount);

  if (currentReturnPct >= 30) {
    return "큰 수익을 경험한 뒤, 다시 하락이 올까 봐 이익을 확정하고 떠나고 싶어지기 쉬운 시점입니다.";
  }

  if (waitingMonths >= 12) {
    return "오래 기다린 끝에 다시 기회가 온 듯 보이면, 버티기보다 정리를 먼저 떠올리기 쉬워집니다.";
  }

  return "회복이 보이기 시작할수록 오히려 너무 일찍 내리고 싶어질 수 있는 구간이었습니다.";
}

function buildWhyItWasHard(type: CriticalMomentType, waitingMonths: number) {
  if (type === "maximum_drawdown") {
    return "이 시점은 단순한 하락보다, 회복의 끝이 보이지 않는 불확실성이 더 크게 느껴지던 구간이었습니다.";
  }

  if (type === "longest_stagnation") {
    return "하락보다 더 버티기 어려운 것은 움직이지 않는 시간일 수 있습니다. 이 구간은 바로 그 피로가 누적되던 시점에 가깝습니다.";
  }

  if (type === "recovery_uncertainty") {
    return "반등의 숫자보다 '이번에도 속는 것 아닐까'라는 의심이 더 크게 작동하기 쉬운 구간이었습니다.";
  }

  if (waitingMonths >= 12) {
    return "오래 기다린 뒤 수익이 다시 보이면, 더 큰 상승보다 이번에는 챙기고 싶다는 심리가 먼저 커질 수 있습니다.";
  }

  return "회복이 보일수록 욕심보다 안도감이 먼저 작동해, 너무 일찍 정리하고 싶어질 수 있는 시점이었습니다.";
}

function buildMetricCards(series: ValuePoint[], pointIndex: number, initialAmount: number) {
  const point = series[pointIndex]!;
  const waitingMonths = getMonthDiff(series[point.peakIndex]!.date, point.date);

  return [
    {
      label: "시점",
      value: formatMonthYear(point.date),
    },
    {
      label: "당시 가격",
      value: formatKrwCompact(point.price),
    },
    {
      label: "전고점 대비",
      value: formatPercent(point.drawdownPct * 100),
    },
    {
      label: "진입 후",
      value: `${getMonthDiff(series[0]!.date, point.date)}개월`,
    },
    {
      label: "회복 없는 기간",
      value: waitingMonths > 0 ? formatMonthSpan(waitingMonths) : "거의 없음",
    },
    {
      label: "회복에 필요한 상승률",
      value:
        point.value > 0 && point.drawdownPct < 0
          ? formatPercent((point.peakValue / point.value - 1) * 100)
          : "+0.0%",
    },
    {
      label: "현재 수익률",
      value: formatPercent(getReturnPct(point, initialAmount)),
    },
  ];
}

function buildAfterMath(
  asset: AssetOption,
  series: ValuePoint[],
  pointIndex: number,
  context: MomentContext,
  initialAmount: number,
) {
  const finalPoint = series[series.length - 1]!;
  const outcome = buildMomentOutcome(series, pointIndex, context, initialAmount);

  const lines: string[] = [];

  if (outcome.recoveryMonths === null) {
    lines.push("이 고비 이후에도 이전 고점을 완전히 회복하지 못한 채 구간이 끝났습니다.");
  } else if (outcome.recoveryMonths === 0) {
    lines.push("이 시점은 이미 회복 직전이거나 사실상 회복이 시작된 구간에 가까웠습니다.");
  } else {
    lines.push(`이 고비 이후 전고점 회복까지 ${formatMonthSpan(outcome.recoveryMonths)}이 걸렸습니다.`);
  }

  if (outcome.postMomentGainPct >= 15) {
    lines.push(`이후의 추가 상승률은 ${formatPercent(outcome.postMomentGainPct)}였습니다.`);
  } else if (outcome.postMomentGainPct > 0) {
    lines.push("회복은 더뎠지만, 이 시점이 장기 흐름의 끝은 아니었습니다.");
  } else {
    lines.push("이 구간 이후의 흐름은 제한적이어서, 단순한 공포가 아닌 점검도 필요했던 시기였습니다.");
  }

  if (outcome.gainContributionPct > 0) {
    lines.push(`전체 10년 수익의 약 ${outcome.gainContributionPct}%는 이 고비 이후에 만들어졌습니다.`);
  } else if (asset.category === "부동산") {
    lines.push("부동산 자산도 가장 비관적인 국면 뒤에 장기 흐름이 다시 이어지는 경우가 적지 않습니다.");
  }

  const stats = [
    {
      label: "전고점 회복까지",
      value: formatMonthSpan(outcome.recoveryMonths),
    },
    {
      label: "이후 추가 상승률",
      value: formatPercent(outcome.postMomentGainPct),
    },
    {
      label: "10년 수익 기여",
      value:
        outcome.gainContributionPct > 0
          ? `${outcome.gainContributionPct}%`
          : finalPoint.value > initialAmount
            ? "제한적"
            : "없음",
    },
  ];

  return {
    lines,
    outcome,
    stats,
  };
}

function buildMoment(
  asset: AssetOption,
  initialAmount: number,
  report: HoldingPainReport,
  context: MomentContext,
  candidate: CandidateMoment,
): CriticalMoment {
  const point = report.valueSeries[candidate.index]!;
  const waitingMonths = getMonthDiff(report.valueSeries[point.peakIndex]!.date, point.date);
  const afterMath = buildAfterMath(asset, report.valueSeries, candidate.index, context, initialAmount);

  return {
    afterMathLines: afterMath.lines,
    afterMathStats: afterMath.stats,
    atmosphereSummary: buildMarketAtmosphere(asset, candidate.type),
    badNewsPoints: buildBadNewsPoints(asset, candidate.type),
    cardDescription: buildCardDescription(candidate.type, point, initialAmount, waitingMonths),
    currentReturnPct: getReturnPct(point, initialAmount),
    date: point.date,
    dateLabel: formatMonthYear(point.date),
    drawdownPct: point.drawdownPct * 100,
    expertReactionTitle: getReactionBlockTitle(asset),
    fundamentals: buildFundamentalState(asset, report.valueSeries, candidate.index, context),
    id: `${asset.id}:${candidate.type}:${point.date}`,
    lessonLines: buildLessonLines(candidate.type),
    marketPriceLabel: formatKrwCompact(point.price),
    metricCards: buildMetricCards(report.valueSeries, candidate.index, initialAmount),
    momentIndex: candidate.index,
    monthsSinceEntry: getMonthDiff(report.valueSeries[0]!.date, point.date),
    recoveryGainNeededPct:
      point.value > 0 && point.drawdownPct < 0 ? (point.peakValue / point.value - 1) * 100 : 0,
    reflectionQuestion: "당신이라면 미래에 이런 순간이 와도 버틸 수 있을까요?",
    shortLabel: getMomentLabel(candidate.type, point),
    type: candidate.type,
    waitingMonths,
    wallStreetReactionPoints: buildWallStreetReactionPoints(asset, candidate.type),
    whyItWasHard: buildWhyItWasHard(candidate.type, waitingMonths),
  };
}

function selectMaximumDrawdownMoment(report: HoldingPainReport): CandidateMoment {
  return {
    index: report.maxDrawdown.troughIndex,
    type: "maximum_drawdown",
  };
}

function selectLongestStagnationMoment(series: ValuePoint[], usedIndices: number[]) {
  let bestIndex = -1;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (let index = 20; index < series.length; index += 1) {
    if (!isDateFarEnough(series, index, usedIndices)) {
      continue;
    }

    const point = series[index]!;
    const waitingMonths = getMonthDiff(series[point.peakIndex]!.date, point.date);

    if (waitingMonths < 6) {
      continue;
    }

    const score = waitingMonths * 2 + Math.abs(point.drawdownPct * 100);

    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  }

  return bestIndex >= 0 ? ({ index: bestIndex, type: "longest_stagnation" as const }) : null;
}

function getDynamicSearchWindow(series: ValuePoint[]) {
  const leadingBuffer = Math.max(6, Math.min(30, Math.floor(series.length * 0.18)));
  const trailingBuffer = Math.max(4, Math.min(18, Math.floor(series.length * 0.15)));
  const startIndex = Math.min(Math.max(1, leadingBuffer), Math.max(1, series.length - 2));
  const endIndex = Math.max(startIndex + 1, series.length - trailingBuffer);

  return {
    endIndex,
    startIndex,
  };
}

function selectRecoveryUncertaintyMoment(
  series: ValuePoint[],
  context: MomentContext,
  usedIndices: number[],
) {
  let bestIndex = -1;
  let bestScore = Number.NEGATIVE_INFINITY;
  const { endIndex, startIndex } = getDynamicSearchWindow(series);

  for (let index = startIndex; index < endIndex; index += 1) {
    if (!isDateFarEnough(series, index, usedIndices)) {
      continue;
    }

    const point = series[index]!;
    const previousPoint = series[Math.max(0, index - 6)]!;
    const reboundPct = previousPoint.value > 0 ? (point.value / previousPoint.value - 1) * 100 : 0;
    const futureUpsidePct =
      point.value > 0 ? (context.futureMaxValueByIndex[index]! / point.value - 1) * 100 : 0;

    if (reboundPct < 6 || point.drawdownPct > -0.05 || point.drawdownPct < -0.45) {
      continue;
    }

    if (futureUpsidePct < 8) {
      continue;
    }

    const score =
      reboundPct + Math.abs(point.drawdownPct * 100) * 0.45 + getMonthDiff(series[point.peakIndex]!.date, point.date);

    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  }

  return bestIndex >= 0 ? ({ index: bestIndex, type: "recovery_uncertainty" as const }) : null;
}

function selectProfitProtectionMoment(
  series: ValuePoint[],
  context: MomentContext,
  initialAmount: number,
  usedIndices: number[],
) {
  let bestIndex = -1;
  let bestScore = Number.NEGATIVE_INFINITY;
  const window = getDynamicSearchWindow(series);
  const startIndex = Math.max(window.startIndex, 10);

  for (let index = startIndex; index < window.endIndex; index += 1) {
    if (!isDateFarEnough(series, index, usedIndices)) {
      continue;
    }

    const point = series[index]!;
    const currentReturnPct = getReturnPct(point, initialAmount);
    const futureUpsidePct =
      point.value > 0 ? (context.futureMaxValueByIndex[index]! / point.value - 1) * 100 : 0;
    const priorWorstDrawdownPct = context.previousWorstDrawdownByIndex[index]! * 100;
    const nearHighAgain = point.drawdownPct >= -0.12 && point.drawdownPct <= -0.01;

    if (currentReturnPct < 18 || futureUpsidePct < 12 || priorWorstDrawdownPct > -10) {
      continue;
    }

    if (!nearHighAgain && !(point.drawdownPct >= -0.03 && currentReturnPct >= 30)) {
      continue;
    }

    const score =
      futureUpsidePct * 1.2 +
      currentReturnPct * 0.4 +
      Math.abs(priorWorstDrawdownPct) * 0.6;

    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  }

  return bestIndex >= 0 ? ({ index: bestIndex, type: "profit_protection" as const }) : null;
}

function inferFallbackType(series: ValuePoint[], pointIndex: number, initialAmount: number) {
  const point = series[pointIndex]!;
  const waitingMonths = getMonthDiff(series[point.peakIndex]!.date, point.date);
  const currentReturnPct = getReturnPct(point, initialAmount);

  if (point.drawdownPct <= -0.12) {
    return "maximum_drawdown";
  }

  if (waitingMonths >= 8) {
    return "longest_stagnation";
  }

  if (currentReturnPct >= 18) {
    return "profit_protection";
  }

  return "recovery_uncertainty";
}

function selectFallbackMoments(series: ValuePoint[], initialAmount: number, usedIndices: number[]) {
  return selectFallbackMomentsWithOptions(series, initialAmount, usedIndices);
}

function selectFallbackMomentsWithOptions(
  series: ValuePoint[],
  initialAmount: number,
  usedIndices: number[],
  options: {
    maxCount?: number;
    minGapDays?: number;
    minIndex?: number;
  } = {},
) {
  const { maxCount = 3, minGapDays = MIN_MOMENT_GAP_DAYS, minIndex = 20 } = options;
  const blockedIndices = [...usedIndices];
  const ranked = series
    .map((point, index) => ({
      index,
      score:
        Math.abs(point.drawdownPct * 100) * 1.5 +
        getMonthDiff(series[point.peakIndex]!.date, point.date) +
        Math.max(0, getReturnPct(point, initialAmount)) * 0.25,
    }))
    .sort((left, right) => right.score - left.score);

  const selected: CandidateMoment[] = [];

  for (const candidate of ranked) {
    if (
      candidate.index < minIndex ||
      !isDateFarEnough(series, candidate.index, blockedIndices, minGapDays)
    ) {
      continue;
    }

    selected.push({
      index: candidate.index,
      type: inferFallbackType(series, candidate.index, initialAmount),
    });
    blockedIndices.push(candidate.index);

    if (selected.length >= maxCount) {
      break;
    }
  }

  return selected;
}

function buildHardestPeriodSummary(moment: CriticalMoment) {
  if (moment.type === "maximum_drawdown") {
    return "가장 흔들리기 쉬운 순간은 극단적 낙폭 이후에도 회복 신호가 약했던 시기였습니다.";
  }

  if (moment.type === "longest_stagnation") {
    return "가장 힘들었던 구간은 큰 하락 자체보다, 끝이 보이지 않는 횡보와 기다림이 이어지던 시간이었습니다.";
  }

  if (moment.type === "recovery_uncertainty") {
    return "가장 흔들리기 쉬운 순간은 반등처럼 보여도 다시 꺾일까 두려워 확신을 갖기 어려웠던 구간이었습니다.";
  }

  return "가장 놓치기 쉬운 순간은 수익이 다시 보일 때 안도감 때문에 너무 일찍 떠나고 싶어지는 시점이었습니다.";
}

function buildTeaser(experience: { moments: CriticalMoment[] }): CriticalMomentTeaser {
  const mainMoment =
    experience.moments
      .map((moment) => {
        const contributionStat = moment.afterMathStats.find((stat) => stat.label === "10년 수익 기여");
        const contribution = contributionStat
          ? Number.parseFloat(contributionStat.value.replace("%", ""))
          : 0;
        return { contribution, moment };
      })
      .sort((left, right) => (Number.isFinite(right.contribution) ? right.contribution : 0) - (Number.isFinite(left.contribution) ? left.contribution : 0))[0]?.moment ??
    experience.moments[0]!;

  const contributionStat =
    mainMoment.afterMathStats.find((stat) => stat.label === "10년 수익 기여")?.value ?? "제한적";
  const recoveryStat =
    mainMoment.afterMathStats.find((stat) => stat.label === "전고점 회복까지")?.value ?? "미확인";

  return {
    facts: [
      `전체 10년 수익의 ${contributionStat}는 ${mainMoment.shortLabel} 이후에 만들어졌습니다.`,
      `이 시점엔 전고점 대비 ${formatPercent(mainMoment.drawdownPct)}였고, 회복까지 ${recoveryStat}이 걸렸습니다.`,
      `하지만 이때의 펀더멘탈 평가는 '${mainMoment.fundamentals.label}'에 가까웠습니다.`,
    ],
    hardestPeriodSummary: buildHardestPeriodSummary(mainMoment),
    headline: "이 자산의 장기수익은 가장 비관적인 순간 이후에 크게 만들어졌습니다.",
  };
}

export function buildCriticalMomentExperience({
  asset,
  initialAmount,
  report,
}: BuildCriticalMomentExperienceInput): CriticalMomentExperience {
  const context = buildMomentContext(report.valueSeries);
  const selected: CandidateMoment[] = [];
  const usedIndices: number[] = [];

  const primarySelectors = [
    () => selectMaximumDrawdownMoment(report),
    () => selectLongestStagnationMoment(report.valueSeries, usedIndices),
    () => selectRecoveryUncertaintyMoment(report.valueSeries, context, usedIndices),
    () => selectProfitProtectionMoment(report.valueSeries, context, initialAmount, usedIndices),
  ];

  for (const selectCandidate of primarySelectors) {
    const candidate = selectCandidate();

    if (
      !candidate ||
      selected.some((existing) => existing.index === candidate.index) ||
      !isDateFarEnough(report.valueSeries, candidate.index, usedIndices)
    ) {
      continue;
    }

    selected.push(candidate);
    usedIndices.push(candidate.index);
  }

  if (selected.length < 3) {
    const fallbackBatches = [
      selectFallbackMoments(report.valueSeries, initialAmount, usedIndices),
      selectFallbackMomentsWithOptions(report.valueSeries, initialAmount, usedIndices, {
        maxCount: 4 - selected.length,
        minGapDays: Math.floor(MIN_MOMENT_GAP_DAYS / 2),
        minIndex: 8,
      }),
      selectFallbackMomentsWithOptions(report.valueSeries, initialAmount, usedIndices, {
        maxCount: 4 - selected.length,
        minGapDays: 0,
        minIndex: 4,
      }),
    ];

    for (const fallbacks of fallbackBatches) {
      for (const fallback of fallbacks) {
        if (selected.some((candidate) => candidate.index === fallback.index)) {
          continue;
        }

        selected.push(fallback);
        usedIndices.push(fallback.index);

        if (selected.length >= 4) {
          break;
        }
      }

      if (selected.length >= 3) {
        break;
      }
    }
  }

  const moments = selected
    .slice(0, 4)
    .map((candidate) => buildMoment(asset, initialAmount, report, context, candidate))
    .sort((left, right) => left.date.localeCompare(right.date));

  return {
    assetId: asset.id,
    assetLabel: asset.label,
    moments,
    series: buildChartSeries(report.valueSeries),
    teaser: buildTeaser({ moments }),
  };
}
