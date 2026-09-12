import type { SajuProductId } from "./types";

export type SajuLandingSlug = "reunion" | "heart" | "breakup" | "strategy";

export type SajuProductLanding = {
  slug: SajuLandingSlug;
  productId: SajuProductId;
  path: `/${string}`;
  heroHook: string;
  heroSub: string;
  whoFor: string[];
  deliverables: string[];
  /** First N section titles shown unlocked in preview outline */
  previewUnlockedCount: number;
  curiosity: string[];
  faq: { q: string; a: string }[];
  ctaLabel: string;
  reviewTag: string;
};

export const SAJU_PRODUCT_LANDINGS: SajuProductLanding[] = [
  {
    slug: "reunion",
    productId: "reunion-luck",
    path: "/saju/reunion",
    heroHook: "그 사람, 아직 나를 생각할까?",
    heroSub:
      "헤어진 뒤에도 밤에 생각날 때. 무당 백련이 기운으로 재회 가능성과 타이밍을 길게 짚어줘요.",
    whoFor: [
      "연락이 끊긴 전 연인에게 아직 마음이 남은 사람",
      "재회할 수 있는지, 상대 속마음과 함께 보고 싶은 사람",
      "지금 연락해도 될지, 더 기다려야 할지 헷갈리는 사람",
      "다시 이어진다면 같은 실수를 반복하고 싶지 않은 사람",
    ],
    deliverables: [
      "한 줄 결론 — 지금 흐름을 짧게",
      "연애 기질 · 인연의 결",
      "재회 타임라인 (언제쯤 흔들릴지)",
      "연락 가이드 · 재접근 전략",
    ],
    previewUnlockedCount: 1,
    curiosity: [
      "그 사람, 아직 나를 떠올릴까?",
      "연락이 다시 올 타이밍은?",
      "지금 움직이면 늦을까, 이를까?",
    ],
    faq: [
      {
        q: "진짜 예언인가요?",
        a: "아니요. 참고용이에요. 절대 결과가 아니에요. 원국은 만세력으로 계산하고, 해석은 위로·통찰용으로 봐 주세요.",
      },
      {
        q: "무료로 어디까지 보나요?",
        a: "출생·고민을 적으면 미리보기 일부를 먼저 보여드려요. 전체 리포트는 잠금 해제 후 확인할 수 있어요.",
      },
      {
        q: "상대에게 연락하라고 강요하나요?",
        a: "원치 않는 연락·스토킹은 권하지 않아요. 타이밍과 조심할 말도 함께 적어드려요.",
      },
    ],
    ctaLabel: "무료로 시작하기",
    reviewTag: "재회운",
  },
  {
    slug: "heart",
    productId: "partner-heart",
    path: "/saju/heart",
    heroHook: "연락 없는 그 사람, 속마음은 뭘까요?",
    heroSub:
      "읽씹·잠수·애매한 거리. 점쟁이 서나리가 직감으로 남은 마음과 거리감의 이유를 짚어줘요.",
    whoFor: [
      "상대가 나를 어떻게 생각하는지 답답한 사람",
      "표면 태도와 속마음이 달라 보여 혼란스러운 사람",
      "다가가도 될지, 잠시 물러서야 할지 알고 싶은 사람",
      "혼자만 애쓰는 느낌이라 확인이 필요한 사람",
    ],
    deliverables: [
      "한 줄 결론 — 지금 상대의 결을 짧게",
      "남아 있는 신호 · 거리감의 이유",
      "표면 vs 속마음",
      "다가갈 온도 · 마지막 한마디",
    ],
    previewUnlockedCount: 1,
    curiosity: [
      "그 사람 마음에 아직 내가 있을까?",
      "거리 두는 이유가 싫어서일까, 상황일까?",
      "지금 다가가면 부담일까?",
    ],
    faq: [
      {
        q: "상대 생일을 모르면요?",
        a: "아는 만큼만 적어도 돼요. 비어 있어도 고민 내용 중심으로 미리보기를 만들어드려요.",
      },
      {
        q: "실제 속마음을 보장하나요?",
        a: "아니요. 참고용이에요. 절대 결과가 아니에요. 위로·통찰로만 봐 주세요.",
      },
      {
        q: "결제는 어떻게 되나요?",
        a: "지금은 실제 청구 없이 전체 결과를 열어볼 수 있어요.",
      },
    ],
    ctaLabel: "무료로 시작하기",
    reviewTag: "속마음",
  },
  {
    slug: "breakup",
    productId: "breakup-decision",
    path: "/saju/breakup",
    heroHook: "이 사람, 붙잡아야 할까 끝내야 할까?",
    heroSub:
      "마음만 흔들릴 때. 깍쟁이 차유리가 팩트로, 후회 덜한 쪽을 짚어줘요.",
    whoFor: [
      "헤어질지 말지 몇 달째 같은 생각만 반복하는 사람",
      "남겨둘 이유와 놓을 이유가 한꺼번에 떠오르는 사람",
      "자존감이 닳아서 결정이 더 어려워진 사람",
      "주변 말보다 내 기준이 필요한 사람",
    ],
    deliverables: [
      "한 줄 결론 — 지금 결정의 방향",
      "이별 신호 점검",
      "남겨둘 이유 / 놓을 이유",
      "결정 체크리스트 · 자존 회복 루틴",
    ],
    previewUnlockedCount: 1,
    curiosity: [
      "이건 사랑이 아니라 습관일까?",
      "지금 끝내면 후회할까?",
      "붙잡으면 무엇이 반복될까?",
    ],
    faq: [
      {
        q: "이별을 강요하나요?",
        a: "한쪽을 강요하지 않아요. 체크리스트로 스스로 고르기 쉽게 도와드려요.",
      },
      {
        q: "상담·치료를 대신하나요?",
        a: "아니요. 참고용이에요. 절대 결과가 아니에요. 힘든 시기엔 주변·전문 도움도 함께 고려해 주세요.",
      },
      {
        q: "미리보기는 무료인가요?",
        a: "네. 입력 후 일부 섹션을 먼저 보여드리고, 나머지는 잠금으로 표시돼요.",
      },
    ],
    ctaLabel: "무료로 시작하기",
    reviewTag: "이별 결정",
  },
  {
    slug: "strategy",
    productId: "reunion-strategy",
    path: "/saju/strategy",
    heroHook: "지금 연락해도 될까? 첫 문장부터 같이 골라봐요.",
    heroSub:
      "마음만 앞서갈 때. 아이돌 한보라가 공감 먼저, 재접근 타이밍·해도 되는 말까지 짚어줘요.",
    whoFor: [
      "재회하고 싶은데 첫 톡이 막히는 사람",
      "연락했다가 더 멀어질까 봐 두려운 사람",
      "해도 되는 말 / 절대 쓰면 안 되는 말이 궁금한 사람",
      "단계별로 천천히 움직이고 싶은 사람",
    ],
    deliverables: [
      "한 줄 결론 — 지금 해도 되는지",
      "지금 하면 안 되는 것",
      "1·2·3단계 행동",
      "해도 되는 말 / 금지 말 · 함정 경고",
    ],
    previewUnlockedCount: 1,
    curiosity: [
      "지금 보내면 부담일까?",
      "첫 문장은 뭐가 덜 어색할까?",
      "기다릴 구간은 어디까지일까?",
    ],
    faq: [
      {
        q: "템플릿 문장을 그대로 보내면 되나요?",
        a: "가이드일 뿐이에요. 상대·상황 맞게 다듬고, 원치 않는 연락은 하지 마세요.",
      },
      {
        q: "스토킹을 부추기나요?",
        a: "아니요. 함정·금지 말도 함께 적어 위험한 집착은 말려드려요.",
      },
      {
        q: "다른 사주랑 뭐가 달라요?",
        a: "재회 ‘가능성과 기운’보다, 지금 당장 어떻게 움직일지에 더 가깝게 써드려요.",
      },
    ],
    ctaLabel: "무료로 시작하기",
    reviewTag: "행동 전략",
  },
];

export function getLandingBySlug(slug: string | null | undefined) {
  return SAJU_PRODUCT_LANDINGS.find((l) => l.slug === slug) ?? null;
}

export function getLandingByProductId(productId: SajuProductId | string | null | undefined) {
  return SAJU_PRODUCT_LANDINGS.find((l) => l.productId === productId) ?? null;
}

export function hubDeepLink(productId: SajuProductId) {
  return `/saju?product=${productId}` as const;
}
