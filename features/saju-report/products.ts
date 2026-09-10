import type { SajuProduct } from "./types";

export const SAJU_REPORT_PRICE = 9900;

export const SAJU_PRODUCTS: SajuProduct[] = [
  {
    id: "reunion-luck",
    title: "재회운 사주",
    shortTitle: "재회운",
    painPoint: "아직 끝인지, 다시 붙을 흐름인지 밤에 계속 확인하게 돼요",
    description: "원국·세운 감각으로 재회 가능성 · 1·3·6개월 창을 길게 풀어드립니다.",
    characterId: "han-siwoo",
    characterName: "한시우",
    priceLabel: "₩9,900",
    priceWon: SAJU_REPORT_PRICE,
    badge: "BEST",
    accent: "#5EEAD4",
    sections: [
      "한 줄 결론",
      "연애 기질",
      "인연의 결",
      "재회 타임라인",
      "연락 가이드",
      "재접근 전략",
    ],
  },
  {
    id: "partner-heart",
    title: "상대 속마음 사주",
    shortTitle: "속마음",
    painPoint: "그 사람이 나를 지우는지, 보관함인지 도무지 모르겠어요",
    description: "거리감·잔향·공망 감각으로 상대 쪽 마음을 차분히 읽어드립니다.",
    characterId: "lee-doryeong",
    characterName: "이도령",
    priceLabel: "₩9,900",
    priceWon: SAJU_REPORT_PRICE,
    badge: "위로",
    accent: "#FF7A99",
    sections: [
      "한 줄 결론",
      "남아 있는 신호",
      "거리감의 이유",
      "표면 vs 속마음",
      "다가갈 온도",
      "마지막 한마디",
    ],
  },
  {
    id: "breakup-decision",
    title: "이별 결정 사주",
    shortTitle: "이별 결정",
    painPoint: "붙잡아야 할지, 놓아야 할지—결정이 안 내려져요",
    description: "관계의 소모·회복 가능 여부를 현실적으로 짚고 선택 기준을 정리합니다.",
    characterId: "kang-seon",
    characterName: "강세온",
    priceLabel: "₩9,900",
    priceWon: SAJU_REPORT_PRICE,
    badge: "현실",
    accent: "#E8336D",
    sections: [
      "한 줄 결론",
      "이별 신호 점검",
      "남겨둘 이유 / 놓을 이유",
      "결정 체크리스트",
      "자존 회복 루틴",
      "마지막 한마디",
    ],
  },
  {
    id: "reunion-strategy",
    title: "재회 행동 전략",
    shortTitle: "행동 전략",
    painPoint: "마음은 있는데, 지금 뭘 하고 뭘 참아야 하는지 모르겠어요",
    description: "저자극 접촉 · 금지 문구 · 3단계 행동 플랜을 실행 가능하게 드립니다.",
    characterId: "han-siwoo",
    characterName: "한시우",
    priceLabel: "₩9,900",
    priceWon: SAJU_REPORT_PRICE,
    badge: "실행",
    accent: "#5EEAD4",
    sections: [
      "한 줄 결론",
      "지금 하면 안 되는 것",
      "1·2·3단계 행동",
      "해도 되는 말 / 금지 말",
      "함정 경고",
      "마지막 한마디",
    ],
  },
];

export function getSajuProduct(id: string | null | undefined) {
  return SAJU_PRODUCTS.find((p) => p.id === id) ?? null;
}
