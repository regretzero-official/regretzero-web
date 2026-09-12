import type { SajuLandingSlug } from "./product-landings";

export type SajuEntryContent = {
  slug: SajuLandingSlug;
  /** Character voice lines — 2–3 short lines */
  lines: string[];
  concernChips: string[];
  meetLabel: string;
  skipLabel: string;
};

export const SAJU_ENTRY_BY_SLUG: Record<SajuLandingSlug, SajuEntryContent> = {
  reunion: {
    slug: "reunion",
    lines: [
      "기운이 보여. 아직 그쪽 인연이 완전히 끊긴 건 아니야.",
      "다만 지금 흔들면 더 엉킨다.",
      "오늘은 흔들리지 않게, 분명히 짚어줄게.",
    ],
    concernChips: [
      "아직 미련이 남았어요",
      "연락이 올지 궁금해요",
      "타이밍이 헷갈려요",
    ],
    meetLabel: "만나기",
    skipLabel: "건너뛰기",
  },
  heart: {
    slug: "heart",
    lines: [
      "그 사람 때문에 또 잠 못 잤지?",
      "나는 느낌이 왔어. 오늘은 속마음부터 풀어보자.",
      "언니 말 들어봐—그 잔향, 끝이 아닐 수도 있어.",
    ],
    concernChips: [
      "읽씹·잠수가 답답해요",
      "거리감이 애매해요",
      "남은 마음이 궁금해요",
    ],
    meetLabel: "시작하기",
    skipLabel: "건너뛰기",
  },
  breakup: {
    slug: "breakup",
    lines: [
      "또 그 사람 때문에 머리 복잡하지.",
      "팩트부터 말할게. 지금은 더 잘해주기 시즌 아냐.",
      "너는 더 아껴도 돼.",
    ],
    concernChips: [
      "붙잡을지 말지 모르겠어요",
      "자존감이 닳았어요",
      "같은 패턴이 반복돼요",
    ],
    meetLabel: "시작하기",
    skipLabel: "건너뛰기",
  },
  strategy: {
    slug: "strategy",
    lines: [
      "헐, 첫 톡 때문에 또 망설였지?",
      "괜찮아. 일단 네 마음부터.",
      "해도 되는 말부터 같이 골라보자.",
    ],
    concernChips: [
      "지금 연락해도 될까요",
      "첫 문장이 막혀요",
      "더 멀어질까 두려워요",
    ],
    meetLabel: "만나기",
    skipLabel: "건너뛰기",
  },
};

export function getEntryContent(slug: SajuLandingSlug) {
  return SAJU_ENTRY_BY_SLUG[slug];
}
