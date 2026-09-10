"use client";

import type { SajuProductId, SajuReportPayload } from "./types";

const SAJU_MY_READINGS_KEY = "rz-saju-my-readings";
const MAX_READINGS = 20;

export type SavedSajuReading = {
  id: string;
  productId: SajuProductId;
  productTitle: string;
  characterId: string;
  characterName: string;
  title: string;
  oneLiner: string;
  unlockedAt: string;
  report: SajuReportPayload;
};

function isSavedReading(value: unknown): value is SavedSajuReading {
  if (!value || typeof value !== "object") return false;
  const c = value as Record<string, unknown>;
  return (
    typeof c.id === "string" &&
    typeof c.productId === "string" &&
    typeof c.productTitle === "string" &&
    typeof c.characterName === "string" &&
    typeof c.title === "string" &&
    typeof c.unlockedAt === "string" &&
    c.report != null &&
    typeof c.report === "object"
  );
}

export function readSavedSajuReadings(): SavedSajuReading[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SAJU_MY_READINGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSavedReading);
  } catch {
    return [];
  }
}

export function saveSajuReading(report: SajuReportPayload): SavedSajuReading[] {
  const entry: SavedSajuReading = {
    id: `${report.productId}-${report.generatedAt}`,
    productId: report.productId,
    productTitle: report.title,
    characterId: report.characterId,
    characterName: report.characterName,
    title: report.title,
    oneLiner: report.oneLiner,
    unlockedAt: new Date().toISOString(),
    report,
  };

  const existing = readSavedSajuReadings().filter((r) => r.id !== entry.id);
  const next = [entry, ...existing].slice(0, MAX_READINGS);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(SAJU_MY_READINGS_KEY, JSON.stringify(next));
  }
  return next;
}

export function getSavedSajuReading(id: string): SavedSajuReading | null {
  return readSavedSajuReadings().find((r) => r.id === id) ?? null;
}

export function clearSavedSajuReadings() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(SAJU_MY_READINGS_KEY);
  }
}

export function formatReadingDate(iso: string) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}.${m}.${day}`;
  } catch {
    return iso;
  }
}
