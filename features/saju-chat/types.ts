export type SajuCharacterId = "lee-doryeong" | "han-siwoo" | "kang-seon";

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
  accent: string;
  accentSoft: string;
  avatarInitial: string;
  avatarEmoji: string;
  vibe: string;
  portraitSrc: string;
  systemPrompt: string;
};

export type SajuFlowStep = "landing" | "select" | "chat" | "paywall" | "conclusion";
