export type HoldCoachInputs = {
  ticker: string;
  amountKrw: number;
  holdingsQty: number;
  avgPrice: number;
  addBuyKrw: number;
  assetCurrency: "KRW" | "USD";
  fxRate?: number;
};

export type HistoryPointLike = {
  ts: number;
  price: number;
};

export type ScenarioOutcomeRange = {
  low: number;
  median: number;
  high: number;
};

export type RecoveryRange = {
  low: number;
  median: number;
  high: number;
};

export type PatternMatchWindow = {
  index: number;
  score: number;
  drawdownPct: number;
  volatilityPct: number;
  trendDirection: -1 | 0 | 1;
  return6mPct: number;
  return12mPct: number;
  recoveryMonths: number | null;
};

export type BehaviorScenario = {
  action: "매도" | "보유" | "분할매수";
  subtitle: string;
  decisionSummary: string;
  nextAvgPrice: number;
  nextQty: number;
  cashReserveKrw: number;
  valueAt6m: ScenarioOutcomeRange;
  valueAt12m: ScenarioOutcomeRange;
  recoveryMonths: RecoveryRange | null;
  matchedSampleCount: number;
};

export type DrawdownRecoverySnapshot = {
  drawdownPct: number;
  recoveryMonths: number;
  dcaImprovementPct: number;
  terminalGapKrw: number;
  peakPrice: number;
  troughPrice: number;
  recoveryPrice: number;
};

export type HoldCoachCoreMetrics = {
  currentPrice: number;
  currentPriceKrw: number;
  currentDrawdownPct: number;
  currentHoldingValue: number;
  totalDeployableKrw: number;
  nextAvgPrice: number;
  nextQty: number;
  currentVsAvgPct: number;
  recentVolatilityPct: number;
  recentTrendDirection: -1 | 0 | 1;
};

export type HoldCoachHistoricalInsights = {
  monthlyCheckLabel: string;
  monthlyCheckBody: string;
  ruleStatus: string;
  snapshot: DrawdownRecoverySnapshot | null;
};

export type HoldCoachAnalysis = {
  core: HoldCoachCoreMetrics;
  insights: HoldCoachHistoricalInsights | null;
  scenarios: BehaviorScenario[];
};

export type HoldCoachRules = {
  reviewPct: number;
  buy1Pct: number;
  buy2Pct: number;
  finalPct: number;
};

export type RiskProfile = "conservative" | "balanced" | "aggressive";
export type BuyCapacity = "low" | "medium" | "high";

export type RuleSuggestionInput = {
  ticker: string;
  riskProfile: RiskProfile;
  buyCapacity: BuyCapacity;
  maxAcceptableDrawdown: number;
  history: HistoryPointLike[];
};

export type RuleSuggestionResult = {
  rules: HoldCoachRules;
  title: string;
  reasons: string[];
};

