"use client";

import type { ComparisonAssetId } from "@/lib/home-content";
import type { RaceResolution } from "@/lib/race-engine";
import type {
  PrincipleDrawdownTolerance,
  PrincipleFocus,
  PrincipleReviewCycle,
} from "@/lib/ten-year-principle";

export type RaceSpeed = "fast" | "instant" | "normal" | "slow" | "very_fast";

export interface SavedAssetCombo {
  assetIds: ComparisonAssetId[];
  createdAt: string;
  id: string;
  label: string;
}

export interface SavedScenario {
  amount: number;
  assetIds: ComparisonAssetId[];
  createdAt: string;
  id: string;
  label: string;
  resolution: RaceResolution;
  speed: RaceSpeed;
  startDate: string;
}

export interface SavedPrinciple {
  assetIds: ComparisonAssetId[];
  createdAt: string;
  drawdownTolerance: PrincipleDrawdownTolerance;
  focus: PrincipleFocus;
  id: string;
  investmentMode: "lump-sum" | "monthly";
  reviewCycle: PrincipleReviewCycle;
  summary: string;
}

export interface SavedFutureScenario {
  assetIds: ComparisonAssetId[];
  createdAt: string;
  id: string;
  initialKrw: number;
  monthlyKrw: number;
  resultsSummary: string[];
  years: 10;
}

export interface SavedTimelineRecord {
  amountLabel: string;
  assetIds: ComparisonAssetId[];
  createdAt: string;
  id: string;
  label: string;
  resultLabel: string;
  summary: string;
  type: "compare" | "solo";
}

const ASSET_COMBO_STORAGE_KEY = "rz-saved-asset-combos";
const FUTURE_SCENARIO_STORAGE_KEY = "rz-saved-future-scenarios";
const LEGACY_HISTORY_STORAGE_KEY = "regretzero_history";
const PRINCIPLE_STORAGE_KEY = "rz-saved-principles";
const SCENARIO_STORAGE_KEY = "rz-saved-scenarios";
const TIMELINE_RECORD_STORAGE_KEY = "rz-timeline-records";

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function isSavedAssetCombo(value: unknown): value is SavedAssetCombo {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.label === "string" &&
    typeof candidate.createdAt === "string" &&
    isStringArray(candidate.assetIds)
  );
}

function isSavedScenario(value: unknown): value is SavedScenario {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.label === "string" &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.amount === "number" &&
    typeof candidate.startDate === "string" &&
    typeof candidate.resolution === "string" &&
    typeof candidate.speed === "string" &&
    isStringArray(candidate.assetIds)
  );
}

function isSavedPrinciple(value: unknown): value is SavedPrinciple {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.focus === "string" &&
    typeof candidate.drawdownTolerance === "string" &&
    typeof candidate.reviewCycle === "string" &&
    typeof candidate.investmentMode === "string" &&
    typeof candidate.summary === "string" &&
    isStringArray(candidate.assetIds)
  );
}

function isSavedFutureScenario(value: unknown): value is SavedFutureScenario {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.initialKrw === "number" &&
    typeof candidate.monthlyKrw === "number" &&
    candidate.years === 10 &&
    isStringArray(candidate.resultsSummary) &&
    isStringArray(candidate.assetIds)
  );
}

function isSavedTimelineRecord(value: unknown): value is SavedTimelineRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.label === "string" &&
    typeof candidate.amountLabel === "string" &&
    typeof candidate.resultLabel === "string" &&
    typeof candidate.summary === "string" &&
    (candidate.type === "compare" || candidate.type === "solo") &&
    isStringArray(candidate.assetIds)
  );
}

function readList<T>(
  storageKey: string,
  predicate: (value: unknown) => value is T,
) {
  if (typeof window === "undefined") {
    return [] as T[];
  }

  try {
    const rawValue = window.localStorage.getItem(storageKey);
    if (!rawValue) {
      return [] as T[];
    }

    const parsed = JSON.parse(rawValue) as unknown;
    return Array.isArray(parsed) ? parsed.filter(predicate) : ([] as T[]);
  } catch {
    return [] as T[];
  }
}

