/** App-facing 사주 chart (Korean labels) — built from manseryeok */

export type SajuPillarView = {
  /** 간지 한글 e.g. 임신 */
  korean: string;
  /** 간지 한자 e.g. 壬申 */
  hanja: string;
  stem: string;
  branch: string;
  stemElement: string;
  branchElement: string;
};

export type SajuTenGodsSummary = {
  year: { stem: string; branch: string };
  month: { stem: string; branch: string };
  day: { stem: string; branch: string };
  hour: { stem: string; branch: string } | null;
};

export type SajuLuckPillarView = {
  age: number;
  korean: string;
  stem: string;
  branch: string;
};

export type SajuLuckInfoView = {
  forward: boolean;
  startAge: number;
  pillars: SajuLuckPillarView[];
};

export type SajuChart = {
  /** Solar Y/M/D used for calculation */
  solar: { year: number; month: number; day: number };
  hourUnknown: boolean;
  /** Parsed birth hour/minute when known; null if unknown */
  birthClock: { hour: number; minute: number } | null;
  pillars: {
    year: SajuPillarView;
    month: SajuPillarView;
    day: SajuPillarView;
    /** null when hour unknown — never present a midday default as known */
    hour: SajuPillarView | null;
  };
  /** 일간 */
  dayMaster: string;
  dayMasterElement: string;
  dayMasterYinYang: string;
  elements: {
    year: { stem: string; branch: string };
    month: { stem: string; branch: string };
    day: { stem: string; branch: string };
    hour: { stem: string; branch: string } | null;
  };
  tenGods: SajuTenGodsSummary;
  /** 공망 지지 */
  voidBranches: string[];
  /** 대운 — only when gender is 남성/여성 */
  luckPillars?: SajuLuckInfoView;
  /** 올해 세운 연주 */
  currentYearPillar: SajuPillarView;
  /** 상대 연주 (partnerBirthYear) */
  partnerYearPillar?: SajuPillarView;
  /** e.g. 임신/경술/계유/을묘 or …/시주미상 */
  summaryLine: string;
  /** Longer Korean blurb for prompts / injection */
  formattedKorean: string;
};
