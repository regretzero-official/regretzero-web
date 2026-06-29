export type FutureScenarioPresetId = "base" | "conservative" | "optimistic";

export interface FutureScenarioInput {
  initialKrw: number;
  monthlyKrw: number;
  years: 10;
}

export interface FutureStressTestInput extends FutureScenarioInput {
  assetLabel: string;
  referenceAnnualReturnPct: number;
  referenceDrawdownPct: number | null;
  referenceRecoveryMonths: number | null;
}

export interface FutureCompoundInput {
  initialKrw: number;
  monthlyKrw: number;
  years: number;
}

export interface FutureScenarioPreset {
  annualReturnPct: number;
  id: FutureScenarioPresetId;
  label: string;
  stressDrawdownPct: number;
  tone: string;
}

export interface FutureScenarioResult extends Omit<FutureScenarioPreset, "id"> {
  futureValueKrw: number;
  profitKrw: number;
  presetId: FutureScenarioPresetId;
  returnPct: number;
  stressValueKrw: number;
  totalInvestedKrw: number;
}

export interface FutureStressEvent {
  body: string;
  id: "final" | "first_drop" | "second_drop" | "stagnation";
  investedKrw: number;
  month: number;
  shockLabel: string;
  step: number;
  title: string;
  valueAfterKrw: number;
  valueBeforeKrw: number;
}

export interface FutureStressTestResult {
  annualReturnPct: number;
  assetLabel: string;
  events: FutureStressEvent[];
  finalValueKrw: number;
  profitKrw: number;
  returnPct: number;
  totalInvestedKrw: number;
  worstDrawdownPct: number;
}

export const FUTURE_SCENARIO_YEARS = 10;

export const FUTURE_SCENARIO_PRESETS: FutureScenarioPreset[] = [
  {
    annualReturnPct: 3,
    id: "conservative",
    label: "보수",
    stressDrawdownPct: -20,
    tone: "낮은 기대수익률에서도 중간 하락을 견딜 수 있는지 보는 가정입니다.",
  },
  {
    annualReturnPct: 6,
    id: "base",
    label: "기준",
    stressDrawdownPct: -35,
    tone: "중간에 -35%까지 밀리는 구간을 감당할 수 있는지 보는 가정입니다.",
  },
  {
    annualReturnPct: 9,
    id: "optimistic",
    label: "낙관",
    stressDrawdownPct: -50,
    tone: "금액은 커 보이지만, 중간 하락도 더 크게 가정합니다.",
  },
];

function clampMoney(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.round(value));
}

