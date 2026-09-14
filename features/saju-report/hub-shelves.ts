import type { SajuProduct, SajuProductId } from "./types";
import { SAJU_PRODUCTS } from "./products";

export type HubShelf = {
  id: string;
  title: string;
  subtitle: string;
  productIds: SajuProductId[];
};

/** Foxbunny-like discovery shelves — related product grouping */
export const HUB_SHELVES: HubShelf[] = [
  {
    id: "featured",
    title: "지금 시작하기",
    subtitle: "이미지로 고르고, 무료 미리보기부터",
    productIds: [
      "reunion-luck",
      "partner-heart",
      "breakup-decision",
      "reunion-strategy",
    ],
  },
  {
    id: "reunion-contact",
    title: "재회 · 연락",
    subtitle: "다시 이어질 기운과 첫 문장",
    productIds: ["reunion-luck", "reunion-strategy"],
  },
  {
    id: "heart-decision",
    title: "속마음 · 결정",
    subtitle: "남은 마음과, 붙잡을지 말지",
    productIds: ["partner-heart", "breakup-decision"],
  },
];

export function productsForShelf(shelf: HubShelf): SajuProduct[] {
  return shelf.productIds
    .map((id) => SAJU_PRODUCTS.find((p) => p.id === id))
    .filter((p): p is SajuProduct => p != null);
}
