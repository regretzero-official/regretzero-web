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
  ai_infra: "AI 확산의 기반 수요가 지속되는 핵심 인프라 축입니다.",
  semiconductor: "연산 수요 증가의 직접 수혜를 받는 구조적 공급 축입니다.",
  energy: "전력과 저장 인프라 확충은 AI 시대의 필수 조건입니다.",
  robotics: "인력 대체와 생산성 향상 수요가 장기적으로 누적됩니다.",
  bio: "AI 기반 신약·정밀의료 전환으로 효율 개선이 기대됩니다.",
  digital_asset: "디지털 가치 저장 및 네트워크 자산군으로 분산 역할을 가집니다.",
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

  return { path, maxDrawdown, recoveryMonths: recoveryMonth || Math.max(6, Math.round(months * 0.2)) };
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
      cagrRange: [Math.max(0, conf.ret - conf.band) * 100, (conf.ret + conf.band) * 100] as [number, number],
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
  const amountBand = inputs.monthlyKrw >= 1_000_000 ? "상" : inputs.monthlyKrw >= 300_000 ? "중" : "기초";
  const scenarioLabel =
    selectedScenario === "conservative" ? "보수" : selectedScenario === "aggressive" ? "공격" : "기준";

  return {
    scenario: selectedScenario,
    weeks: [
      {
        window: "1~4주",
        title: `매수 규칙 정착 (${scenarioLabel} 시나리오)`,
        rules: [
          `주 1회, 월 적립금(${amountBand}) 기준 정기 매수`,
          "한 번에 몰빵하지 않고 4회 분할 진입",
          "매수 전 체크리스트 3개(밸류·추세·리스크) 기록",
        ],
      },
      {
        window: "5~8주",
        title: "점검 규칙 실행",
        rules: [
          "성과보다 규칙 준수율(%)을 먼저 점검",
          "최대낙폭 가정치 대비 현재 변동성 점검",
          "감정 로그 작성: 공포/조급/무감각 신호 기록",
        ],
      },
      {
        window: "9~12주",
        title: "리밸런싱 규칙 적용",
        rules: [
          "목표 비중 대비 ±5% 이상 이탈 시 리밸런싱",
          "승자 일부 이익실현 후 저비중 축 보강",
          "다음 90일 자동이체·점검일 캘린더 등록",
        ],
      },
    ],
  };
}

