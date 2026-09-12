import type { SajuCharacterId } from "@/features/saju-chat/types";

/** Staged progress lines while waiting for preview/report */
export const SAJU_LOADING_STAGES = [
  "출생 원국을 읽고 있어요",
  "두 사람 원국을 비교하고 있어요",
  "연락·타이밍을 짚고 있어요",
  "점사를 정리하고 있어요",
] as const;

/** Short counselor lines shown during loading theater */
export const SAJU_LOADING_COUNSELOR_LINES: Record<SajuCharacterId, string> = {
  "seo-nari": "느낌이 왔어. 잠깐만—원국부터 풀어볼게.",
  "baek-ryeon": "기운이 보여. 지금은 흔들지 마. 내가 먼저 짚을게.",
  "cha-yuri": "또 그 사람이지? 팩트부터 짧게 정리할게.",
  "han-bora": "헐, 긴장하지 마. 일단 네 마음부터 같이 보자.",
  "lee-doryeong": "다치지 않게, 곁에서 천천히 읽어드릴게요.",
  "han-siwoo": "급할수록 한 박자. 氣부터 읽어볼게.",
  "kang-seon": "괜찮아. 같이 정리하자. 조금만 기다려.",
};

export function getLoadingCounselorLine(
  characterId: string | null | undefined,
  fallbackName = "상담사",
): string {
  if (characterId && characterId in SAJU_LOADING_COUNSELOR_LINES) {
    return SAJU_LOADING_COUNSELOR_LINES[characterId as SajuCharacterId];
  }
  return `${fallbackName}가 원국을 읽고 있어요.`;
}

/** Min ms before skip is emphasized; skip is always available */
export const LOADING_SKIP_HINT_MS = 2200;
/** Stage advance interval */
export const LOADING_STAGE_MS = 1600;
