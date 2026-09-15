import type { SajuCharacterId } from "@/features/saju-chat/types";
import type { SajuProduct, SajuProductId } from "./types";
import { SAJU_PRODUCTS } from "./products";

/** Foxbunny-like mix: bright webtoon soft vs romantic dark — not horror */
export type HubCardTone = "bright" | "romantic";

export type HubShelfItem = {
  productId: SajuProductId;
  /** Portrait on the card (may be male counselor, not only product default) */
  faceCharacterId: SajuCharacterId;
  tone: HubCardTone;
};

export type HubShelf = {
  id: string;
  title: string;
  subtitle: string;
  items: HubShelfItem[];
};

/**
 * Discovery shelves — male counselors (이도령·한시우·강세온) lead the first viewport
 * alongside female faces; tones alternate bright / romantic.
 */
export const HUB_SHELVES: HubShelf[] = [
  {
    id: "featured",
    title: "지금 시작하기",
    subtitle: "이미지로 고르고, 무료 미리보기부터",
    items: [
      /* scroll0 bright webtoon (daylight) beside scroll1 dark romance — clear contrast */
      { productId: "reunion-strategy", faceCharacterId: "han-bora", tone: "bright" },
      { productId: "reunion-luck", faceCharacterId: "lee-doryeong", tone: "romantic" },
      { productId: "partner-heart", faceCharacterId: "seo-nari", tone: "bright" },
      { productId: "partner-heart", faceCharacterId: "kang-seon", tone: "romantic" },
      { productId: "breakup-decision", faceCharacterId: "cha-yuri", tone: "romantic" },
      { productId: "reunion-luck", faceCharacterId: "baek-ryeon", tone: "romantic" },
    ],
  },
  {
    id: "reunion-contact",
    title: "재회 · 연락",
    subtitle: "다시 이어질 흐름과 첫 문장",
    items: [
      { productId: "reunion-luck", faceCharacterId: "lee-doryeong", tone: "romantic" },
      { productId: "reunion-strategy", faceCharacterId: "han-bora", tone: "bright" },
      { productId: "reunion-strategy", faceCharacterId: "han-siwoo", tone: "romantic" },
      { productId: "reunion-luck", faceCharacterId: "baek-ryeon", tone: "bright" },
    ],
  },
  {
    id: "heart-decision",
    title: "속마음 · 결정",
    subtitle: "남은 마음과, 붙잡을지 말지",
    items: [
      { productId: "partner-heart", faceCharacterId: "kang-seon", tone: "bright" },
      { productId: "breakup-decision", faceCharacterId: "cha-yuri", tone: "bright" },
      { productId: "partner-heart", faceCharacterId: "seo-nari", tone: "romantic" },
      { productId: "breakup-decision", faceCharacterId: "kang-seon", tone: "romantic" },
      { productId: "breakup-reason", faceCharacterId: "lee-doryeong", tone: "bright" },
    ],
  },
  {
    id: "truth-after",
    title: "이별 이유 · 다음",
    subtitle: "표면과 속, 그리고 그다음에 할 일",
    items: [
      { productId: "breakup-reason", faceCharacterId: "han-siwoo", tone: "romantic" },
      { productId: "breakup-decision", faceCharacterId: "kang-seon", tone: "bright" },
      { productId: "partner-heart", faceCharacterId: "lee-doryeong", tone: "romantic" },
      { productId: "breakup-reason", faceCharacterId: "seo-nari", tone: "bright" },
    ],
  },
];

/** Full-grid cards — cycle male/female art so the catalog isn’t female-only */
export const HUB_GRID_ITEMS: HubShelfItem[] = [
  { productId: "reunion-strategy", faceCharacterId: "han-bora", tone: "bright" },
  { productId: "reunion-luck", faceCharacterId: "lee-doryeong", tone: "romantic" },
  { productId: "partner-heart", faceCharacterId: "seo-nari", tone: "bright" },
  { productId: "breakup-decision", faceCharacterId: "kang-seon", tone: "romantic" },
  { productId: "breakup-reason", faceCharacterId: "han-siwoo", tone: "romantic" },
  { productId: "reunion-luck", faceCharacterId: "lee-doryeong", tone: "bright" },
];

/** Hub character strip — interleave male + female so first faces aren’t all women */
export const HUB_CHARACTER_ORDER: SajuCharacterId[] = [
  "lee-doryeong",
  "seo-nari",
  "han-siwoo",
  "baek-ryeon",
  "kang-seon",
  "cha-yuri",
  "han-bora",
];

export type ResolvedHubCard = HubShelfItem & { product: SajuProduct };

export function resolveHubItem(item: HubShelfItem): ResolvedHubCard | null {
  const product = SAJU_PRODUCTS.find((p) => p.id === item.productId);
  if (!product) return null;
  return { ...item, product };
}

export function itemsForShelf(shelf: HubShelf): ResolvedHubCard[] {
  return shelf.items
    .map(resolveHubItem)
    .filter((x): x is ResolvedHubCard => x != null);
}

/** Unique products on a shelf (for tests / coverage) */
export function productsForShelf(shelf: HubShelf): SajuProduct[] {
  const seen = new Set<SajuProductId>();
  const out: SajuProduct[] = [];
  for (const item of shelf.items) {
    if (seen.has(item.productId)) continue;
    const product = SAJU_PRODUCTS.find((p) => p.id === item.productId);
    if (!product) continue;
    seen.add(item.productId);
    out.push(product);
  }
  return out;
}