function monthsBetweenTimestamps(startTs: number, endTs: number) {
  const start = new Date(startTs * 1000);
  const end = new Date(endTs * 1000);
  return Math.max(0, (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + (end.getUTCMonth() - start.getUTCMonth()));
}

function clampPct(value: number, minAbs: number, maxAbs: number) {
  const safe = Math.max(minAbs, Math.min(maxAbs, Math.abs(value)));
  return -safe;
}

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function quantile(values: number[], ratio: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * ratio;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];
  const weight = position - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

function getRecentReturns(history: HistoryPointLike[], endIndex: number, months: number) {
  const returns: number[] = [];
  const startIndex = Math.max(1, endIndex - months + 1);
  for (let index = startIndex; index <= endIndex; index += 1) {
    const prev = history[index - 1]?.price ?? 0;
    const current = history[index]?.price ?? 0;
    if (prev > 0 && current > 0) {
      returns.push(((current - prev) / prev) * 100);
    }
  }
  return returns;
}

function getRecentVolatilityPct(history: HistoryPointLike[], endIndex: number) {
  const returns = getRecentReturns(history, endIndex, 6);
  if (!returns.length) return 0;
  return returns.reduce((sum, value) => sum + Math.abs(value), 0) / returns.length;
}

function getTrendDirection(history: HistoryPointLike[], endIndex: number) {
  const startIndex = Math.max(0, endIndex - 3);
  const startPrice = history[startIndex]?.price ?? 0;
  const endPrice = history[endIndex]?.price ?? 0;
  if (!startPrice || !endPrice) return 0 as const;
  const change = (endPrice - startPrice) / startPrice;
  if (change > 0.03) return 1 as const;
  if (change < -0.03) return -1 as const;
  return 0 as const;
}

function getRunningPeak(history: HistoryPointLike[], endIndex: number) {
  let peak = 0;
  for (let index = 0; index <= endIndex; index += 1) {
    peak = Math.max(peak, history[index]?.price ?? 0);
  }
  return peak;
}

function getDrawdownPct(history: HistoryPointLike[], endIndex: number) {
  const peak = getRunningPeak(history, endIndex);
  const price = history[endIndex]?.price ?? 0;
  if (!peak || !price) return 0;
  return ((peak - price) / peak) * 100;
}

function findRecoveryMonths(history: HistoryPointLike[], index: number) {
  const peak = getRunningPeak(history, index);
  if (!peak) return null;
  for (let cursor = index + 1; cursor < history.length; cursor += 1) {
    if ((history[cursor]?.price ?? 0) >= peak) {
      return monthsBetweenTimestamps(history[index].ts, history[cursor].ts);
    }
  }
  return null;
}

function toRange(values: number[]): ScenarioOutcomeRange {
  return {
    low: quantile(values, 0.2),
    median: median(values),
    high: quantile(values, 0.8),
  };
}

function toRecoveryRange(values: number[]): RecoveryRange | null {
  if (!values.length) return null;
  return {
    low: quantile(values, 0.2),
    median: median(values),
    high: quantile(values, 0.8),
  };
}

function findMaxDrawdownSnapshot(history: HistoryPointLike[]): DrawdownRecoverySnapshot | null {
  if (history.length < 6) return null;

  let peakPrice = history[0].price;
  let troughIndex = 0;
  let troughPrice = history[0].price;
  let recoveryIndex = history.length - 1;
  let maxDrawdown = 0;

  for (let index = 1; index < history.length; index += 1) {
    const price = history[index].price;
    if (price > peakPrice) {
      peakPrice = price;
      continue;
    }

    const drawdown = peakPrice > 0 ? (price - peakPrice) / peakPrice : 0;
    if (drawdown < maxDrawdown) {
      maxDrawdown = drawdown;
      troughIndex = index;
      troughPrice = price;
      recoveryIndex = history.length - 1;
      for (let cursor = index + 1; cursor < history.length; cursor += 1) {
        if (history[cursor].price >= peakPrice) {
          recoveryIndex = cursor;
          break;
        }
      }
    }
  }

  if (maxDrawdown === 0) return null;

  const recoveryPrice = history[recoveryIndex]?.price ?? history[history.length - 1]?.price ?? troughPrice;
  const recoveryMonths = monthsBetweenTimestamps(history[troughIndex].ts, history[recoveryIndex].ts);
  const dcaImprovementPct = peakPrice > 0 ? ((peakPrice - (peakPrice + troughPrice + recoveryPrice) / 3) / peakPrice) * 100 : 0;
  const terminalGapKrw = peakPrice > 0 ? ((recoveryPrice - troughPrice) / peakPrice) * 10000000 : 0;

  return { drawdownPct: Math.abs(maxDrawdown) * 100, recoveryMonths, dcaImprovementPct, terminalGapKrw, peakPrice, troughPrice, recoveryPrice };
}

function getRuleStatus(currentDrawdownPct: number, rules: HoldCoachRules) {
  if (currentDrawdownPct >= Math.abs(rules.finalPct)) return "최종 판단 구간입니다. thesis를 다시 점검할 시점입니다.";
  if (currentDrawdownPct >= Math.abs(rules.buy2Pct)) return "2차 분할매수 구간입니다. 규칙 안에서 천천히 수량을 늘리는 구간입니다.";
  if (currentDrawdownPct >= Math.abs(rules.buy1Pct)) return "1차 분할매수 구간입니다. 공포보다 계획을 먼저 확인할 시점입니다.";
  if (currentDrawdownPct >= Math.abs(rules.reviewPct)) return "점검 구간입니다. 성급한 매도보다 내 가설을 다시 확인해보세요.";
  return "관찰 구간입니다. 규칙을 유지하면서 추세를 지켜보는 구간입니다.";
}

function getMonthlyCheck(currentDrawdownPct: number, currentPrice: number, avgPrice: number, addBuyKrw: number) {
  if (currentDrawdownPct >= 25 && addBuyKrw > 0) {
    return { label: "지금은 1차 분할매수 검토 구간", body: "낙폭이 커진 구간입니다. 한 번에 몰아넣기보다 규칙 있는 분할 접근이 더 잘 맞는 자리입니다." };
  }
  if (avgPrice > 0 && currentPrice >= avgPrice * 1.2) {
    return { label: "지금은 과열 주의 구간", body: "평균단가 대비 수익이 커진 상태입니다. 추가 매수보다 비중과 규칙 점검이 우선입니다." };
  }
  return { label: "지금은 버티기 중심 구간", body: "당장 흔들리기보다 내 규칙을 지키고 있는지 확인하는 것이 더 중요한 구간입니다." };
}

function buildCoreMetrics(history: HistoryPointLike[], inputs: HoldCoachInputs): HoldCoachCoreMetrics | null {
  const currentPrice = history[history.length - 1]?.price ?? 0;
  if (!Number.isFinite(currentPrice) || currentPrice <= 0) return null;

  const fxRate = inputs.assetCurrency === "USD" ? Math.max(1, inputs.fxRate ?? 1350) : 1;
  const addBuyInAssetCurrency = inputs.assetCurrency === "USD" ? inputs.addBuyKrw / fxRate : inputs.addBuyKrw;
  const currentPriceKrw = inputs.assetCurrency === "USD" ? currentPrice * fxRate : currentPrice;
  const currentPeak = history.reduce((max, point) => Math.max(max, point.price), currentPrice);
  const currentDrawdownPct = currentPeak > 0 ? ((currentPeak - currentPrice) / currentPeak) * 100 : 0;
  const currentHoldingValue = inputs.holdingsQty * currentPriceKrw;
  const totalDeployableKrw = currentHoldingValue + inputs.addBuyKrw;
  const addQty = currentPrice > 0 ? addBuyInAssetCurrency / currentPrice : 0;
  const nextQty = inputs.holdingsQty + addQty;
  const nextAvgPrice = nextQty > 0 ? (inputs.holdingsQty * inputs.avgPrice + addBuyInAssetCurrency) / nextQty : 0;
  const currentVsAvgPct = inputs.avgPrice > 0 ? ((currentPrice - inputs.avgPrice) / inputs.avgPrice) * 100 : 0;
  const recentVolatilityPct = getRecentVolatilityPct(history, history.length - 1);
  const recentTrendDirection = getTrendDirection(history, history.length - 1);

  return {
    currentPrice,
    currentPriceKrw,
    currentDrawdownPct,
    currentHoldingValue,
    totalDeployableKrw,
    nextAvgPrice,
    nextQty,
    currentVsAvgPct,
    recentVolatilityPct,
    recentTrendDirection,
  };
}

function buildHistoricalInsights(history: HistoryPointLike[], core: HoldCoachCoreMetrics, inputs: HoldCoachInputs, rules: HoldCoachRules) {
  if (history.length < 6) return null;
  const snapshot = findMaxDrawdownSnapshot(history);
  const monthlyCheck = getMonthlyCheck(core.currentDrawdownPct, core.currentPrice, inputs.avgPrice, inputs.addBuyKrw);
  return {
    monthlyCheckLabel: monthlyCheck.label,
    monthlyCheckBody: monthlyCheck.body,
    ruleStatus: getRuleStatus(core.currentDrawdownPct, rules),
    snapshot,
  };
}

function matchPatternWindows(history: HistoryPointLike[], core: HoldCoachCoreMetrics) {
  if (history.length < 18) return [] as PatternMatchWindow[];
  const matches: PatternMatchWindow[] = [];

  for (let index = 6; index < history.length - 12; index += 1) {
    const drawdownPct = getDrawdownPct(history, index);
    const volatilityPct = getRecentVolatilityPct(history, index);
    const trendDirection = getTrendDirection(history, index);
    const drawdownScore = Math.abs(drawdownPct - core.currentDrawdownPct) / 8;
    const volatilityScore = Math.abs(volatilityPct - core.recentVolatilityPct) / 4;
    const trendPenalty = trendDirection === core.recentTrendDirection ? 0 : trendDirection === 0 || core.recentTrendDirection === 0 ? 0.4 : 0.8;
    const score = drawdownScore + volatilityScore + trendPenalty;

    if (score > 3.1) continue;

    const currentPrice = history[index].price;
    const price6m = history[Math.min(history.length - 1, index + 6)]?.price ?? currentPrice;
    const price12m = history[Math.min(history.length - 1, index + 12)]?.price ?? currentPrice;
    const return6mPct = currentPrice > 0 ? ((price6m - currentPrice) / currentPrice) * 100 : 0;
    const return12mPct = currentPrice > 0 ? ((price12m - currentPrice) / currentPrice) * 100 : 0;
    const recoveryMonths = findRecoveryMonths(history, index);

    matches.push({ index, score, drawdownPct, volatilityPct, trendDirection, return6mPct, return12mPct, recoveryMonths });
  }

  return matches.sort((a, b) => a.score - b.score).slice(0, 9);
}

function buildBehaviorScenarios(matches: PatternMatchWindow[], core: HoldCoachCoreMetrics, inputs: HoldCoachInputs): BehaviorScenario[] {
  if (!matches.length) return [];

  const sellBase = core.currentHoldingValue + inputs.addBuyKrw;
  const holdBase = core.currentHoldingValue;
  const holdCashReserve = inputs.addBuyKrw;
  const buyBase = inputs.assetCurrency === "USD"
    ? core.nextQty * core.currentPriceKrw
    : core.nextQty * core.currentPrice;

  const returns6 = matches.map((item) => item.return6mPct / 100);
  const returns12 = matches.map((item) => item.return12mPct / 100);
  const recoverySamples = matches.map((item) => item.recoveryMonths).filter((item): item is number => item !== null);

  const toValueRange = (baseValue: number, returns: number[], cashReserveKrw = 0) =>
    toRange(returns.map((ratio) => baseValue * (1 + ratio) + cashReserveKrw));

  return [
    {
      action: "매도",
      subtitle: "보유 자산은 현금화하고 기다리는 선택",
      decisionSummary: "보유 자산과 추가 자금을 모두 현금으로 두기 때문에 변동성은 줄지만 반등 기회도 같이 줄어듭니다.",
      nextAvgPrice: 0,
      nextQty: 0,
      cashReserveKrw: sellBase,
      valueAt6m: { low: sellBase, median: sellBase, high: sellBase },
      valueAt12m: { low: sellBase, median: sellBase, high: sellBase },
      recoveryMonths: null,
      matchedSampleCount: matches.length,
    },
    {
      action: "보유",
      subtitle: "보유분은 유지하고, 추가 자금은 현금으로 대기하는 선택",
      decisionSummary: "현재 보유분만 과거 유사 구간처럼 움직이고, 추가 자금은 기다리기 때문에 수량과 평균단가는 그대로입니다.",
      nextAvgPrice: inputs.avgPrice,
      nextQty: inputs.holdingsQty,
      cashReserveKrw: holdCashReserve,
      valueAt6m: toValueRange(holdBase, returns6, holdCashReserve),
      valueAt12m: toValueRange(holdBase, returns12, holdCashReserve),
      recoveryMonths: toRecoveryRange(recoverySamples),
      matchedSampleCount: matches.length,
    },
    {
      action: "분할매수",
      subtitle: "추가 자금까지 넣어 수량을 늘리는 선택",
      decisionSummary: "추가 매수 자금까지 자산에 투입해 평균단가를 낮추고, 더 큰 자산 노출로 과거 유사 구간을 따라가는 선택입니다.",
      nextAvgPrice: core.nextAvgPrice,
      nextQty: core.nextQty,
      cashReserveKrw: 0,
      valueAt6m: toValueRange(buyBase, returns6),
      valueAt12m: toValueRange(buyBase, returns12),
      recoveryMonths: toRecoveryRange(recoverySamples),
      matchedSampleCount: matches.length,
    },
  ];
}

export function analyzeHoldCoach(history: HistoryPointLike[], inputs: HoldCoachInputs, rules: HoldCoachRules): HoldCoachAnalysis | null {
  if (!history.length) return null;
  const core = buildCoreMetrics(history, inputs);
  if (!core) return null;
  const insights = buildHistoricalInsights(history, core, inputs, rules);
  const matches = matchPatternWindows(history, core);
  const scenarios = buildBehaviorScenarios(matches, core, inputs);
  return { core, insights, scenarios };
}

export function suggestHoldCoachRules(input: RuleSuggestionInput): RuleSuggestionResult {
  const snapshot = findMaxDrawdownSnapshot(input.history);
  const historicalDrawdown = snapshot?.drawdownPct ?? 35;
  const targetDrawdown = Math.max(15, Math.min(input.maxAcceptableDrawdown, 70));
  const volatilityBias = historicalDrawdown >= 55 ? 8 : historicalDrawdown >= 40 ? 4 : 0;
  const riskBias = input.riskProfile === "conservative" ? -6 : input.riskProfile === "aggressive" ? 6 : 0;
  const capacityBias = input.buyCapacity === "low" ? 4 : input.buyCapacity === "high" ? -4 : 0;

  const reviewPct = clampPct(targetDrawdown * 0.35 + volatilityBias + riskBias + capacityBias, 10, 30);
  const buy1Pct = clampPct(targetDrawdown * 0.55 + volatilityBias + riskBias + capacityBias, 18, 40);
  const buy2Pct = clampPct(targetDrawdown * 0.75 + volatilityBias + riskBias + capacityBias, 25, 55);
  const finalPct = clampPct(targetDrawdown + volatilityBias + riskBias + capacityBias, 35, 75);

  const title = input.riskProfile === "conservative" ? "보수형 버티기 규칙" : input.riskProfile === "aggressive" ? "공격형 분할매수 규칙" : "균형형 버티기 규칙";
  const reasons = [
    `${input.ticker}의 과거 최대 낙폭${snapshot ? `은 약 -${snapshot.drawdownPct.toFixed(1)}%` : " 데이터를 기준으로"} 반영했습니다.`,
    input.buyCapacity === "low"
      ? "추가 매수 여력이 낮아 너무 촘촘한 매수보다 늦고 신중한 진입 규칙으로 조정했습니다."
      : input.buyCapacity === "high"
        ? "추가 매수 여력이 높아 단계별 분할매수 간격을 조금 더 앞당겼습니다."
        : "추가 매수 여력은 보통 수준으로 보고 균형형 간격을 적용했습니다.",
    `최대 감내 낙폭은 -${targetDrawdown}% 기준으로 잡고, 마지막 판단 구간은 -${Math.abs(finalPct)}% 부근에 두었습니다.`,
  ];

  return { title, rules: { reviewPct, buy1Pct, buy2Pct, finalPct }, reasons };
}