function writeList<T>(storageKey: string, nextValue: T[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(nextValue));
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function saveToHistory(input: Record<string, unknown>) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const rawValue = window.localStorage.getItem(LEGACY_HISTORY_STORAGE_KEY);
    const parsed = rawValue ? (JSON.parse(rawValue) as unknown) : [];
    const currentList = Array.isArray(parsed) ? parsed : [];
    const nextEntry = {
      ...input,
      createdAt: new Date().toISOString(),
      id: makeId("history"),
    };

    window.localStorage.setItem(
      LEGACY_HISTORY_STORAGE_KEY,
      JSON.stringify([nextEntry, ...currentList].slice(0, 30)),
    );
  } catch {
    // Ignore storage failures so the main simulation flow never breaks.
  }
}

export function readSavedAssetCombos() {
  return readList(ASSET_COMBO_STORAGE_KEY, isSavedAssetCombo);
}

export function readSavedScenarios() {
  return readList(SCENARIO_STORAGE_KEY, isSavedScenario);
}

export function readSavedPrinciples() {
  return readList(PRINCIPLE_STORAGE_KEY, isSavedPrinciple);
}

export function readSavedFutureScenarios() {
  return readList(FUTURE_SCENARIO_STORAGE_KEY, isSavedFutureScenario);
}

export function readSavedTimelineRecords() {
  return readList(TIMELINE_RECORD_STORAGE_KEY, isSavedTimelineRecord);
}

export function saveAssetCombo(input: Omit<SavedAssetCombo, "createdAt" | "id">) {
  const nextEntry: SavedAssetCombo = {
    ...input,
    createdAt: new Date().toISOString(),
    id: makeId("combo"),
  };

  const nextList = [nextEntry, ...readSavedAssetCombos()].slice(0, 12);
  writeList(ASSET_COMBO_STORAGE_KEY, nextList);
  saveToHistory({
    assetIds: nextEntry.assetIds,
    label: nextEntry.label,
    source: "asset-combo",
  });
  return nextEntry;
}

export function saveScenario(input: Omit<SavedScenario, "createdAt" | "id">) {
  const nextEntry: SavedScenario = {
    ...input,
    createdAt: new Date().toISOString(),
    id: makeId("scenario"),
  };

  const nextList = [nextEntry, ...readSavedScenarios()].slice(0, 12);
  writeList(SCENARIO_STORAGE_KEY, nextList);
  saveToHistory({
    amount: nextEntry.amount,
    assetIds: nextEntry.assetIds,
    label: nextEntry.label,
    resolution: nextEntry.resolution,
    source: "scenario",
    speed: nextEntry.speed,
    startDate: nextEntry.startDate,
  });
  return nextEntry;
}

export function savePrinciple(input: Omit<SavedPrinciple, "createdAt" | "id">) {
  const nextEntry: SavedPrinciple = {
    ...input,
    createdAt: new Date().toISOString(),
    id: makeId("principle"),
  };

  const nextList = [nextEntry, ...readSavedPrinciples()].slice(0, 12);
  writeList(PRINCIPLE_STORAGE_KEY, nextList);
  return nextEntry;
}

export function saveFutureScenario(input: Omit<SavedFutureScenario, "createdAt" | "id">) {
  const nextEntry: SavedFutureScenario = {
    ...input,
    createdAt: new Date().toISOString(),
    id: makeId("future"),
  };

  const nextList = [nextEntry, ...readSavedFutureScenarios()].slice(0, 12);
  writeList(FUTURE_SCENARIO_STORAGE_KEY, nextList);
  saveToHistory({
    assetIds: nextEntry.assetIds,
    initialKrw: nextEntry.initialKrw,
    monthlyKrw: nextEntry.monthlyKrw,
    resultsSummary: nextEntry.resultsSummary,
    source: "future-scenario",
    years: nextEntry.years,
  });
  return nextEntry;
}

export function saveTimelineRecord(input: Omit<SavedTimelineRecord, "createdAt" | "id">) {
  const nextEntry: SavedTimelineRecord = {
    ...input,
    createdAt: new Date().toISOString(),
    id: makeId("timeline"),
  };

  const nextList = [nextEntry, ...readSavedTimelineRecords()].slice(0, 12);
  writeList(TIMELINE_RECORD_STORAGE_KEY, nextList);
  saveToHistory({
    amountLabel: nextEntry.amountLabel,
    assetIds: nextEntry.assetIds,
    label: nextEntry.label,
    resultLabel: nextEntry.resultLabel,
    source: "timeline",
    summary: nextEntry.summary,
    type: nextEntry.type,
  });
  return nextEntry;
}
