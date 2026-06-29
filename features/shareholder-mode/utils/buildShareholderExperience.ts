import { buildHoldingPainReport, type PricePoint } from "@/features/pain-of-holding";
import type {
  ShareholderDecisionEvent,
  ShareholderExperience,
  ShareholderPathPoint,
  ShareholderProgressView,
  ShareholderPsychologyState,
  ShareholderStoredSession,
} from "@/features/shareholder-mode/types";
import { formatKrwCompact, formatPercent } from "@/lib/race-engine";

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

function formatYearMonth(date: string) {
  const [year, month] = date.split("-");
  return `${year}.${month}`;
}

function formatMonthSpan(months: number) {
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

function buildMonthlyPriceSeries(priceSeries: PricePoint[]) {
  if (priceSeries.length <= 1) {
    return priceSeries;
  }

  const selected: PricePoint[] = [priceSeries[0]!];
  const firstDate = priceSeries[0]!.date;
  let monthOffset = 1;
  let lastSelectedDate = priceSeries[0]!.date;

  while (lastSelectedDate < priceSeries[priceSeries.length - 1]!.date) {
    const targetDate = addMonths(firstDate, monthOffset);
    const checkpoint = priceSeries
      .filter((point) => point.date > lastSelectedDate && point.date <= targetDate)
      .at(-1);

    if (checkpoint) {
      selected.push(checkpoint);
      lastSelectedDate = checkpoint.date;
    }

    if (targetDate >= priceSeries[priceSeries.length - 1]!.date) {
      break;
    }

    monthOffset += 1;
  }

  const finalPoint = priceSeries[priceSeries.length - 1]!;
  if (selected.at(-1)?.date !== finalPoint.date) {
    selected.push(finalPoint);
  }

  return selected;
}

function buildPathSeries(initialAmount: number, monthlyPriceSeries: PricePoint[]) {
  const firstPrice = monthlyPriceSeries[0]!.price;
  const shares = firstPrice > 0 ? initialAmount / firstPrice : 0;
  let runningPeak = initialAmount;
  let peakIndex = 0;
  let runningLow = initialAmount;
  let newLowCount = 0;

  return monthlyPriceSeries.map<ShareholderPathPoint>((point, index) => {
    const value = shares * point.price;

    if (value > runningPeak) {
      runningPeak = value;
      peakIndex = index;
    }

    if (index > 0 && value <= runningLow * 0.992) {
      newLowCount += 1;
    }

    runningLow = Math.min(runningLow, value);

    const drawdownPct = runningPeak > 0 ? (value - runningPeak) / runningPeak : 0;
    const recoveryGainNeededPct = drawdownPct < 0 ? (runningPeak / value - 1) * 100 : 0;

    return {
      date: point.date,
      drawdownPct,
      index,
      label: formatYearMonth(point.date),
      monthsSinceEntry: index,
      newLowCount,
      peakValue: runningPeak,
      price: point.price,
      recoveryGainNeededPct,
      returnPct: initialAmount > 0 ? (value / initialAmount - 1) * 100 : 0,
      unrecoveredMonths: index - peakIndex,
      value,
    };
  });
}

function getSidewaysMonths(series: ShareholderPathPoint[]) {
  let streak = 0;

  for (let index = series.length - 1; index >= 1; index -= 1) {
    const current = series[index]!;
    const previous = series[index - 1]!;
    const monthChangePct = previous.value > 0 ? (current.value - previous.value) / previous.value : 0;

    if (Math.abs(monthChangePct) <= 0.03 && current.drawdownPct <= -0.08) {
      streak += 1;
      continue;
    }

    break;
  }

  return streak;
}

function classifyState(revealedSeries: ShareholderPathPoint[]): ShareholderPsychologyState {
  if (revealedSeries.length <= 1) {
    return "entry_optimism";
  }

  const current = revealedSeries[revealedSeries.length - 1]!;
  const previous = revealedSeries[revealedSeries.length - 2]!;
  const monthChangePct = previous.value > 0 ? (current.value - previous.value) / previous.value : 0;
  const sidewaysMonths = getSidewaysMonths(revealedSeries);
  const madeNewLow = current.newLowCount > previous.newLowCount;

  if (current.drawdownPct >= -0.03 || current.recoveryGainNeededPct <= 4) {
    return "recovered_or_near_recovery";
  }

  if (madeNewLow || monthChangePct <= -0.05 || current.drawdownPct <= -0.22) {
    return "deeper_drawdown";
  }

  if (sidewaysMonths >= 6) {
    return "sideways_stagnation";
  }

  if (monthChangePct >= 0.06 && current.drawdownPct <= -0.1) {
    return "uncertain_rebound";
  }

  if (current.recoveryGainNeededPct <= 14 && current.drawdownPct < 0) {
    return "approaching_recovery";
  }

  return monthChangePct >= 0 ? "uncertain_rebound" : "sideways_stagnation";
}

function selectVariant(pool: string[], seed: number) {
  return pool[Math.abs(seed) % pool.length]!;
}

function buildPsychologyCopy(
  state: ShareholderPsychologyState,
  revealedSeries: ShareholderPathPoint[],
) {
  const current = revealedSeries[revealedSeries.length - 1]!;
  const unrecoveredLabel =
    current.unrecoveredMonths > 0
      ? `전고점 회복 없음 ${current.unrecoveredMonths}개월째`
      : "전고점 부근";
  const newLowLabel =
    current.newLowCount > 0 ? `신저점 갱신 ${current.newLowCount}회` : "새 저점 갱신 없음";
  const sidewaysLabel =
    getSidewaysMonths(revealedSeries) > 0
      ? `횡보 ${formatMonthSpan(getSidewaysMonths(revealedSeries))}`
      : "지루한 횡보는 아직 짧아요";

  const copy: Record<
    ShareholderPsychologyState,
    {
      eyebrow: string;
      messages: string[];
      stat: string;
      summary: string[];
    }
  > = {
    approaching_recovery: {
      eyebrow: "회복이 보이기 시작해요",
      messages: [
        "오래 버틴 시간의 무게가 조금씩 결과로 바뀌는 구간이에요.",
        "이제는 수익보다 회복 가능성이 더 또렷하게 보여요.",
        "결과가 아니라 기다림이 보상받기 시작하는 시점이에요.",
      ],
      stat: `회복까지 필요한 상승률 ${formatPercent(current.recoveryGainNeededPct)}`,
      summary: [
        "이 구간의 핵심은 손실보다 회복 직전의 불확실함이에요.",
        "버티기의 피로가 길었지만, 흐름은 조금씩 달라지고 있어요.",
      ],
    },
    deeper_drawdown: {
      eyebrow: "견디기 가장 어려운 순간이에요",
      messages: [
        "지금은 수익보다 피로감과 불안이 더 크게 느껴지는 구간이에요.",
        "하락 자체보다, 언제 끝날지 모른다는 감정이 더 무거운 시점이에요.",
        "손실 숫자보다 판단을 흔드는 시간의 길이가 더 아픈 구간이에요.",
      ],
      stat: `${unrecoveredLabel} · ${newLowLabel}`,
      summary: [
        "결과 차트보다 실제 체감은 훨씬 거칠었을 가능성이 커요.",
        "이 시점의 어려움은 급락과 재차 저점 갱신이 겹친다는 데 있어요.",
      ],
    },
    entry_optimism: {
      eyebrow: "아직 미래는 보이지 않아요",
      messages: [
        "이제부터 당신은 결과를 아는 관객이 아니라, 그 시간을 지나가야 하는 투자자예요.",
        "처음엔 누구나 버틸 수 있을 것 같지만, 어려움은 보통 시간이 길어질수록 시작돼요.",
        "지금은 기대가 크지만, 앞으로의 시간은 아직 공개되지 않았어요.",
      ],
      stat: `진입 시점 ${formatYearMonth(current.date)}`,
      summary: [
        "결과를 모르기 때문에, 작은 흔들림도 훨씬 크게 다가올 수 있어요.",
        "장기투자의 어려움은 수익률보다 시간이 만든 감정에서 시작돼요.",
      ],
    },
    recovered_or_near_recovery: {
      eyebrow: "버틴 시간이 결과로 보여요",
      messages: [
        "결과만 보면 쉬워 보여도, 실제로 이 시간은 결코 가볍지 않았어요.",
        "회복은 숫자보다 오래 버틴 시간의 결과에 가까워요.",
        "이제는 손실보다 기다림의 의미가 먼저 보이는 구간이에요.",
      ],
      stat: current.drawdownPct >= 0 ? "전고점 회복" : `회복까지 ${formatPercent(current.recoveryGainNeededPct)}`,
      summary: [
        "회복이 가까워질수록 지난 불안의 길이가 더 선명하게 느껴져요.",
        "버티기의 무게가 결과로 전환되는 순간이에요.",
      ],
    },
    sideways_stagnation: {
      eyebrow: "급락보다 긴 횡보가 더 괴로워요",
      messages: [
        "크게 무너지지 않아도 끝이 보이지 않는 횡보는 생각보다 더 지쳐요.",
        "좋아졌다고 말하기 어렵고, 포기하기엔 아까운 시간이 길어지는 구간이에요.",
        "손실이 더 커지지 않아도, 확신이 돌아오지 않는 시간은 꽤 고통스러워요.",
      ],
      stat: `${sidewaysLabel} · ${unrecoveredLabel}`,
      summary: [
        "이 구간의 어려움은 급락보다 끝이 보이지 않는 정체예요.",
        "움직임이 적을수록 버티는 이유를 다시 찾기 어려워져요.",
      ],
    },
    uncertain_rebound: {
      eyebrow: "반등처럼 보여도 아직 확신은 부족해요",
      messages: [
        "숫자는 좋아졌지만, 투자자는 아직 쉽게 안심하기 어려운 구간이에요.",
        "반등은 시작됐지만, 다시 꺾일 수 있다는 긴장도 함께 남아 있어요.",
        "좋아지는 흐름과 다시 흔들릴 수 있다는 기억이 동시에 존재하는 시점이에요.",
      ],
      stat: `회복까지 필요한 상승률 ${formatPercent(current.recoveryGainNeededPct)}`,
      summary: [
        "이 구간의 핵심은 희망과 불안이 같이 올라온다는 점이에요.",
        "반등은 보이지만 아직 완전히 믿기 어려운 시기예요.",
      ],
    },
  };

  const selected = copy[state];
  const seed = current.index + current.newLowCount;

  return {
    message: selectVariant(selected.messages, seed),
    messageEyebrow: selected.eyebrow,
    messageStat: selected.stat,
    summaryLine: selectVariant(selected.summary, seed + 1),
  };
}

function buildDecisionEvent(
  index: number,
  state: ShareholderPsychologyState,
  revealedSeries: ShareholderPathPoint[],
): ShareholderDecisionEvent | null {
  const current = revealedSeries[revealedSeries.length - 1]!;
  const copy = buildPsychologyCopy(state, revealedSeries);

  if (state === "entry_optimism" || state === "recovered_or_near_recovery") {
    return null;
  }

  const titles: Record<ShareholderPsychologyState, string> = {
    approaching_recovery: "조금 더 버티면 회복이 보일 수도 있어요",
    deeper_drawdown: "지금 손을 놓고 싶어질 수 있는 구간이에요",
    entry_optimism: "진입 직후",
    recovered_or_near_recovery: "회복 직전",
    sideways_stagnation: "숫자보다 시간이 더 괴로운 구간이에요",
    uncertain_rebound: "반등을 믿기 어려운 시점이에요",
  };

  const insights: Record<ShareholderPsychologyState, string> = {
    approaching_recovery: "조금만 더 기다리면 전고점이 다시 시야에 들어올 수 있어요.",
    deeper_drawdown: "손실 숫자보다, 다시 저점이 갱신되는 감정이 더 크게 흔드는 순간이에요.",
    entry_optimism: "",
    recovered_or_near_recovery: "",
    sideways_stagnation: "급락은 멈췄지만, 끝이 보이지 않는 정체가 판단을 무디게 만들 수 있어요.",
    uncertain_rebound: "좋아지는 흐름과 다시 꺾일 수 있다는 불안이 동시에 존재해요.",
  };

  return {
    index,
    insight: insights[state],
    statLine: `${formatYearMonth(current.date)} · 현재 수익률 ${formatPercent(current.returnPct)}`,
    summary: copy.message,
    title: titles[state],
    type: state,
  };
}

function buildDecisionEvents(series: ShareholderPathPoint[]) {
  const events: ShareholderDecisionEvent[] = [];
  let lastEventIndex = -5;

  for (let index = 1; index < series.length - 1; index += 1) {
    const revealedSeries = series.slice(0, index + 1);
    const state = classifyState(revealedSeries);
    const current = revealedSeries[revealedSeries.length - 1]!;

    if (index - lastEventIndex < 4) {
      continue;
    }

    const shouldTrigger =
      (state === "deeper_drawdown" && current.drawdownPct <= -0.16) ||
      (state === "sideways_stagnation" && getSidewaysMonths(revealedSeries) >= 6) ||
      (state === "uncertain_rebound" && current.recoveryGainNeededPct >= 10) ||
      (state === "approaching_recovery" && current.recoveryGainNeededPct <= 12);

    if (!shouldTrigger) {
      continue;
    }

    const event = buildDecisionEvent(index, state, revealedSeries);
    if (event) {
      events.push(event);
      lastEventIndex = index;
    }
  }

  return events;
}

function buildSummaryIndices(seriesLength: number, decisionEvents: ShareholderDecisionEvent[]) {
  const baseIndices = Array.from(
    { length: Math.floor((seriesLength - 1) / 12) },
    (_, index) => (index + 1) * 12,
  );
  const eventIndices = decisionEvents
    .map((event) => event.index)
    .filter((index) => index > 0 && index < seriesLength - 1 && index % 12 !== 0);

  return [...new Set([...baseIndices, ...eventIndices])].sort((left, right) => left - right);
}

function buildHardestPeriodLabel(
  report: ShareholderExperience["report"],
  decisionEvents: ShareholderDecisionEvent[],
) {
  const deepestMoment = report.maxDrawdown.troughDate;
  const longestPain = report.recovery.recoveryMonths ?? 0;

  if (longestPain >= 12) {
    return `${deepestMoment.slice(0, 7)} 전후의 긴 회복 대기`;
  }

  const drawdownEvent = decisionEvents.find((event) => event.type === "deeper_drawdown");
  if (drawdownEvent) {
    return `${drawdownEvent.title}`;
  }

  return `${deepestMoment.slice(0, 7)} 전후의 급락 구간`;
}

export function buildShareholderExperience(input: {
  assetId: ShareholderExperience["assetId"];
  assetLabel: string;
  initialAmount: number;
  priceSeries: PricePoint[];
}): ShareholderExperience {
  const monthlyPriceSeries = buildMonthlyPriceSeries(input.priceSeries);

  if (monthlyPriceSeries.length < 2) {
    throw new Error("그때의 주주 모드를 구성할 만큼 충분한 시계열이 없습니다.");
  }

  const report = buildHoldingPainReport({
    initialAmount: input.initialAmount,
    priceSeries: monthlyPriceSeries,
  });
  const series = buildPathSeries(input.initialAmount, monthlyPriceSeries);
  const decisionEvents = buildDecisionEvents(series);

  return {
    assetId: input.assetId,
    assetLabel: input.assetLabel,
    decisionEvents,
    endDate: series[series.length - 1]!.date,
    hardestPeriodLabel: buildHardestPeriodLabel(report, decisionEvents),
    initialAmount: input.initialAmount,
    purchasePrice: monthlyPriceSeries[0]!.price,
    report,
    series,
    startDate: series[0]!.date,
    summaryIndices: buildSummaryIndices(series.length, decisionEvents),
  };
}

export function buildShareholderProgressView(
  experience: ShareholderExperience,
  revealedIndex: number,
): ShareholderProgressView {
  const safeIndex = Math.max(0, Math.min(revealedIndex, experience.series.length - 1));
  const revealedSeries = experience.series.slice(0, safeIndex + 1);
  const currentPoint = revealedSeries[revealedSeries.length - 1]!;
  const state = classifyState(revealedSeries);
  const copy = buildPsychologyCopy(state, revealedSeries);
  const bestReturnPct = Math.max(...revealedSeries.map((point) => point.returnPct));
  const worstReturnPct = Math.min(...revealedSeries.map((point) => point.returnPct));
  const sidewaysMonths = getSidewaysMonths(revealedSeries);
  const pressureScore = Math.max(
    1,
    Math.min(
      10,
      Number(
        (
          Math.abs(currentPoint.drawdownPct) * 12 +
          Math.min(currentPoint.unrecoveredMonths, 24) * 0.16 +
          Math.min(currentPoint.newLowCount, 6) * 0.65 +
          Math.min(sidewaysMonths, 12) * 0.18
        ).toFixed(1),
      ),
    ),
  );

  return {
    bestReturnPct,
    currentPoint,
    message: copy.message,
    messageEyebrow: copy.messageEyebrow,
    messageStat: copy.messageStat,
    pressureScore,
    revealedSeries,
    sidewaysMonths,
    state,
    summaryLine: copy.summaryLine,
    worstReturnPct,
  };
}

const SHAREHOLDER_STORAGE_KEY = "rz-shareholder-session";
const SHAREHOLDER_HISTORY_KEY = "rz-shareholder-history";
const SESSION_VERSION = 1;

function isStoredSession(value: unknown): value is ShareholderStoredSession {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.key === "string" &&
    typeof candidate.revealedIndex === "number" &&
    typeof candidate.stage === "string" &&
    typeof candidate.version === "number"
  );
}

