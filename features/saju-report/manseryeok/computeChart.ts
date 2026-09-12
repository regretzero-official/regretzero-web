import {
  calculateFourPillars,
  type ElementPair,
  type FourPillarsDetail,
  type Gender,
  type Pillar,
} from "manseryeok";

import type { SajuBirthForm } from "../types";
import { formatChartMarkdown, formatPartnerChartMarkdown } from "./formatChart";
import type {
  PartnerChart,
  SajuChart,
  SajuLuckInfoView,
  SajuPillarView,
  SajuTenGodsSummary,
} from "./types";

function parseIntLoose(raw: string, fallback: number): number {
  const n = Number.parseInt(String(raw ?? "").trim(), 10);
  return Number.isFinite(n) ? n : fallback;
}

export type ParsedBirthTime =
  | { kind: "known"; hour: number; minute: number }
  | { kind: "unknown" };

/**
 * Parse common Korean / numeric birth-time inputs.
 * Empty · 모름 · 미상 → unknown.
 */
export function parseBirthTime(raw: string): ParsedBirthTime {
  const t = (raw ?? "").trim();
  if (!t) return { kind: "unknown" };
  const lower = t.toLowerCase();
  const compact = t.replace(/\s+/g, "");
  if (
    /^(모름|미상|몰라|모르겠|시간모름|unknown|\?+|없음|안알)$/i.test(compact) ||
    lower === "n/a" ||
    lower === "na"
  ) {
    return { kind: "unknown" };
  }

  // 14시 30분 / 14:30 with optional am/pm words
  const hm = t.match(/(\d{1,2})\s*[:：시]\s*(\d{1,2})/);
  if (hm) {
    let hour = Number(hm[1]);
    const minute = Number(hm[2]);
    const ampm = detectAmPm(t);
    if (ampm) hour = applyAmPm(hour, ampm);
    else if (/밤|야간/.test(t) && hour < 12) hour += 12;
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return { kind: "known", hour, minute };
    }
  }

  const colon = t.match(/^(\d{1,2})\s*[:：]\s*(\d{1,2})$/);
  if (colon) {
    const hour = Number(colon[1]);
    const minute = Number(colon[2]);
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return { kind: "known", hour, minute };
    }
  }

  const hourOnly = t.match(/(\d{1,2})\s*시/);
  if (hourOnly) {
    let hour = Number(hourOnly[1]);
    const ampm = detectAmPm(t);
    if (ampm) hour = applyAmPm(hour, ampm);
    else if (/밤|야간/.test(t) && hour < 12) hour += 12;
    else if (/낮|점심/.test(t) && hour <= 4) hour += 12;
    if (hour >= 0 && hour <= 23) return { kind: "known", hour, minute: 0 };
  }

  const bare = t.match(/^(\d{1,2})$/);
  if (bare) {
    const hour = Number(bare[1]);
    if (hour >= 0 && hour <= 23) return { kind: "known", hour, minute: 0 };
  }

  if (/정오|낮\s*12/.test(t)) return { kind: "known", hour: 12, minute: 0 };
  if (/자정|밤\s*12/.test(t)) return { kind: "known", hour: 0, minute: 0 };

  return { kind: "unknown" };
}

type AmPm = "am" | "pm";

function detectAmPm(t: string): AmPm | null {
  if (/오전|아침|새벽|\bam\b/i.test(t)) return "am";
  if (/오후|저녁|\bpm\b/i.test(t)) return "pm";
  return null;
}

function applyAmPm(hour: number, ampm: AmPm): number {
  const h = hour % 12;
  if (ampm === "am") return h;
  return h + 12;
}

function mapGender(gender: SajuBirthForm["gender"]): Gender | undefined {
  if (gender === "여성") return "female";
  if (gender === "남성") return "male";
  return undefined;
}

function pillarView(
  pillar: Pillar,
  korean: string,
  hanja: string,
  elements: ElementPair,
): SajuPillarView {
  return {
    korean,
    hanja,
    stem: pillar.heavenlyStem,
    branch: pillar.earthlyBranch,
    stemElement: elements.stem,
    branchElement: elements.branch,
  };
}

function yearPillarOnly(year: number): SajuPillarView {
  const r = calculateFourPillars({
    year,
    month: 6,
    day: 15,
    hour: 12,
    minute: 0,
    dayBoundary: "midnight",
  });
  return pillarView(r.year, r.yearString, r.yearHanja, r.yearElement);
}

