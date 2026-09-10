import type { SajuProductId } from "./types";

/**
 * Single source of truth for paywall / landing / checkout / TOC section titles.
 * Must stay in sync with `sectionsForProduct` order in buildReport.ts.
 */
export const CANONICAL_SECTIONS: Record<SajuProductId, readonly string[]> = {
  "reunion-luck": [
    "표지 / 한줄결론",
    "이번 점사의 질문 정리",
    "원국·일간 기질",
    "원국 연애 패턴 · 용신 감각",
    "두 사람 사이 인연의 결 (합·충·형·해)",
    "십성·합충으로 본 역학",
    "헤어진 진짜 이유 — 표면 vs 속마음",
    "상대 속마음에 내가 남아있는지",
    "대운·세운 타임라인 · 1 · 3 · 6개월",
    "연락 멘트 / 금지 문구",
    "재접근 전략 3단계",
    "주의할 함정",
    "캐릭터 마지막 한마디",
    "안내",
  ],
  "partner-heart": [
    "표지 / 한줄결론",
    "이번 점사의 질문 정리",
    "원국·일간 기질",
    "원국 연애 패턴 · 용신 감각",
    "두 사람 사이 인연의 결 (합·충·형·해)",
    "헤어진 진짜 이유 — 표면 vs 속마음",
    "상대 속마음에 내가 남아있는지",
    "상대에게 다가갈 온도",
    "연락 멘트 / 금지 문구",
    "주의할 함정",
    "캐릭터 마지막 한마디",
    "안내",
  ],
  "breakup-decision": [
    "표지 / 한줄결론",
    "이번 점사의 질문 정리",
    "원국·일간 기질",
    "원국 연애 패턴 · 용신 감각",
    "헤어진 진짜 이유 — 표면 vs 속마음",
    "남겨둘 이유 / 놓을 이유",
    "자존 회복 루틴",
    "주의할 함정",
    "캐릭터 마지막 한마디",
    "안내",
  ],
  "reunion-strategy": [
    "표지 / 한줄결론",
    "이번 점사의 질문 정리",
    "원국·일간 기질",
    "원국 연애 패턴 · 용신 감각",
    "지금 하면 안 되는 것",
    "대운·세운 타임라인 · 1 · 3 · 6개월",
    "연락 멘트 / 금지 문구",
    "재접근 전략 3단계",
    "주의할 함정",
    "캐릭터 마지막 한마디",
    "안내",
  ],
} as const;

export function getCanonicalSections(productId: SajuProductId): string[] {
  return [...CANONICAL_SECTIONS[productId]];
}

export function getCanonicalSectionCount(productId: SajuProductId): number {
  return CANONICAL_SECTIONS[productId].length;
}

/** Strip leading "12. " style numbering from report section titles for display lists. */
export function displaySectionTitle(title: string): string {
  return title.replace(/^\d+\.\s*/, "").trim();
}
