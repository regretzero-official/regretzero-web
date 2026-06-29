import type {
  HistoricalMomentChartPoint,
  HistoricalMomentMessageState,
} from "@/features/historical-moment/types";
import { formatKrwCompact, formatPercent } from "@/lib/race-engine";

interface HistoricalMomentMessageData {
  badge: string;
  enduranceLabel: string;
  message: string;
  progressLabel: string;
  state: HistoricalMomentMessageState;
  statLine: string | null;
}

interface SeriesSnapshot {
  currentDrawdownPct: number;
  currentPoint: HistoricalMomentChartPoint;
  currentValue: number;
  drawdownChangePct: number;
  flatStreak: number;
  lossAmount: number;
  monthChangePct: number;
  monthsSincePeak: number;
  newLow: boolean;
  peakValue: number;
}

const MESSAGE_POOLS: Record<HistoricalMomentMessageState, string[]> = {
  historical_moment: [
    "여기까지의 흐름만 보면, 긴 하락이 아직 끝났다고 말하긴 어려워요.",
    "이 시점의 투자자는 이후 한 달도 알지 못한 채 판단해야 했어요.",
    "보이는 것은 낙폭뿐이고, 반등은 아직 화면 밖에 있어요.",
    "지금까지 공개된 흐름만으로는 다시 올라설 이유를 찾기 쉽지 않아요.",
    "고점에서 멀어진 시간은 길어졌고, 이후는 아직 닫혀 있어요.",
    "이 순간에는 손실보다 방향을 잃었다는 느낌이 더 컸을 수 있어요.",
    "이제 막 가장 무거운 구간에 들어왔을 뿐, 다음 장면은 아직 보이지 않아요.",
  ],
  deeper_drawdown: [
    "이번 달은 손실이 더 깊어졌어요. 바닥을 확신하긴 아직 일러요.",
    "버티고 있었지만 계좌는 더 낮아졌어요. 기대보다 의심이 커지는 구간이에요.",
    "낙폭이 다시 벌어졌어요. 반등 신호로 받아들이기엔 근거가 부족해요.",
    "하락이 한 번 더 이어지면, 기다림 자체가 흔들리기 시작해요.",
    "잠깐의 기대가 있었더라도 이번 달 흐름은 다시 신중하게 만들어요.",
    "이 정도 낙폭이 이어지면, 추가 하락 가능성을 먼저 떠올리게 돼요.",
    "손실이 더 커진 달에는 버티는 이유보다 멈추고 싶은 마음이 앞서기 쉬워요.",
  ],
  sideways_stagnation: [
    "더 빠지진 않았지만 회복도 아직 멀어요.",
    "나쁜 소식은 멈췄지만, 좋아졌다고 말하긴 어려워요.",
    "계좌는 크게 달라지지 않았어요. 기다림만 길어지는 구간이에요.",
    "움직임은 작지만 안도감도 크지 않아요. 시간이 더 무겁게 느껴져요.",
    "하락은 멈춘 듯해도, 다시 들고 갈 확신은 쉽게 돌아오지 않아요.",
    "좋아졌다고 말하긴 어렵고, 포기하기엔 애매한 시간이 이어져요.",
    "큰 변화가 없는 달이 길어질수록 투자 판단은 더 흐려지기 쉬워요.",
    "회복이 보이지 않는 횡보는 손실만큼이나 버티기 어려워요.",
  ],
  uncertain_rebound: [
    "반등은 보이지만 아직 안심하긴 어려워요.",
    "올라오고는 있지만, 이 흐름이 이어질지 확신하긴 일러요.",
    "잠시 숨을 돌리는 모습이지만, 다시 꺾일 가능성도 여전해요.",
    "계좌는 회복 쪽으로 움직였지만 아직 믿음으로 바뀔 만큼은 아니에요.",
    "좋아진 달이지만, 몇 번 더 확인하고 싶어지는 구간이에요.",
    "반등은 시작됐어도 손실의 기억이 아직 더 크게 남아 있어요.",
    "희망이 조금 보이지만, 이 정도로 방향이 바뀌었다고 단정하긴 어려워요.",
  ],
  approaching_recovery: [
    "드디어 회복의 가능성이 시야에 들어오기 시작해요.",
    "손실 폭이 눈에 띄게 줄었어요. 분위기가 조금 달라져요.",
    "오랜 기다림 끝에, 전고점이 다시 현실적인 목표처럼 보이기 시작해요.",
    "이제는 버틴 시간이 의미가 있었을지 모른다는 생각이 들어요.",
    "흐름이 달라지고 있어요. 회복이 막연한 기대만은 아니게 돼요.",
    "계좌의 방향이 분명히 나아졌어요. 다만 아직 끝났다고 볼 수는 없어요.",
    "회복이 가까워질수록, 그동안의 버팀이 결과로 이어질 가능성이 커져요.",
  ],
  recovered_or_near_recovery: [
    "드디어 전고점이 다시 시야에 들어왔어요.",
    "길었던 기다림이 눈에 보이는 결과로 바뀌기 시작해요.",
    "버틴 시간이 단순한 인내가 아니라 결과로 연결되는 순간이에요.",
    "이제는 회복이 가능성보다 현실에 가깝게 느껴져요.",
    "한때 멀어졌던 고점이 다시 손에 닿을 거리로 돌아왔어요.",
    "가장 무거웠던 시간은 지나가고, 기다림의 의미가 분명해져요.",
    "견디는 국면에서 회복을 확인하는 국면으로 넘어오는 순간이에요.",
  ],
};