function toLuck(detail: FourPillarsDetail): SajuLuckInfoView | undefined {
  const lp = detail.luckPillars;
  if (!lp) return undefined;
  return {
    forward: lp.forward,
    startAge: lp.startAge,
    pillars: lp.pillars.map((p) => ({
      age: p.age,
      korean: p.korean,
      stem: p.pillar.heavenlyStem,
      branch: p.pillar.earthlyBranch,
    })),
  };
}

function tenGodsFrom(detail: FourPillarsDetail, hourUnknown: boolean): SajuTenGodsSummary {
  const tg = detail.tenGods;
  return {
    year: { stem: tg.year.stem, branch: tg.year.branch },
    month: { stem: tg.month.stem, branch: tg.month.branch },
    day: { stem: tg.day.stem, branch: tg.day.branch },
    hour: hourUnknown ? null : { stem: tg.hour.stem, branch: tg.hour.branch },
  };
}

/** Day-master label like 계(+수) → 계수 for chip; 갑목 style via stem+element */
export function dayMasterLabel(stem: string, element: string): string {
  return `${stem}${element}`;
}

/** Shared birth Y/M/D(+time) → four-pillars core (no partner / formattedKorean). */
export type BirthYmdInput = {
  year: number;
  month: number;
  day: number;
  birthTime: string;
  gender?: SajuBirthForm["gender"];
};

export type CoreFourPillars = {
  solar: { year: number; month: number; day: number };
  hourUnknown: boolean;
  birthClock: { hour: number; minute: number } | null;
  pillars: {
    year: SajuPillarView;
    month: SajuPillarView;
    day: SajuPillarView;
    hour: SajuPillarView | null;
  };
  dayMaster: string;
  dayMasterElement: string;
  dayMasterYinYang: string;
  elements: SajuChart["elements"];
  tenGods: SajuTenGodsSummary;
  voidBranches: string[];
  luckPillars?: SajuLuckInfoView;
  summaryLine: string;
};

/**
 * Reusable manseryeok calculateFourPillars wrapper.
 * Solar calendar, dayBoundary midnight, no trueSolarTime (MVP).
 * When hour unknown: library uses midday ONLY internally; hour pillar is null.
 */
export function computeFourPillarsFromBirth(input: BirthYmdInput): CoreFourPillars {
  const { year, month, day } = input;
  const parsedTime = parseBirthTime(input.birthTime);
  const hourUnknown = parsedTime.kind === "unknown";
  const hour = hourUnknown ? 12 : parsedTime.hour;
  const minute = hourUnknown ? 0 : parsedTime.minute;
  const gender = input.gender ? mapGender(input.gender) : undefined;

  const detail = calculateFourPillars({
    year,
    month,
    day,
    hour,
    minute,
    dayBoundary: "midnight",
    ...(gender ? { gender } : {}),
  });

  const yearP = pillarView(detail.year, detail.yearString, detail.yearHanja, detail.yearElement);
  const monthP = pillarView(detail.month, detail.monthString, detail.monthHanja, detail.monthElement);
  const dayP = pillarView(detail.day, detail.dayString, detail.dayHanja, detail.dayElement);
  const hourP = hourUnknown
    ? null
    : pillarView(detail.hour, detail.hourString, detail.hourHanja, detail.hourElement);

  const summaryLine = hourP
    ? `${yearP.korean}/${monthP.korean}/${dayP.korean}/${hourP.korean}`
    : `${yearP.korean}/${monthP.korean}/${dayP.korean}/시주미상`;

  return {
    solar: { year, month, day },
    hourUnknown,
    birthClock: hourUnknown ? null : { hour, minute },
    pillars: { year: yearP, month: monthP, day: dayP, hour: hourP },
    dayMaster: detail.day.heavenlyStem,
    dayMasterElement: detail.dayElement.stem,
    dayMasterYinYang: detail.dayYinYang.stem,
    elements: {
      year: { stem: detail.yearElement.stem, branch: detail.yearElement.branch },
      month: { stem: detail.monthElement.stem, branch: detail.monthElement.branch },
      day: { stem: detail.dayElement.stem, branch: detail.dayElement.branch },
      hour: hourUnknown
        ? null
        : { stem: detail.hourElement.stem, branch: detail.hourElement.branch },
    },
    tenGods: tenGodsFrom(detail, hourUnknown),
    voidBranches: [...detail.voidBranches],
    luckPillars: toLuck(detail),
    summaryLine,
  };
}

