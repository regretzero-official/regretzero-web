export type SajuCharacterId =
  | "lee-doryeong"
  | "han-siwoo"
  | "kang-seon"
  | "seo-nari"
  | "baek-ryeon"
  | "cha-yuri"
  | "han-bora";

export type SajuRoleLabel =
  | "점쟁이"
  | "무당"
  | "깍쟁이"
  | "아이돌"
  | "귀공자"
  | "밤 가이드"
  | "남친감";

export type SajuChatRole = "user" | "assistant";

export type SajuChatMessage = {
  id: string;
  role: SajuChatRole;
  content: string;
  createdAt: string;
};

export type SajuConclusion = {
  reunionLuck: string;
  relationshipFlow: string;
  todayAdvice: string;
  previewBlur: string;
};

export type SajuCharacter = {
  id: SajuCharacterId;
  name: string;
  tagline: string;
  /** Short hub / switcher hook one-liner */
  hook: string;
  accent: string;
  accentSoft: string;
  avatarInitial: string;
  avatarEmoji: string;
  vibe: string;
  portraitSrc: string;
  systemPrompt: string;
  /** Optional guide archetype label shown in hub/chat UI */
  roleLabel?: SajuRoleLabel;
};

export type SajuFlowStep = "landing" | "select" | "chat" | "paywall" | "conclusion";
