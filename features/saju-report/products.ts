import type { SajuCharacterId } from "@/features/saju-chat/types";
import { getSajuCharacter } from "@/features/saju-chat/characters";
import { CANONICAL_SECTIONS } from "./canonical-sections";
import type { SajuProduct, SajuProductId } from "./types";

export const SAJU_REPORT_PRICE = 9900;

export const SAJU_PRODUCTS: SajuProduct[] = [
  {
    id: "reunion-luck",
    title: "재회운 사주",
    shortTitle: "재회운",
    painPoint: "그 사람, 아직 나를 생각할까?",
    description: "기본은 무당 백련. 이도령에게도 맡길 수 있어요.",
    characterId: "baek-ryeon",
    characterName: "백련",
    counselorIds: ["baek-ryeon", "lee-doryeong"],
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
    description: "기본은 점쟁이 서나리. 이도령·강세온도 선택해요.",
    characterId: "seo-nari",
    characterName: "서나리",
    counselorIds: ["seo-nari", "lee-doryeong", "kang-seon"],
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
    description: "기본은 깍쟁이 차유리. 강세온에게도 맡길 수 있어요.",
    characterId: "cha-yuri",
    characterName: "차유리",
    counselorIds: ["cha-yuri", "kang-seon"],
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
    description: "기본은 아이돌 한보라. 한시우에게도 맡길 수 있어요.",
    characterId: "han-bora",
    characterName: "한보라",
    counselorIds: ["han-bora", "han-siwoo"],
    priceLabel: "₩9,900",
    priceWon: SAJU_REPORT_PRICE,
    badge: "실행",
    accent: "#FB7185",
    sections: [...CANONICAL_SECTIONS["reunion-strategy"]],
  },
];

/** Hub character card → product with counselor preselected */
export const CHARACTER_PRIMARY_PRODUCT: Record<SajuCharacterId, SajuProductId> = {
  "seo-nari": "partner-heart",
  "baek-ryeon": "reunion-luck",
  "cha-yuri": "breakup-decision",
  "han-bora": "reunion-strategy",
  "lee-doryeong": "reunion-luck",
  "han-siwoo": "reunion-strategy",
  "kang-seon": "partner-heart",
};

export function getSajuProduct(id: string | null | undefined) {
  return SAJU_PRODUCTS.find((p) => p.id === id) ?? null;
}

export function isCounselorForProduct(
  product: SajuProduct,
  characterId: string | null | undefined,
): characterId is SajuCharacterId {
  return !!characterId && product.counselorIds.includes(characterId as SajuCharacterId);
}

export function resolveProductCounselor(
  product: SajuProduct,
  characterId?: string | null,
): SajuCharacterId {
  if (isCounselorForProduct(product, characterId)) return characterId;
  return product.characterId;
}

export function getProductCounselors(product: SajuProduct) {
  return product.counselorIds
    .map((id) => getSajuCharacter(id))
    .filter((c): c is NonNullable<typeof c> => c != null);
}
