import type { SajuLandingSlug } from "./product-landings";

/** Multi-beat character theater before form / landing body */
export type SajuEntryBeatId = "shrine" | "hook" | "selfId" | "invite";

export const SAJU_ENTRY_BEAT_ORDER: SajuEntryBeatId[] = [
  "shrine",
  "hook",
  "selfId",
  "invite",
];

export type SajuEntryContent = {
  slug: SajuLandingSlug;
  /** Character voice lines — used as hook beat copy */
  lines: string[];
  concernChips: string[];
  meetLabel: string;
  skipLabel: string;
  /** Beat 1 — enter shrine / 제의 공간 */
  shrineTitle: string;
  shrineLine: string;
  /** Beat 3 prompt for emotional self-ID chips */
  selfIdPrompt: string;
  /** Beat 4 — invite toward form */
  inviteTitle: string;
  inviteLine: string;
  nextLabel: string;
  soundEnableLabel: string;
  soundOnLabel: string;
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
    meetLabel: "점사 만나기",
    skipLabel: "건너뛰기",
    shrineTitle: "사당으로 들어와요",
    shrineLine: "촛불이 흔들려. 조용히, 그 사람 쪽 기운부터 받아줄게.",
    selfIdPrompt: "지금 마음에 가까운 걸 골라보세요",
    inviteTitle: "우리 사이, 연을 알려주세요",
    inviteLine: "출생과 고민을 적으면 미리보기부터 열어드릴게요.",
    nextLabel: "다음",
    soundEnableLabel: "소리 켜기",
    soundOnLabel: "소리 켜짐",
  },
  heart: {
    slug: "heart",
    lines: [
      "느낌이 왔어. 그 사람 때문에 또 잠 못 잤지?",
      "오늘은 속마음부터 풀어보자.",
      "그 잔향, 끝이 아닐 수도 있어—언니 말 들어봐.",
    ],
    concernChips: [
      "읽씹·잠수가 답답해요",
      "거리감이 애매해요",
      "남은 마음이 궁금해요",
    ],
    meetLabel: "점사 시작하기",
    skipLabel: "건너뛰기",
    shrineTitle: "상담실 문을 열어요",
    shrineLine: "불이 낮아졌어. 그 사람 잔향부터 천천히 만져볼게.",
    selfIdPrompt: "지금 가장 답답한 쪽을 골라보세요",
    inviteTitle: "우리 사이, 연을 알려주세요",
    inviteLine: "이름·출생·고민만 적어도 속마음 미리보기를 열어요.",
    nextLabel: "다음",
    soundEnableLabel: "소리 켜기",
    soundOnLabel: "소리 켜짐",
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
    meetLabel: "점사 시작하기",
    skipLabel: "건너뛰기",
    shrineTitle: "차가운 방으로 들어와요",
    shrineLine: "감정은 나중에. 지금은 선부터 그어줄게.",
    selfIdPrompt: "지금 흔들리는 지점을 골라보세요",
    inviteTitle: "우리 사이, 연을 알려주세요",
    inviteLine: "상황을 짧게 적으면 결정 체크부터 미리 보여드려요.",
    nextLabel: "다음",
    soundEnableLabel: "소리 켜기",
    soundOnLabel: "소리 켜짐",
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
    meetLabel: "점사 만나기",
    skipLabel: "건너뛰기",
    shrineTitle: "밤 상담을 시작해요",
    shrineLine: "조명 낮추고, 첫 문장부터 같이 골라보자.",
    selfIdPrompt: "지금 막히는 쪽을 골라보세요",
    inviteTitle: "우리 사이, 연을 알려주세요",
    inviteLine: "출생과 상황을 적으면 행동 가이드 미리보기를 열어요.",
    nextLabel: "다음",
    soundEnableLabel: "소리 켜기",
    soundOnLabel: "소리 켜짐",
  },
};

export function getEntryContent(slug: SajuLandingSlug) {
  return SAJU_ENTRY_BY_SLUG[slug];
}

export function getEntryBeatIndex(beat: SajuEntryBeatId) {
  return SAJU_ENTRY_BEAT_ORDER.indexOf(beat);
}

export function getNextEntryBeat(
  beat: SajuEntryBeatId,
): SajuEntryBeatId | null {
  const i = getEntryBeatIndex(beat);
  if (i < 0 || i >= SAJU_ENTRY_BEAT_ORDER.length - 1) return null;
  return SAJU_ENTRY_BEAT_ORDER[i + 1] ?? null;
}