export function buildShareholderSessionKey(input: {
  amount: number;
  assetId: string;
  startDate: string;
}) {
  return `${input.assetId}:${input.startDate}:${Math.round(input.amount)}`;
}

export function readShareholderSession(sessionKey: string) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(SHAREHOLDER_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!isStoredSession(parsed) || parsed.key !== sessionKey || parsed.version !== SESSION_VERSION) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function writeShareholderSession(session: Omit<ShareholderStoredSession, "savedAt" | "version">) {
  if (typeof window === "undefined") {
    return;
  }

  const payload: ShareholderStoredSession = {
    ...session,
    savedAt: new Date().toISOString(),
    version: SESSION_VERSION,
  };

  window.localStorage.setItem(SHAREHOLDER_STORAGE_KEY, JSON.stringify(payload));
}

export function clearShareholderSession(sessionKey: string) {
  if (typeof window === "undefined") {
    return;
  }

  const current = readShareholderSession(sessionKey);
  if (!current) {
    return;
  }

  window.localStorage.removeItem(SHAREHOLDER_STORAGE_KEY);
}

export function saveShareholderHistory(input: {
  assetLabel: string;
  finalValue: number;
  startDate: string;
  summary: string;
}) {
  if (typeof window === "undefined") {
    return;
  }

  const existing = (() => {
    try {
      const raw = window.localStorage.getItem(SHAREHOLDER_HISTORY_KEY);
      return raw ? (JSON.parse(raw) as unknown[]) : [];
    } catch {
      return [];
    }
  })();

  const next = [
    {
      ...input,
      savedAt: new Date().toISOString(),
    },
    ...existing,
  ].slice(0, 12);

  window.localStorage.setItem(SHAREHOLDER_HISTORY_KEY, JSON.stringify(next));
}

export function buildShareholderExitSummary(input: {
  assetLabel: string;
  choiceLabel: string;
  finalValue: number;
  pointDate: string;
  totalReturnPct: number;
}) {
  return `${input.assetLabel} ${formatYearMonth(input.pointDate)} ${input.choiceLabel} · ${formatKrwCompact(input.finalValue)} (${formatPercent(input.totalReturnPct)})`;
}