function clampPercent(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

export function calculateFutureCompoundValue({
  annualReturnPct,
  initialKrw,
  monthlyKrw,
  years,
}: FutureCompoundInput & { annualReturnPct: number }) {
  const months = Math.max(1, Math.round(years * 12));
  const monthlyRate = Math.pow(1 + annualReturnPct / 100, 1 / 12) - 1;
  let value = clampMoney(initialKrw);

  for (let month = 0; month < months; month += 1) {
    value = value * (1 + monthlyRate) + clampMoney(monthlyKrw);
  }

  return value;
}

function calculateFutureValueAtMonth({
  annualReturnPct,
  initialKrw,
  month,
  monthlyKrw,
}: {
  annualReturnPct: number;
  initialKrw: number;
  month: number;
  monthlyKrw: number;
}) {
  const monthlyRate = Math.pow(1 + annualReturnPct / 100, 1 / 12) - 1;
  let value = clampMoney(initialKrw);

  for (let currentMonth = 0; currentMonth < month; currentMonth += 1) {
    value = value * (1 + monthlyRate) + clampMoney(monthlyKrw);
  }

  return value;
}

function getInvestedAtMonth(initialKrw: number, monthlyKrw: number, month: number) {
  return clampMoney(initialKrw) + clampMoney(monthlyKrw) * month;
}

export function deriveAnnualReturnPctFromMultiple(
  multiple: number | null | undefined,
  years = FUTURE_SCENARIO_YEARS,
) {
  if (!multiple || !Number.isFinite(multiple) || multiple <= 0) {
    return 6;
  }

  return clampPercent((Math.pow(multiple, 1 / years) - 1) * 100, -20, 80);
}

export function buildFutureStressTest(input: FutureStressTestInput): FutureStressTestResult {
  const initialKrw = clampMoney(input.initialKrw);
  const monthlyKrw = clampMoney(input.monthlyKrw);
  const annualReturnPct = clampPercent(input.referenceAnnualReturnPct, -20, 80);
  const referenceDrawdownAbs = Math.abs(input.referenceDrawdownPct ?? -35);
  const firstDropAbs = clampPercent(referenceDrawdownAbs * 0.65, 25, 45);
  const secondDropAbs = clampPercent(referenceDrawdownAbs, 35, 80);
  const stagnationMonths = Math.max(12, Math.min(36, input.referenceRecoveryMonths ?? 24));
  const finalValueKrw = calculateFutureCompoundValue({
    annualReturnPct,
    initialKrw,
    monthlyKrw,
    years: FUTURE_SCENARIO_YEARS,
  });
  const totalInvestedKrw = getInvestedAtMonth(initialKrw, monthlyKrw, FUTURE_SCENARIO_YEARS * 12);
  const firstDropBefore = calculateFutureValueAtMonth({
    annualReturnPct,
    initialKrw,
    month: 12,
    monthlyKrw,
  });
  const firstDropAfter = firstDropBefore * (1 - firstDropAbs / 100);
  const stagnationBefore = calculateFutureValueAtMonth({
    annualReturnPct,
    initialKrw,
    month: 36,
    monthlyKrw,
  });
  const stagnationAfter = Math.max(
    firstDropAfter + monthlyKrw * stagnationMonths,
    getInvestedAtMonth(initialKrw, monthlyKrw, 36),
  );
  const secondDropBefore = calculateFutureValueAtMonth({
    annualReturnPct,
    initialKrw,
    month: 60,
    monthlyKrw,
  });
  const secondDropAfter = secondDropBefore * (1 - secondDropAbs / 100);
  const profitKrw = finalValueKrw - totalInvestedKrw;
  const returnPct = totalInvestedKrw > 0 ? (finalValueKrw / totalInvestedKrw - 1) * 100 : 0;

  return {
    annualReturnPct,
    assetLabel: input.assetLabel,
    events: [
      {
        body: "처음부터 순조롭게 오르는 장면만 가정하지 않습니다. 여기서 흔들리면 긴 계획은 시작도 하기 어렵습니다.",
        id: "first_drop",
        investedKrw: getInvestedAtMonth(initialKrw, monthlyKrw, 12),
        month: 12,
        shockLabel: `-${firstDropAbs.toFixed(0)}%`,
        step: 1,
        title: "첫 번째 하락",
        valueAfterKrw: firstDropAfter,
        valueBeforeKrw: firstDropBefore,
      },
      {
        body: "폭락은 아니지만 오래 지루한 구간입니다. 남들은 더 빨리 가는 것처럼 보일 때 기준이 흔들립니다.",
        id: "stagnation",
        investedKrw: getInvestedAtMonth(initialKrw, monthlyKrw, 36),
        month: 36,
        shockLabel: `${stagnationMonths}개월 정체`,
        step: 2,
        title: "긴 정체",
        valueAfterKrw: stagnationAfter,
        valueBeforeKrw: stagnationBefore,
      },
      {
        body: "회복하는 듯하다가 다시 크게 밀리는 장면입니다. 두 번째 버팀에서 많은 사람이 기준을 바꿉니다.",
        id: "second_drop",
        investedKrw: getInvestedAtMonth(initialKrw, monthlyKrw, 60),
        month: 60,
        shockLabel: `-${secondDropAbs.toFixed(0)}%`,
        step: 3,
        title: "다시 찾아온 충격",
        valueAfterKrw: secondDropAfter,
        valueBeforeKrw: secondDropBefore,
      },
      {
        body: "미래를 맞힌 결과가 아닙니다. 방금 본 과거의 속도를 한 번 더 가정했을 때, 끝까지 남으면 어떤 크기가 되는지 보는 리허설입니다.",
        id: "final",
        investedKrw: totalInvestedKrw,
        month: 120,
        shockLabel: "끝까지 남기",
        step: 4,
        title: "끝까지 남았을 때",
        valueAfterKrw: finalValueKrw,
        valueBeforeKrw: finalValueKrw,
      },
    ],
    finalValueKrw,
    profitKrw,
    returnPct,
    totalInvestedKrw,
    worstDrawdownPct: -secondDropAbs,
  };
}

export function buildFutureScenarioResults(input: FutureScenarioInput): FutureScenarioResult[] {
  const initialKrw = clampMoney(input.initialKrw);
  const monthlyKrw = clampMoney(input.monthlyKrw);
  const years = FUTURE_SCENARIO_YEARS;
  const totalInvestedKrw = initialKrw + monthlyKrw * years * 12;

  return FUTURE_SCENARIO_PRESETS.map((preset) => {
    const { id, ...presetDetails } = preset;
    const futureValueKrw = calculateFutureCompoundValue({
      annualReturnPct: preset.annualReturnPct,
      initialKrw,
      monthlyKrw,
      years,
    });
    const profitKrw = futureValueKrw - totalInvestedKrw;
    const returnPct = totalInvestedKrw > 0 ? (futureValueKrw / totalInvestedKrw - 1) * 100 : 0;
    const stressValueKrw = futureValueKrw * (1 + preset.stressDrawdownPct / 100);

    return {
      ...presetDetails,
      futureValueKrw,
      profitKrw,
      presetId: id,
      returnPct,
      stressValueKrw,
      totalInvestedKrw,
    };
  });
}

export function buildFutureScenarioShareText({
  formatKrw,
  initialKrw,
  monthlyKrw,
  results,
}: {
  formatKrw: (value: number) => string;
  initialKrw: number;
  monthlyKrw: number;
  results: FutureScenarioResult[];
}) {
  return [
    "RegretZero 다음 10년 시나리오",
    "",
    `지금 ${formatKrw(initialKrw)}, 매달 ${formatKrw(monthlyKrw)}을 10년 동안 넣는다면`,
    "",
    ...results.map((result) => `${result.label} 가정: 약 ${formatKrw(result.futureValueKrw)}`),
    "",
    "미래 예측이 아니라 금액 감각을 잡기 위한 가정입니다.",
  ].join("\n");
}

export function buildFutureStressTestShareText({
  formatKrw,
  monthlyKrw,
  result,
}: {
  formatKrw: (value: number) => string;
  monthlyKrw: number;
  result: FutureStressTestResult;
}) {
  return [
    "RegretZero 미래 하락장 리허설",
    "",
    `${result.assetLabel}의 과거 속도를 다음 10년에 한 번 더 가정해봤습니다.`,
    `총 투입액: ${formatKrw(result.totalInvestedKrw)}`,
    `매달 납입: ${formatKrw(monthlyKrw)}`,
    `끝까지 남았을 때: 약 ${formatKrw(result.finalValueKrw)}`,
    `가장 큰 리허설 하락: ${result.worstDrawdownPct.toFixed(0)}%`,
    "",
    "미래 예측이 아니라 내가 어떤 흔들림까지 감당할 수 있는지 보는 리허설입니다.",
  ].join("\n");
}
