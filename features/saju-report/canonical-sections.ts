import type { SajuProductId } from "./types";

/**
 * Single source of truth for paywall / landing / checkout / TOC section titles.
 * Must stay in sync with `sectionsForProduct` order in buildReport.ts.
 */
export const CANONICAL_SECTIONS: Record<SajuProductId, readonly string[]> = {
  "reunion-luck": [
    "표지 / 한줄결론",
    "1장 · 끌린 이유",
    "두 사람의 사주 원국 비교",
    "이별 진짜 원인",
    "지워지지 않는 흔적",
    "2장 · 남은 마음",
    "떠올리는 순간 · 말 못 하는 감정",
    "3장 · 연락 확률과 시기",
    "누가 먼저 연락할까",
    "다시 만났을 때",
    "외부 변수 · 새 인연 역전",
    "4장 · 달라져야 할 것",
    "행동 플랜 · 연락 가이드",
    "마지막 기회 · 선생님 마지막 말",
    "안내",
  ],
  "partner-heart": [
    "표지 / 한줄결론",
    "1장 · 이번 점사의 질문",
    "원국·일간 기질",
    "연애 패턴 · 잔향의 스크립트",
    "두 사람 사이 인연의 결",
    "헤어진 진짜 이유 — 표면 vs 속마음",
    "2장 · 상대 속마음에 내가 남아있는지",
    "상대에게 다가갈 온도",
    "연락 멘트 / 금지 문구",
    "주의할 함정",
    "캐릭터 마지막 한마디",
    "안내",
  ],
  "breakup-decision": [
    "표지 / 한줄결론",
    "1장 · 이번 점사의 질문",
    "원국·일간 기질",
    "연애 패턴 · 잔향의 스크립트",
    "헤어진 진짜 이유 — 표면 vs 속마음",
    "2장 · 남겨둘 이유 / 놓을 이유",
    "자존 회복 루틴",
    "주의할 함정",
    "캐릭터 마지막 한마디",
    "안내",
  ],
  "reunion-strategy": [
    "표지 / 한줄결론",
    "1장 · 이번 점사의 질문",
    "원국·일간 기질",
    "연애 패턴 · 잔향의 스크립트",
    "지금 하면 안 되는 것",
    "2장 · 대운·세운 타임라인 · 1 · 3 · 6개월",
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