const BADGE_LABELS: Record<HistoricalMomentMessageState, string> = {
  historical_moment: "당시 시점",
  deeper_drawdown: "손실 확대 구간",
  sideways_stagnation: "긴 정체 구간",
  uncertain_rebound: "불확실한 반등",
  approaching_recovery: "회복 접근 구간",
  recovered_or_near_recovery: "회복 가시권",
};

const ENDURANCE_LABEL_TEMPLATES: Record<
  HistoricalMomentMessageState,
  Array<(span: string) => string>
> = {
  historical_moment: [
    (span) => `전고점 이후 ${span}째`,
    (span) => `고점에서 밀린 뒤 ${span}`,
    (span) => `저점에 도착하기까지 ${span}`,
    (span) => `버티던 시간이 ${span}째인 시점`,
    (span) => `전고점이 멀어진 지 ${span}`,
  ],
  deeper_drawdown: [
    (span) => `손실이 더 깊어진 ${span}째`,
    (span) => `전고점 이후 ${span}째 버티는 중`,
    (span) => `반등을 믿기엔 아직 이른 ${span}째`,
    (span) => `저점을 다시 낮춘 ${span}째`,
    (span) => `고점에서 밀린 뒤 ${span}째`,
    (span) => `계좌가 더 무거워진 ${span}째`,
  ],
  sideways_stagnation: [
    (span) => `회복 없이 ${span}째 기다리는 중`,
    (span) => `긴 조정 구간을 ${span}째 지나가는 중`,
    (span) => `전고점 이후 ${span}째 제자리`,
    (span) => `움직임 없이 ${span}째 버티는 중`,
    (span) => `회복 신호 없이 ${span}째`,
    (span) => `답을 못 본 채 ${span}째`,
  ],
  uncertain_rebound: [
    (span) => `저점 이후 ${span}째 흐름을 지켜보는 중`,
    (span) => `반등을 믿기엔 아직 이른 ${span}째`,
    (span) => `다시 오르는 듯한 ${span}째`,
    (span) => `불확실한 반등을 보는 ${span}째`,
    (span) => `전고점 이후 ${span}째, 방향을 확인하는 중`,
    (span) => `희망과 의심이 함께 있는 ${span}째`,
  ],
  approaching_recovery: [
    (span) => `회복 가능성이 보이는 ${span}째`,
    (span) => `전고점이 다시 시야에 들어온 ${span}째`,
    (span) => `버틴 시간이 의미를 띠는 ${span}째`,
    (span) => `회복에 가까워진 ${span}째`,
    (span) => `다시 고점이 보이기 시작한 ${span}째`,
    (span) => `조금씩 숨이 트이는 ${span}째`,
  ],
  recovered_or_near_recovery: [
    (span) => `전고점이 가까워진 ${span}째`,
    (span) => `회복이 가시권에 들어온 ${span}째`,
    (span) => `기다림이 성과로 바뀌는 ${span}째`,
    (span) => `다시 고점을 바라보는 ${span}째`,
    (span) => `버틴 시간이 드러나는 ${span}째`,
    (span) => `회복 문턱에 선 ${span}째`,
  ],
};

