"use client";

const SAJU_UNLOCK_KEY = "rz-saju-demo-unlock";

export type SajuUnlockState = {
  unlocked: boolean;
  unlockedAt: string | null;
  characterId: string | null;
};

const DEFAULT_STATE: SajuUnlockState = {
  unlocked: false,
  unlockedAt: null,
  characterId: null,
};

function isUnlockState(value: unknown): value is SajuUnlockState {
  if (!value || typeof value !== "object") return false;
  const c = value as Record<string, unknown>;
  return (
    typeof c.unlocked === "boolean" &&
    (c.unlockedAt === null || typeof c.unlockedAt === "string") &&
    (c.characterId === null || typeof c.characterId === "string")
  );
}

export function readSajuUnlockState(): SajuUnlockState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(SAJU_UNLOCK_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as unknown;
    return isUnlockState(parsed) ? parsed : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

export function unlockSajuDemo(characterId: string): SajuUnlockState {
  const next: SajuUnlockState = {
    unlocked: true,
    unlockedAt: new Date().toISOString(),
    characterId,
  };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(SAJU_UNLOCK_KEY, JSON.stringify(next));
  }
  return next;
}

export function clearSajuUnlock() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(SAJU_UNLOCK_KEY);
  }
}
