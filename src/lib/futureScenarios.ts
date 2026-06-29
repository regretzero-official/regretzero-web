export type ScenarioKey = "conservative" | "base" | "aggressive";

export type RiskProfile = "GROWTH" | "BALANCED" | "DEFENSIVE";

export type AssetClassKey =
  | "ai_infra"
  | "semiconductor"
  | "energy"
  | "robotics"
  | "bio"
  | "digital_asset";

export type FutureInputs = {
  initialKrw: number;
  monthlyKrw: number;
  years: number;
  riskProfile: RiskProfile;
};

export type FutureScenarioResult = {
  scenario: ScenarioKey;
  path: number[];
  terminalKrw: number;
  maxDrawdown: number;
  recoveryMonths: number;
  cagrRange: [number, number];
};

export type ActionPlan90d = {
  scenario: ScenarioKey;
  weeks: Array<{
    window: string;
    title: string;
    rules: string[];
  }>;
};

const SCENARIO_ORDER: ScenarioKey[] = ["conservative", "base", "aggressive"];

export const ASSET_CLASS_LABELS: Record<AssetClassKey, string> = {
  ai_infra: "AI 인프라",
  semiconductor: "반도체",
  energy: "에너지",
  robotics: "로보틱스",
  bio: "바이오",
  digital_asset: "디지털 자산",
};

export const ASSET_CLASS_REASONS: Record<AssetClassKey, string> = {
  ai_infra: "AI 서비스가 늘어날수록 결국 칩, 서버, 데이터센터 인프라 수요가 같이 커질 수 있습니다.",
  semiconductor: "연산 수요가 늘 때 가장 직접적으로 실적 개선이 연결될 가능성이 큰 축입니다.",
  energy: "전력망과 에너지 공급은 데이터센터 확장과 제조 투자에서 빠지기 어려운 기반입니다.",
  robotics: "인건비와 생산성 압박이 커질수록 자동화 장비와 로봇 관련 수요가 다시 커질 수 있습니다.",
  bio: "긴 호흡으로 보면 신약, 진단, 의료 기술은 경기와 별개로 꾸준히 기회를 만드는 영역입니다.",
  digital_asset: "전통 자산과 다른 흐름을 기대할 때 분산 관점에서 일부 편입을 검토할 수 있는 축입니다.",
};

export const DEFAULT_ALLOCATIONS: Record<RiskProfile, Record<AssetClassKey, number>> = {
  DEFENSIVE: {
    ai_infra: 0.18,
    semiconductor: 0.2,
    energy: 0.22,
    robotics: 0.12,
    bio: 0.18,
    digital_asset: 0.1,
  },
  BALANCED: {
    ai_infra: 0.22,
    semiconductor: 0.24,
    energy: 0.16,
    robotics: 0.14,
    bio: 0.14,
    digital_asset: 0.1,
  },
  GROWTH: {
    ai_infra: 0.24,
    semiconductor: 0.24,
    energy: 0.1,
    robotics: 0.16,
    bio: 0.1,
    digital_asset: 0.16,
  },
};

const CLASS_ASSUMPTIONS: Record<AssetClassKey, { ret: number; vol: number }> = {
  ai_infra: { ret: 0.135, vol: 0.23 },
  semiconductor: { ret: 0.145, vol: 0.26 },
  energy: { ret: 0.085, vol: 0.16 },
  robotics: { ret: 0.12, vol: 0.22 },
  bio: { ret: 0.11, vol: 0.24 },
  digital_asset: { ret: 0.16, vol: 0.48 },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function monthlyRateFromAnnual(annual: number) {
  return Math.pow(1 + annual, 1 / 12) - 1;
}

function weightedAssumptions(allocation: Record<AssetClassKey, number>) {
  const keys = Object.keys(allocation) as AssetClassKey[];
  const ret = keys.reduce((sum, key) => sum + allocation[key] * CLASS_ASSUMPTIONS[key].ret, 0);
  const vol = keys.reduce((sum, key) => sum + allocation[key] * CLASS_ASSUMPTIONS[key].vol, 0);
  return { ret, vol };
}

function riskTilt(profile: RiskProfile) {
  if (profile === "DEFENSIVE") return { ret: -0.012, vol: -0.03 };
  if (profile === "GROWTH") return { ret: 0.018, vol: 0.04 };
  return { ret: 0, vol: 0 };
}

function scenarioAdjustments(baseAnnualRet: number, baseAnnualVol: number) {
  const conservativeRet = clamp(baseAnnualRet - 0.035, 0.03, 0.14);
  const baseRet = clamp(baseAnnualRet, 0.05, 0.2);
  const aggressiveRet = clamp(baseAnnualRet + 0.05, 0.09, 0.3);

  const conservativeVol = clamp(baseAnnualVol * 0.75, 0.06, 0.25);
  const baseVol = clamp(baseAnnualVol, 0.1, 0.35);
  const aggressiveVol = clamp(baseAnnualVol * 1.3, 0.14, 0.55);

  return {
    conservative: { ret: conservativeRet, vol: conservativeVol, band: 0.02 },
    base: { ret: baseRet, vol: baseVol, band: 0.03 },
    aggressive: { ret: aggressiveRet, vol: aggressiveVol, band: 0.045 },
  };
}

function simulatePath(
  months: number,
  initialKrw: number,
  monthlyKrw: number,
  annualReturn: number,
  annualVol: number,
  phaseSeed: number,
) {
  const path: number[] = [initialKrw];
  const monthlyRet = monthlyRateFromAnnual(annualReturn);
  const monthlyVol = annualVol / Math.sqrt(12);

  let value = initialKrw;
  let peak = initialKrw;
  let maxDrawdown = 0;
  let troughMonth = 0;
  let recoveryMonth = 0;
  let inDrawdown = false;

  for (let month = 1; month <= months; month += 1) {
    const cycle = Math.sin(month * 0.85 + phaseSeed) * 0.55 + Math.cos(month * 0.37 + phaseSeed) * 0.45;
    const shock = cycle * monthlyVol * 0.35;
    const step = 1 + monthlyRet + shock;
    value = Math.max(0, (value + Math.max(0, monthlyKrw)) * Math.max(0.4, step));
    path.push(value);

    if (value >= peak) {
      peak = value;
      if (inDrawdown) {
        inDrawdown = false;
        if (recoveryMonth === 0) recoveryMonth = month - troughMonth;
      }
      continue;
    }

    if (peak > 0) {
      const drawdown = (peak - value) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
        troughMonth = month;
        inDrawdown = true;
      }
    }
  }

  return {
    path,
    maxDrawdown,
    recoveryMonths: recoveryMonth || Math.max(6, Math.round(months * 0.2)),
  };
}

