export type PrincipleFocus = "drawdown" | "endurance" | "monthly";
export type PrincipleDrawdownTolerance = "-20%" | "-30%" | "-50%";
export type PrincipleReviewCycle = "1년" | "3개월" | "6개월";

export interface TenYearPrincipleInput {
  assetLabel: string;
  difficultyLabel: string | null;
  drawdownTolerance: PrincipleDrawdownTolerance;
  focus: PrincipleFocus;
  investmentMode: "lump-sum" | "monthly";
  maxDrawdownPct: number | null;
  recovered: boolean | null;
  recoveryMonths: number | null;
  reviewCycle: PrincipleReviewCycle;
}

export interface TenYearPrincipleCard {
  headline: string;
  insightLines: string[];
  promiseLines: string[];
  shareText: string;
  summary: string;
  title: string;
}

export const PRINCIPLE_FOCUS_OPTIONS: Array<{
  description: string;
  id: PrincipleFocus;
  label: string;
}> = [
  {
    description: "좋은 결과까지 가는 동안 견뎌야 했던 시간을 봅니다.",
    id: "endurance",
    label: "오래 버티기",
  },
  {
    description: "예측보다 반복 가능한 납입과 생활 리듬을 봅니다.",
    id: "monthly",
    label: "꾸준히 모으기",
  },
  {
    description: "수익의 크기보다 내가 견딜 수 있는 낙폭을 먼저 봅니다.",
    id: "drawdown",
    label: "큰 하락 피하기",
  },
];

export const PRINCIPLE_DRAWDOWN_TOLERANCE_OPTIONS: PrincipleDrawdownTolerance[] = [
  "-20%",
  "-30%",
  "-50%",
];

export const PRINCIPLE_REVIEW_CYCLE_OPTIONS: PrincipleReviewCycle[] = ["3개월", "6개월", "1년"];

function formatDrawdown(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "큰 하락";
  }

  return `${Math.abs(value).toFixed(1)}% 하락`;
}

function isSevereDrawdown(value: number | null) {
  return value !== null && Number.isFinite(value) && value <= -45;
}

function isMildDrawdown(value: number | null) {
  return value !== null && Number.isFinite(value) && value > -15;
}

function buildRecoveryText(input: TenYearPrincipleInput) {
  if (input.recovered === false) {
    return "아직 이전 고점을 되찾지 못했습니다. 낙관보다 기준이 먼저 필요한 구간입니다.";
  }

  if (input.recovered === true && input.recoveryMonths !== null) {
    if (input.recoveryMonths <= 1) {
      return "회복은 빨랐지만, 흔들림이 없었다는 뜻은 아닙니다.";
    }

    if (input.recoveryMonths >= 18) {
      return `회복까지 ${input.recoveryMonths}개월이 걸렸습니다. 기다림 자체가 성과의 일부였습니다.`;
    }

    return `회복까지 ${input.recoveryMonths}개월이 걸렸습니다. 그 시간을 지나야 다음 장면을 볼 수 있었습니다.`;
  }

  return "회복까지 걸린 시간도 함께 봐야 합니다. 수익은 늘 시간의 대가와 함께 옵니다.";
}

function buildHeadline(input: TenYearPrincipleInput) {
  if (input.investmentMode === "monthly" || input.focus === "monthly") {
    return "나는 예측보다 반복을 믿고, 흔들리는 달에도 계획을 멈추지 않습니다.";
  }

  if (input.focus === "drawdown") {
    return "나는 감당할 수 없는 하락을 수익의 대가로 착각하지 않습니다.";
  }

  if (isSevereDrawdown(input.maxDrawdownPct)) {
    return "나는 좋은 결과만 보지 않고, 그 결과까지 버틴 시간을 함께 기억합니다.";
  }

  return "나는 빠른 판단보다 오래 지킬 수 있는 기준을 선택합니다.";
}

function buildLessonLine(input: TenYearPrincipleInput) {
  if (input.focus === "drawdown") {
    return "이 기록은 무엇을 살지보다 어디까지 흔들려도 괜찮은지를 먼저 묻습니다.";
  }

  if (input.investmentMode === "monthly" || input.focus === "monthly") {
    return "이 기록은 한 번의 정답보다 계속 넣을 수 있는 구조가 더 중요하다는 점을 보여줍니다.";
  }

  if (isSevereDrawdown(input.maxDrawdownPct)) {
    return "이 기록은 수익률이 아니라 체력의 문제였습니다.";
  }

  if (isMildDrawdown(input.maxDrawdownPct)) {
    return "이 기록은 무리한 확신보다 꾸준한 기준이 더 오래 간다는 점을 보여줍니다.";
  }

  return "이 기록은 좋은 결과에도 흔들리는 시간이 함께 있었다는 사실을 남깁니다.";
}

function buildPromiseLines(input: TenYearPrincipleInput) {
  const cycleLine =
    input.reviewCycle === "1년"
      ? "1년에 한 번만, 내 원칙이 여전히 유효한지 점검합니다."
      : `${input.reviewCycle}마다 한 번만, 감정이 아니라 원칙이 유효한지 점검합니다.`;

  if (input.focus === "monthly" || input.investmentMode === "monthly") {
    return [
      "시장의 소음보다 내가 반복할 수 있는 금액을 먼저 지킵니다.",
      "오른 달보다 멈추지 않은 달을 더 중요하게 봅니다.",
      cycleLine,
    ];
  }

  if (input.focus === "drawdown") {
    return [
      `${input.drawdownTolerance}를 넘는 흔들림은 계획을 다시 점검하는 신호로 봅니다.`,
      "감당하기 어려운 변동성은 욕심이 아니라 위험으로 다룹니다.",
      cycleLine,
    ];
  }

  if (isSevereDrawdown(input.maxDrawdownPct)) {
    return [
      "큰 하락이 와도 처음 세운 이유가 무너졌는지부터 봅니다.",
      "남의 수익률보다 내가 버틸 수 있는 기간을 먼저 봅니다.",
      cycleLine,
    ];
  }

  return [
    "하락을 피해야 할 사건이 아니라 미리 알고 있는 구간으로 봅니다.",
    "남의 속도보다 내 계획의 지속 가능성을 먼저 봅니다.",
    cycleLine,
  ];
}

export function buildTenYearPrincipleCard(input: TenYearPrincipleInput): TenYearPrincipleCard {
  const drawdownText = formatDrawdown(input.maxDrawdownPct);
  const headline = buildHeadline(input);
  const recoveryText = buildRecoveryText(input);
  const insightLines = [
    `${input.assetLabel}의 10년은 결과만 떼어놓고 보면 쉬워 보일 수 있습니다.`,
    `하지만 중간에는 ${drawdownText}이 있었고, ${recoveryText}`,
    buildLessonLine(input),
  ];
  const promiseLines = buildPromiseLines(input);
  const summary = `${input.assetLabel} 기준 · ${drawdownText} · ${input.reviewCycle} 점검`;

  return {
    headline,
    insightLines,
    promiseLines,
    shareText: [
      "나의 10년 원칙",
      "",
      headline,
      "",
      "이번 비교가 남긴 기준",
      ...insightLines.map((line) => `- ${line}`),
      "",
      "앞으로 지킬 기준",
      ...promiseLines.map((line) => `- ${line}`),
      "",
      "RegretZero",
    ].join("\n"),
    summary,
    title: "나의 10년 원칙",
  };
}