function partnerYearOnly(year: number): PartnerChart {
  const yearP = yearPillarOnly(year);
  const chart: PartnerChart = {
    detailLevel: "year-only",
    solar: { year },
    hourUnknown: true,
    birthClock: null,
    pillars: { year: yearP, month: null, day: null, hour: null },
    summaryLine: yearP.korean,
    formattedKorean: "",
  };
  chart.formattedKorean = formatPartnerChartMarkdown(chart);
  return chart;
}

function partnerFromCore(core: CoreFourPillars): PartnerChart {
  const chart: PartnerChart = {
    detailLevel: "full",
    solar: { ...core.solar },
    hourUnknown: core.hourUnknown,
    birthClock: core.birthClock,
    pillars: {
      year: core.pillars.year,
      month: core.pillars.month,
      day: core.pillars.day,
      hour: core.pillars.hour,
    },
    dayMaster: core.dayMaster,
    dayMasterElement: core.dayMasterElement,
    dayMasterYinYang: core.dayMasterYinYang,
    summaryLine: core.summaryLine,
    formattedKorean: "",
  };
  chart.formattedKorean = formatPartnerChartMarkdown(chart);
  return chart;
}

/** Build partner chart from form fields — undefined if no usable partner year. */
export function computePartnerChart(form: SajuBirthForm): PartnerChart | undefined {
  const py = parseIntLoose(form.partnerBirthYear, NaN);
  if (!Number.isFinite(py) || py < 1800 || py > 2300) return undefined;

  const pmRaw = String(form.partnerBirthMonth ?? "").trim();
  const pdRaw = String(form.partnerBirthDay ?? "").trim();
  const pm = parseIntLoose(pmRaw, NaN);
  const pd = parseIntLoose(pdRaw, NaN);
  const hasYmd =
    pmRaw.length > 0 &&
    pdRaw.length > 0 &&
    Number.isFinite(pm) &&
    Number.isFinite(pd) &&
    pm >= 1 &&
    pm <= 12 &&
    pd >= 1 &&
    pd <= 31;

  if (!hasYmd) return partnerYearOnly(py);

  const core = computeFourPillarsFromBirth({
    year: py,
    month: Math.min(12, Math.max(1, pm)),
    day: Math.min(31, Math.max(1, pd)),
    birthTime: form.partnerBirthTime ?? "",
    gender: form.partnerGender || undefined,
  });
  return partnerFromCore(core);
}

/**
 * Compute app chart from birth form.
 * Solar calendar, dayBoundary midnight, no trueSolarTime (MVP).
 * When hour unknown: library uses midday ONLY internally; hour pillar is null.
 */
export function computeChart(form: SajuBirthForm): SajuChart {
  const year = parseIntLoose(form.birthYear, 1995);
  const month = Math.min(12, Math.max(1, parseIntLoose(form.birthMonth, 3)));
  const day = Math.min(31, Math.max(1, parseIntLoose(form.birthDay, 14)));

  const core = computeFourPillarsFromBirth({
    year,
    month,
    day,
    birthTime: form.birthTime,
    gender: form.gender,
  });

  const currentYear = new Date().getFullYear();
  const currentYearPillar = yearPillarOnly(currentYear);

  const partnerChart = computePartnerChart(form);
  const partnerYearPillar = partnerChart?.pillars.year;

  const chart: SajuChart = {
    solar: core.solar,
    hourUnknown: core.hourUnknown,
    birthClock: core.birthClock,
    pillars: core.pillars,
    dayMaster: core.dayMaster,
    dayMasterElement: core.dayMasterElement,
    dayMasterYinYang: core.dayMasterYinYang,
    elements: core.elements,
    tenGods: core.tenGods,
    voidBranches: core.voidBranches,
    luckPillars: core.luckPillars,
    currentYearPillar,
    partnerYearPillar,
    partnerChart,
    summaryLine: core.summaryLine,
    formattedKorean: "",
  };

  chart.formattedKorean = formatChartMarkdown(chart);
  return chart;
}

export { formatChartMarkdown, formatChartChip, formatChartPlain } from "./formatChart";
