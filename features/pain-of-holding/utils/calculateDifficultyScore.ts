import type {
  CrisisResult,
  DifficultyLabel,
  DifficultyResult,
  MaxDrawdownResult,
  RecoveryResult,
} from "@/features/pain-of-holding/types";

function getMddScore(maxDrawdownPct: number) {
  if (maxDrawdownPct >= -10) {
    return 1;
  }

  if (maxDrawdownPct >= -20) {
    return 3;
  }

  if (maxDrawdownPct >= -30) {
    return 5;
  }

  if (maxDrawdownPct >= -40) {
    return 7;
  }

  if (maxDrawdownPct >= -50) {
    return 9;
  }

  return 10;
}

function getRecoveryScore(recovery: RecoveryResult) {
  if (!recovery.recovered || recovery.recoveryMonths === null) {
    return 10;
  }

  if (recovery.recoveryMonths < 3) {
    return 1;
  }

  if (recovery.recoveryMonths < 6) {
    return 3;
  }

  if (recovery.recoveryMonths < 12) {
    return 5;
  }

  if (recovery.recoveryMonths <= 24) {
    return 7;
  }

  return 10;
}

function getCrisisScore(crisisCount: number) {
  if (crisisCount <= 0) {
    return 1;
  }

  if (crisisCount === 1) {
    return 4;
  }

  if (crisisCount === 2) {
    return 6;
  }

  if (crisisCount === 3) {
    return 8;
  }

  return 10;
}

function getDifficultyLabel(score: number): DifficultyLabel {
  if (score < 4) {
    return "쉬움";
  }

  if (score < 6) {
    return "보통";
  }

  if (score < 7.5) {
    return "어려움";
  }

  if (score < 9) {
    return "매우 어려움";
  }

  return "극한";
}

function buildExplanation(
  label: DifficultyLabel,
  maxDrawdown: MaxDrawdownResult,
  recovery: RecoveryResult,
  crises: CrisisResult,
) {
  const drawdownAbs = Math.abs(maxDrawdown.maxDrawdownPct);
  const recoveryMonths = recovery.recoveryMonths ?? 0;

  if (drawdownAbs < 5) {
    return "큰 흔들림 없이 지나온 흐름입니다. 최종 결과보다 지루함을 견디는 쪽이 더 중요했던 자산이에요.";
  }

  if (!recovery.recovered) {
    if (drawdownAbs >= 50) {
      return "크게 밀린 뒤 아직 이전 고점을 되찾지 못했습니다. 수익률보다 회복을 기다리는 시간이 더 무거운 구간이에요.";
    }

    return "하락 이후 아직 회복이 끝나지 않았습니다. 지금 보이는 숫자보다, 다시 고점까지 돌아오지 못한 시간이 핵심이에요.";
  }

  if (crises.crisisCount >= 3) {
    return "큰 고비가 여러 번 반복됐습니다. 한 번의 인내보다, 흔들릴 때마다 같은 기준을 지키는 일이 더 어려웠을 자산이에요.";
  }

  if (label === "쉬움") {
    if (recoveryMonths <= 3) {
      return "하락은 있었지만 회복이 빨랐습니다. 오래 마음 졸일 시간은 비교적 짧았던 흐름이에요.";
    }

    return "중간 흔들림은 있었지만 깊이와 회복 시간이 크지 않았습니다. 처음 세운 기준을 따라가기 쉬운 편이에요.";
  }

  if (label === "보통") {
    if (drawdownAbs >= 25) {
      return "한 번쯤 마음이 흔들릴 만한 하락이 있었습니다. 그래도 회복까지의 부담은 감당 가능한 편이에요.";
    }

    return "손실보다 지루하게 기다리는 시간이 부담이었습니다. 숫자만 보면 놓치기 쉬운 구간이에요.";
  }

  if (label === "어려움") {
    if (recoveryMonths >= 12) {
      return "하락 자체보다 회복을 기다리는 시간이 길었습니다. 결과를 모른 채 남아 있기 쉽지 않았을 흐름이에요.";
    }

    if (drawdownAbs >= 40) {
      return "계좌가 크게 밀린 시간이 있었습니다. 결과를 미리 몰랐다면 중간에 기준을 바꾸기 쉬운 구간이에요.";
    }

    return "수익률만 보면 괜찮아 보여도 과정은 거칠었습니다. 결과 뒤에 숨어 있던 흔들림을 함께 봐야 합니다.";
  }

  if (label === "매우 어려움") {
    if (drawdownAbs >= 50) {
      return "반토막에 가까운 하락을 지나야 했습니다. 마지막 결과만 보고는 그 압박감을 알기 어려운 흐름이에요.";
    }

    return "깊은 하락과 긴 회복을 함께 견뎌야 했습니다. 계획 없이 끝까지 남아 있기는 부담이 큰 자산이에요.";
  }

  return "대부분의 사람이 중간에 기준을 접었을 법한 구간을 지나왔습니다. 이 자산에서는 수익률보다 생존 자체가 핵심이에요.";
}

export function calculateDifficultyScore(
  maxDrawdown: MaxDrawdownResult,
  recovery: RecoveryResult,
  crises: CrisisResult,
): DifficultyResult {
  const mddScore = getMddScore(maxDrawdown.maxDrawdownPct);
  const recoveryScore = getRecoveryScore(recovery);
  const crisisScore = getCrisisScore(crises.crisisCount);
  const score = Number((mddScore * 0.5 + recoveryScore * 0.3 + crisisScore * 0.2).toFixed(1));
  const label = getDifficultyLabel(score);

  return {
    crisisScore,
    explanation: buildExplanation(label, maxDrawdown, recovery, crises),
    label,
    mddScore,
    recoveryScore,
    score,
  };
}
