"use client";

export interface PremiumAccessState {
  isPremium: boolean;
  unlockedAt: string | null;
}

const PREMIUM_ACCESS_STORAGE_KEY = "rz-premium-access";

const DEFAULT_STATE: PremiumAccessState = {
  isPremium: false,
  unlockedAt: null,
};

function isPremiumAccessState(value: unknown): value is PremiumAccessState {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.isPremium === "boolean" &&
    (candidate.unlockedAt === null || typeof candidate.unlockedAt === "string")
  );
}

export function readPremiumAccessState(): PremiumAccessState {
  if (typeof window === "undefined") {
    return DEFAULT_STATE;
  }

  try {
    const rawValue = window.localStorage.getItem(PREMIUM_ACCESS_STORAGE_KEY);
    if (!rawValue) {
      return DEFAULT_STATE;
    }

    const parsed = JSON.parse(rawValue) as unknown;
    return isPremiumAccessState(parsed) ? parsed : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

export function writePremiumAccessState(nextState: PremiumAccessState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(PREMIUM_ACCESS_STORAGE_KEY, JSON.stringify(nextState));
}

export function unlockPremiumAccess() {
  const nextState: PremiumAccessState = {
    isPremium: true,
    unlockedAt: new Date().toISOString(),
  };

  writePremiumAccessState(nextState);
  return nextState;
}