export function simulateFutureScenarios(
  inputs: FutureInputs,
  allocation: Record<AssetClassKey, number>,
): FutureScenarioResult[] {
  const months = Math.max(12, Math.round(inputs.years * 12));
  const weighted = weightedAssumptions(allocation);
  const tilt = riskTilt(inputs.riskProfile);
  const assumptions = scenarioAdjustments(weighted.ret + tilt.ret, weighted.vol + tilt.vol);

  const raw = SCENARIO_ORDER.map((scenario, index) => {
    const conf = assumptions[scenario];
    const simulated = simulatePath(
      months,
      Math.max(1_000_000, inputs.initialKrw),
      Math.max(0, inputs.monthlyKrw),
      conf.ret,
      conf.vol,
      1.7 + index * 0.9,
    );

    return {
      scenario,
      path: simulated.path,
      terminalKrw: simulated.path[simulated.path.length - 1],
      maxDrawdown: simulated.maxDrawdown,
      recoveryMonths: simulated.recoveryMonths,
      cagrRange: [
        Math.max(0, conf.ret - conf.band) * 100,
        (conf.ret + conf.band) * 100,
      ] as [number, number],
    } satisfies FutureScenarioResult;
  });

  const conservative = raw[0];
  const base = raw[1];
  const aggressive = raw[2];

  if (base.terminalKrw < conservative.terminalKrw) {
    const delta = conservative.terminalKrw - base.terminalKrw;
    base.terminalKrw += delta;
    base.path[base.path.length - 1] = base.terminalKrw;
  }
  if (aggressive.terminalKrw < base.terminalKrw) {
    const delta = base.terminalKrw - aggressive.terminalKrw;
    aggressive.terminalKrw += delta;
    aggressive.path[aggressive.path.length - 1] = aggressive.terminalKrw;
  }

  return raw;
}

export function buildActionPlan(inputs: FutureInputs, selectedScenario: ScenarioKey): ActionPlan90d {
  const amountBand =
    inputs.monthlyKrw >= 1_000_000 ? "넉넉한 적립" : inputs.monthlyKrw >= 300_000 ? "보통 적립" : "가벼운 적립";
  const scenarioLabel =
    selectedScenario === "conservative"
      ? "보수적 기준"
      : selectedScenario === "aggressive"
        ? "공격적 기준"
        : "기준 시나리오";

  return {
    scenario: selectedScenario,
    weeks: [
      {
        window: "1~4주",
        title: `매수 규칙 정리 (${scenarioLabel})`,
        rules: [
          `${amountBand}으로 월 예산을 먼저 확정합니다.`,
          "한 번에 몰아넣지 말고 4주로 나눠 같은 요일에 집행합니다.",
          "매수 전에는 이유 1줄, 리스크 1줄, 철회 조건 1줄을 반드시 적습니다.",
        ],
      },
      {
        window: "5~8주",
        title: "흔들릴 때 지킬 기준 만들기",
        rules: [
          "수익률보다 규칙 준수 여부를 먼저 체크합니다.",
          "변동성이 커지면 비중 확대보다 예정된 적립만 유지합니다.",
          "공포, 조급함, 무감각 중 어떤 감정이 컸는지 간단히 기록합니다.",
        ],
      },
      {
        window: "9~12주",
        title: "비중 점검과 다음 90일 준비",
        rules: [
          "목표 비중에서 5% 이상 벗어나면 리밸런싱 여부를 검토합니다.",
          "한 종목이 너무 커졌다면 새 돈은 부족한 축에 먼저 배분합니다.",
          "다음 90일 자동이체와 점검 날짜를 미리 캘린더에 넣습니다.",
        ],
      },
    ],
  };
}
