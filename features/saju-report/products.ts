import type { SajuProduct } from "./types";

export const SAJU_REPORT_PRICE = 9900;

export const SAJU_PRODUCTS: SajuProduct[] = [
  {
    id: "reunion-luck",
    title: "재회운 사주",
    shortTitle: "재회운",
    painPoint: "그 사람, 아직 나에게 마음이 남아 있을까?",
    description: "사주 흐름으로 재회 가능성과 타이밍을 길게 읽어드려요.",
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
    painPoint: "연락 없는 그 사람, 속마음은 뭘까요?",
    description: "거리감과 남은 마음을 도령이 차분히 짚어드려요.",
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
    painPoint: "이 사람, 붙잡아야 할까 끝내야 할까?",
    description: "두 사람 사주로, 후회 덜한 쪽을 정리해드려요.",
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
    painPoint: "지금 연락해도 될까? 첫 문장부터 알려드려요.",
    description: "재접근 타이밍, 해도 되는 말·금지 문구까지.",
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
