export type BearMarketPainMetricKey =
  | "longestRecovery"
  | "maxDrawdown"
  | "underATHMonths"
  | "underATHPercent"
  | "underPrincipal";

export type BullMarketTemptationMetricKey =
  | "label10X"
  | "label2X"
  | "label5X"
  | "penaltyCost"
  | "sellPointDetail";

export type EmotionMapLabelKey =
  | "ATH"
  | "FIRST_PROFIT"
  | "HELL"
  | "HYPER"
  | "MILESTONE_2X"
  | "RECOVERING"
  | "SHARP_DROP"
  | "SIDEWAYS"
  | "TEMPTATION"
  | "UNDER_PRINCIPAL";

export type RealityDiagnosisOptionKey = "holdTrue" | "sellByFear" | "sellByGreed";

export const REGRET_COPY_TONE = {
  principle: "숫자는 차갑게. 해석은 사람 속을 찌르게. 거짓말은 하지 않게.",
  rules: [
    "전고점 아래와 원금 아래는 절대 섞어 쓰지 않는다.",
    "근거 없는 통계처럼 보이는 표현은 쓰지 않는다.",
    "사용자에게 설명하기보다, 사용자가 겪었을 감정을 묻는다.",
    "차트의 끝보다 그 시간을 버티는 장면을 먼저 떠올리게 만든다.",
  ],
} as const;

export const BRAND_SLOGANS = {
  primary: "수익률보다 어려운 건, 그 시간을 견디는 일입니다.",
  sellLowSellHigh:
    "떨어질 때는 무서워서 팔고, 오를 때는 아까워서 팝니다. 그래서 우리 계좌에 장기투자는 없었습니다.",
  timePain:
    "장기투자는 손실을 버티는 일만이 아니라, 작은 성공에 조기 만족하지 않는 일이기도 합니다.",
} as const;

export const BEAR_MARKET_PAIN_COPY = {
  title: "1. 이 돈을 벌기까지 견뎠어야 할 고통",
  metrics: {
    longestRecovery:
      "고점에 물린 뒤 다시 회복하기까지 걸린 가장 긴 기다림: {longestRecovery}",
    maxDrawdown: "계좌가 가장 처참하게 밀렸던 순간: {maxDrawdown}%",
    underATHMonths: "전고점 아래에서 한숨 쉬며 보낸 시간: 총 {underATHMonths}개월",
    underATHPercent:
      "전체 기간 중 전고점을 못 넘긴 채 보낸 비율: {underATHPercent}%",
    underPrincipal:
      "원금마저 깨져서 '망했다'고 느꼈을 기간: {underPrincipal}개월",
  } satisfies Record<BearMarketPainMetricKey, string>,
  summary:
    "차트는 지나고 보면 아름다운 우상향처럼 보입니다. 하지만 당신이 실제로 살아낸 시간의 {underATHPercent}%는 고점보다 낮아진 계좌를 보며 '지금이라도 팔아야 하나' 흔들렸을 구간입니다.",
} as const;

export const BULL_MARKET_TEMPTATION_COPY = {
  title: "2. 이 돈을 놓칠 뻔했던 익절의 유혹",
  subtitle:
    "떨어질 때만 무서운 게 아닙니다. 조금 올랐을 때 '이 정도면 됐다'며 팔아치우고 싶었던 순간들이 더 위험할 때도 있습니다.",
  metrics: {
    label10X: "처음으로 10배가 된 날",
    label2X: "처음으로 2배가 된 날",
    label5X: "처음으로 5배가 된 날",
    penaltyCost: "조기 탈출의 대가: 최종 금액과 {penaltyAmount} 차이",
    sellPointDetail:
      "당시 평가금액은 {milestoneAmount}이었습니다. 여기서 '줄 때 먹자'며 내렸다면, 최종 금액 중 {missedAmount}을 놓쳤을 겁니다.",
  } satisfies Record<BullMarketTemptationMetricKey, string>,
} as const;

export const EMOTION_MAP_LABELS = {
  ATH: "신고가",
  FIRST_PROFIT: "첫 수익",
  HELL: "던지고 싶던 달",
  HYPER: "과열 논란",
  MILESTONE_2X: "2배 돌파",
  RECOVERING: "안도",
  SHARP_DROP: "패닉",
  SIDEWAYS: "지루함",
  TEMPTATION: "줄 때 먹을까?",
  UNDER_PRINCIPAL: "원금 침식",
} satisfies Record<EmotionMapLabelKey, string>;

