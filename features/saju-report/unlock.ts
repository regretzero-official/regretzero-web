"use client";

import type { SajuProductId } from "./types";

const SAJU_REPORT_UNLOCK_KEY = "rz-saju-report-demo-unlock";

export type SajuReportUnlockState = {
  unlocked: boolean;
  unlockedAt: string | null;
  productId: SajuProductId | string | null;
};

const DEFAULT_STATE: SajuReportUnlockState = {
  unlocked: false,
  unlockedAt: null,
  productId: null,
};

function isUnlockState(value: unknown): value is SajuReportUnlockState {
  if (!value || typeof value !== "object") return false;
  const c = value as Record<string, unknown>;
  return (
    typeof c.unlocked === "boolean" &&
    (c.unlockedAt === null || typeof c.unlockedAt === "string") &&
    (c.productId === null || typeof c.productId === "string")
  );
}

export function readSajuReportUnlock(): SajuReportUnlockState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(SAJU_REPORT_UNLOCK_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as unknown;
    return isUnlockState(parsed) ? parsed : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

export function unlockSajuReportDemo(productId: string): SajuReportUnlockState {
  const next: SajuReportUnlockState = {
    unlocked: true,
    unlockedAt: new Date().toISOString(),
    productId,
  };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(SAJU_REPORT_UNLOCK_KEY, JSON.stringify(next));
  }
  return next;
}

export function clearSajuReportUnlock() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(SAJU_REPORT_UNLOCK_KEY);
  }
}
