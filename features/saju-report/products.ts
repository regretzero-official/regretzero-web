import { CANONICAL_SECTIONS } from "./canonical-sections";
import type { SajuProduct } from "./types";

export const SAJU_REPORT_PRICE = 9900;

export const SAJU_PRODUCTS: SajuProduct[] = [
  {
    id: "reunion-luck",
    title: "재회운 사주",
    shortTitle: "재회운",
    painPoint: "그 사람, 아직 나를 생각할까?",
    description: "무당 백련이 기운으로 재회 가능성과 타이밍을 길게 짚어줘요.",
    characterId: "baek-ryeon",
    characterName: "백련",
    priceLabel: "₩9,900",
    priceWon: SAJU_REPORT_PRICE,
    badge: "BEST",
    accent: "#F0A05A",
    sections: [...CANONICAL_SECTIONS["reunion-luck"]],
  },
  {
    id: "partner-heart",
    title: "상대 속마음 사주",
    shortTitle: "속마음",
    painPoint: "연락 없는 그 사람, 속마음은 뭘까요?",
    description: "점쟁이 서나리가 직감으로 거리감과 남은 마음을 짚어줘요.",
    characterId: "seo-nari",
    characterName: "서나리",
    priceLabel: "₩9,900",
    priceWon: SAJU_REPORT_PRICE,
    badge: "위로",
    accent: "#C4A1FF",
    sections: [...CANONICAL_SECTIONS["partner-heart"]],
  },
  {
    id: "breakup-decision",
    title: "이별 결정 사주",
    shortTitle: "이별 결정",
    painPoint: "이 사람, 붙잡아야 할까 끝내야 할까?",
    description: "깍쟁이 차유리가 팩트로, 후회 덜한 쪽을 짚어줘요.",
    characterId: "cha-yuri",
    characterName: "차유리",
    priceLabel: "₩9,900",
    priceWon: SAJU_REPORT_PRICE,
    badge: "현실",
    accent: "#38BDF8",
    sections: [...CANONICAL_SECTIONS["breakup-decision"]],
  },
  {
    id: "reunion-strategy",
    title: "재회 행동 전략",
    shortTitle: "행동 전략",
    painPoint: "지금 연락해도 될까? 첫 문장부터 알려드려요.",
    description: "아이돌 한보라가 공감 먼저, 재접근 타이밍·해도 되는 말까지 같이.",
    characterId: "han-bora",
    characterName: "한보라",
    priceLabel: "₩9,900",
    priceWon: SAJU_REPORT_PRICE,
    badge: "실행",
    accent: "#FB7185",
    sections: [...CANONICAL_SECTIONS["reunion-strategy"]],
  },
];

export function getSajuProduct(id: string | null | undefined) {
  return SAJU_PRODUCTS.find((p) => p.id === id) ?? null;
}