export const EMOTION_MAP_INTERPRETATION = {
  ath:
    "기나긴 터널을 지나 다시 신고가를 뚫었습니다. 소음과 유혹을 모두 견딘 사람만 남아 있던 순간입니다.",
  milestone2X:
    "원금 대비 2배를 찍었습니다. 여기서 팔았어도 충분히 잘한 것처럼 느껴졌을 겁니다.",
  recovering:
    "다시 올라오고 있습니다. 하지만 이미 한 번 흔들린 마음은 쉽게 돌아오지 않습니다.",
  sharpDrop:
    "계좌가 한 달 만에 {monthlyReturn}% 밀렸습니다. 숫자로 보면 한 줄이지만, 실제 계좌에서는 잠을 설치게 만드는 달입니다.",
  sideways:
    "오르지도, 끝나지도 않습니다. 사람을 가장 지치게 만드는 건 폭락보다 이런 시간일 수 있습니다.",
  temptation:
    "수익률이 {totalReturn}%에 닿았습니다. 이제는 공포보다 '이 정도면 됐다'는 생각이 더 위험해집니다.",
  underPrincipal:
    "내가 넣은 돈보다 계좌가 작아진 달입니다. 장기투자라는 말이 갑자기 무겁게 느껴지는 구간입니다.",
} as const;

export const CRITICAL_MOMENTS_COPY = {
  bearDetail:
    "{rank}위: {date} 장기 침체기 ({dropPct}%). 이 구간에서는 좋은 회사라는 말도 잘 들리지 않습니다.",
  bearTop3Title: "가장 포기하고 싶었을 암흑기 TOP 3",
  bullDetail:
    "{rank}위: {multiple}배 달성 ({date}). {principal}이 {currentValue}이 된 순간, '이 정도면 많이 먹었다'는 말이 가장 그럴듯하게 들렸을 겁니다.",
  bullTop3Title: "가장 팔아치우고 싶었을 익절 유혹 TOP 3",
} as const;

export const NOISE_NOTE_COPY = {
  conclusion:
    "시장은 늘 그럴듯한 말로 당신의 손을 흔듭니다. 하지만 시간이 지나고 계좌에 남는 건 예측이 아니라, 내가 버틴 기간입니다.",
  quote: "{noiseSummary}",
  subtitle: "{year}년, 시장은 매일같이 팔아야 할 이유를 만들어냈습니다.",
  title: "그때의 소음",
} as const;

export const USER_DIAGNOSIS_COPY = {
  feedback: {
    holdTrue:
      "좋습니다. 하지만 실제 계좌에서 돈이 녹아내릴 때의 외로움과, 상승장에서 모두가 익절을 외칠 때의 소외감은 차트보다 훨씬 거칠게 옵니다.",
    sellByFear:
      "정직한 답변입니다. 인간의 본능은 공포를 피하도록 설계되어 있습니다. 장기투자에 실패하는 건 의지가 약해서가 아니라, 흔들릴 때 붙잡아줄 구조가 없기 때문입니다.",
    sellByGreed:
      "핵심을 짚으셨습니다. 많은 사람이 하락장만 걱정하지만, 실제로는 눈앞의 작은 성공에 만족해서 더 큰 시간을 팔아버립니다.",
  } satisfies Record<RealityDiagnosisOptionKey, string>,
  nextActionTitle: "흔들리지 않기 위한 나만의 투자 구조 만들기",
  options: {
    holdTrue: "흔들렸겠지만 끝까지 들고 갔을 것 같다",
    sellByFear: "하락할 때 무서워서 중간에 던졌을 것 같다",
    sellByGreed: "오를 때 아까워서 적당히 먹고 팔았을 것 같다",
  } satisfies Record<RealityDiagnosisOptionKey, string>,
  question:
    "솔직히 고백해 봅시다. 당신이라면 폭락의 공포와 익절의 유혹을 모두 이겨내고 이 계좌를 지켜낼 수 있었을까요?",
} as const;

export function fillRegretCopyTemplate(
  template: string,
  values: Record<string, number | string>,
) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match,
  );
}
