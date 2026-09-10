import type { SajuCharacterId } from "@/features/saju-chat/types";
import type { SajuChart } from "./manseryeok/types";

export type SajuProductId =
  | "reunion-luck"
  | "partner-heart"
  | "breakup-decision"
  | "reunion-strategy";

export type SajuReportStep = "hub" | "form" | "preview" | "report";

export type SajuProduct = {
  id: SajuProductId;
  title: string;
  shortTitle: string;
  painPoint: string;
  description: string;
  characterId: SajuCharacterId;
  characterName: string;
  priceLabel: string;
  priceWon: number;
  badge: string;
  accent: string;
  sections: string[];
};

export type SajuBirthForm = {
  displayName: string;
  gender: "여성" | "남성" | "기타";
  birthYear: string;
  birthMonth: string;
  birthDay: string;
  birthTime: string;
  birthPlace: string;
  partnerName: string;
  partnerBirthYear: string;
  monthsApart: string;
  breakupNote: string;
  concern: string;
};

export type SajuReportSection = {
  id: string;
  title: string;
  body: string;
  blurred?: boolean;
};

export type SajuReportPayload = {
  productId: SajuProductId;
  characterId: SajuCharacterId;
  characterName: string;
  title: string;
  oneLiner: string;
  previewSections: SajuReportSection[];
  sections: SajuReportSection[];
  source: "template" | "openai" | "gemini";
  generatedAt: string;
  form: SajuBirthForm;
  /** Real 만세력 chart when computed */
  chart?: SajuChart;
};

export type DemoReview = {
  id: string;
  maskedName: string;
  stars: number;
  /** Product / character tags */
  tags: string[];
  /** Saju-element chips e.g. 木 · 대운 · 보관함 */
  elementChips: string[];
  /** Display date e.g. 2026.08.14 */
  dateLabel: string;
  body: string;
};