function getApproxMonthsBetween(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00`).getTime();
  const end = new Date(`${endDate}T00:00:00`).getTime();

  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    return 0;
  }

  return Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24 * 30.44)));
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

function getVisibleSnapshot(series: HistoricalMomentChartPoint[]): SeriesSnapshot {
  const currentPoint = series[series.length - 1]!;
  const previousPoint = series.length > 1 ? series[series.length - 2]! : currentPoint;
  let peakPoint = series[0]!;
  let previousLow = series[0]!.value;

  for (let index = 0; index < series.length; index += 1) {
    const point = series[index]!;

    if (point.value > peakPoint.value) {
      peakPoint = point;
    }

    if (index < series.length - 1) {
      previousLow = Math.min(previousLow, point.value);
    }
  }

  const currentDrawdownPct =
    peakPoint.value > 0 ? (currentPoint.value - peakPoint.value) / peakPoint.value : 0;
  const previousDrawdownPct =
    peakPoint.value > 0 ? (previousPoint.value - peakPoint.value) / peakPoint.value : 0;
  const monthChangePct =
    previousPoint.value > 0 ? (currentPoint.value - previousPoint.value) / previousPoint.value : 0;

  let flatStreak = 1;
  for (let index = series.length - 1; index >= 1; index -= 1) {
    const current = series[index]!;
    const previous = series[index - 1]!;
    const changePct = previous.value > 0 ? (current.value - previous.value) / previous.value : 0;

    if (Math.abs(changePct) <= 0.03) {
      flatStreak += 1;
      continue;
    }

    break;
  }

  return {
    currentDrawdownPct,
    currentPoint,
    currentValue: currentPoint.value,
    drawdownChangePct: currentDrawdownPct - previousDrawdownPct,
    flatStreak,
    lossAmount: Math.max(0, peakPoint.value - currentPoint.value),
    monthChangePct,
    monthsSincePeak: getApproxMonthsBetween(peakPoint.date, currentPoint.date),
    newLow: series.length > 1 && currentPoint.value <= previousLow * 0.995,
    peakValue: peakPoint.value,
  };
}

export function classifyHistoricalMomentState(
  visibleSeries: HistoricalMomentChartPoint[],
  revealedMonthCount: number,
): HistoricalMomentMessageState {
  if (!visibleSeries.length) {
    throw new Error("월별 메시지 해석에 필요한 시계열 데이터가 비어 있습니다.");
  }

  if (revealedMonthCount === 0 || visibleSeries.length === 1) {
    return "historical_moment";
  }

  const snapshot = getVisibleSnapshot(visibleSeries);

  if (snapshot.currentDrawdownPct >= -0.03 || snapshot.currentValue >= snapshot.peakValue * 0.985) {
    return "recovered_or_near_recovery";
  }

  if (
    snapshot.newLow ||
    snapshot.monthChangePct <= -0.05 ||
    snapshot.drawdownChangePct <= -0.035
  ) {
    return "deeper_drawdown";
  }

  if (
    snapshot.currentDrawdownPct >= -0.12 &&
    (snapshot.drawdownChangePct >= 0.05 || snapshot.monthChangePct >= 0.05)
  ) {
    return "approaching_recovery";
  }

  if (snapshot.monthChangePct >= 0.035 && snapshot.currentDrawdownPct <= -0.12) {
    return "uncertain_rebound";
  }

  if (
    Math.abs(snapshot.monthChangePct) <= 0.03 &&
    Math.abs(snapshot.drawdownChangePct) <= 0.02 &&
    snapshot.currentDrawdownPct <= -0.08
  ) {
    return "sideways_stagnation";
  }

  if (snapshot.currentDrawdownPct >= -0.12 && snapshot.drawdownChangePct > 0.02) {
    return "approaching_recovery";
  }

  if (snapshot.monthChangePct > 0) {
    return "uncertain_rebound";
  }

  return "sideways_stagnation";
}

function buildProgressLabel(revealedMonthCount: number) {
  if (revealedMonthCount === 0) {
    return "가장 힘들었던 순간";
  }

  return `${formatMonthSpan(revealedMonthCount)} 뒤`;
}

function selectVariant<T>(pool: T[], seed: number) {
  return pool[Math.abs(seed) % pool.length]!;
}

function buildEnduranceLabel(
  state: HistoricalMomentMessageState,
  snapshot: SeriesSnapshot,
  revealedMonthCount: number,
) {
  if (snapshot.monthsSincePeak <= 0) {
    return "전고점 직후";
  }

  if (state === "recovered_or_near_recovery" && snapshot.currentDrawdownPct >= 0) {
    return selectVariant(
      [
        "전고점을 다시 넘어선 시점",
        "기다림이 결과로 바뀌는 시점",
        "버팀의 무게가 달라지는 시점",
        "회복을 확인한 뒤의 흐름",
        "이제는 다시 고점을 말할 수 있는 구간",
      ],
      revealedMonthCount,
    );
  }

  const spanLabel = formatMonthSpan(snapshot.monthsSincePeak);
  return selectVariant(ENDURANCE_LABEL_TEMPLATES[state], revealedMonthCount)(spanLabel);
}

function formatRemainingToPeak(snapshot: SeriesSnapshot) {
  return `${Math.max(0, -snapshot.currentDrawdownPct * 100).toFixed(1)}%`;
}

function buildStatLine(
  state: HistoricalMomentMessageState,
  snapshot: SeriesSnapshot,
  revealedMonthCount: number,
) {
  const drawdownLabel = `전고점 대비 ${formatPercent(snapshot.currentDrawdownPct * 100)}`;
  const monthChangeLabel = `전월 대비 ${formatPercent(snapshot.monthChangePct * 100)}`;
  const remainingToPeak = formatRemainingToPeak(snapshot);

  if (state === "historical_moment") {
    return selectVariant(
      [
        `${drawdownLabel} · 전고점 이후 ${formatMonthSpan(snapshot.monthsSincePeak)}`,
        `직전 고점 대비 ${formatKrwCompact(snapshot.lossAmount)} 감소 · 이후 흐름은 아직 비공개`,
        `${drawdownLabel} · 회복 여부는 아직 알 수 없음`,
        `고점 대비 ${formatKrwCompact(snapshot.lossAmount)} 감소 · 저점 통과 여부 미확인`,
        `${drawdownLabel} · 다음 한 달도 아직 열리지 않았어요`,
      ],
      revealedMonthCount,
    );
  }

  if (state === "sideways_stagnation") {
    return selectVariant(
      [
        `${drawdownLabel} · ${Math.max(2, snapshot.flatStreak)}개월째 횡보`,
        `회복 없이 ${Math.max(2, snapshot.flatStreak)}개월째 비슷한 흐름`,
        `${monthChangeLabel} · ${drawdownLabel}`,
        `반등 신호 없이 ${Math.max(2, snapshot.flatStreak)}개월째 · ${drawdownLabel}`,
        `고점까지 아직 ${remainingToPeak} · 움직임은 제한적`,
      ],
      revealedMonthCount,
    );
  }

  if (state === "recovered_or_near_recovery" && snapshot.currentDrawdownPct >= 0) {
    return selectVariant(
      [
        "전고점 회복 완료 · 이후 흐름도 볼 수 있어요",
        "고점 재돌파 · 기다림의 성격이 달라졌어요",
        "더 이상 낙폭 구간이 아닙니다 · 이후 경로 확인 가능",
        "회복 확인 · 이제 이후 결과를 함께 볼 수 있어요",
        `${monthChangeLabel} · 전고점 회복 이후 구간`,
      ],
      revealedMonthCount,
    );
  }

  if (state === "deeper_drawdown") {
    return selectVariant(
      [
        `${monthChangeLabel} · ${drawdownLabel}`,
        `새 저점 형성 · ${drawdownLabel}`,
        `직전 달보다 더 낮은 구간 · ${drawdownLabel}`,
        `직전 고점 대비 ${formatKrwCompact(snapshot.lossAmount)} 감소`,
        `${monthChangeLabel} · 고점까지 아직 ${remainingToPeak} 남음`,
      ],
      revealedMonthCount,
    );
  }

  if (state === "uncertain_rebound") {
    return selectVariant(
      [
        `${monthChangeLabel} · 아직 ${remainingToPeak} 남음`,
        `반등은 있었지만 아직 ${drawdownLabel}`,
        `저점에서 벗어나는 중 · 고점까지 ${remainingToPeak}`,
        `${monthChangeLabel} · 회복 판단은 아직 이릅니다`,
        `상승 전환 조짐 · 아직 ${drawdownLabel}`,
      ],
      revealedMonthCount,
    );
  }

  if (state === "approaching_recovery") {
    return selectVariant(
      [
        `${monthChangeLabel} · 전고점까지 ${remainingToPeak}`,
        `손실 폭 축소 · 아직 ${remainingToPeak} 남음`,
        `회복이 가까워지는 흐름 · ${drawdownLabel}`,
        `저점에서는 벗어남 · 고점까지 ${remainingToPeak}`,
        `손실 대부분 해소 · 아직 ${remainingToPeak}`,
      ],
      revealedMonthCount,
    );
  }

  return selectVariant(
    [
      `전고점까지 아직 ${remainingToPeak}`,
      `손실 대부분 해소 · 남은 간격 ${remainingToPeak}`,
      `${monthChangeLabel} · 회복까지 ${remainingToPeak}`,
      `고점이 가까워진 구간 · 아직 ${remainingToPeak}`,
      drawdownLabel,
    ],
    revealedMonthCount,
  );
}

function selectMessage(
  state: HistoricalMomentMessageState,
  revealedMonthCount: number,
  previousState: HistoricalMomentMessageState | null,
) {
  const pool = MESSAGE_POOLS[state];
  let messageIndex = Math.abs(revealedMonthCount) % pool.length;

  if (previousState === state && pool.length > 1) {
    messageIndex = (messageIndex + 1) % pool.length;
  }

  return pool[messageIndex]!;
}

export function buildHistoricalMomentMessage(input: {
  revealedMonthCount: number;
  visibleSeries: HistoricalMomentChartPoint[];
}): HistoricalMomentMessageData {
  const { revealedMonthCount, visibleSeries } = input;

  if (!visibleSeries.length) {
    throw new Error("월별 메시지를 만들기 위한 공개 시계열이 비어 있습니다.");
  }

  const state = classifyHistoricalMomentState(visibleSeries, revealedMonthCount);
  const previousState =
    revealedMonthCount > 0 && visibleSeries.length > 1
      ? classifyHistoricalMomentState(visibleSeries.slice(0, -1), revealedMonthCount - 1)
      : null;
  const snapshot = getVisibleSnapshot(visibleSeries);

  return {
    badge: BADGE_LABELS[state],
    enduranceLabel: buildEnduranceLabel(state, snapshot, revealedMonthCount),
    message: selectMessage(state, revealedMonthCount, previousState),
    progressLabel: buildProgressLabel(revealedMonthCount),
    state,
    statLine: buildStatLine(state, snapshot, revealedMonthCount),
  };
}
