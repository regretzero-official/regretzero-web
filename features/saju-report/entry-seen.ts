import type { SajuLandingSlug } from "./product-landings";

const ENTRY_SEEN_KEY = "rz-saju-entry-seen";

type EntrySeenMap = Partial<Record<SajuLandingSlug, boolean>>;

function readMap(): EntrySeenMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(ENTRY_SEEN_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as EntrySeenMap;
  } catch {
    return {};
  }
}

function writeMap(next: EntrySeenMap) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ENTRY_SEEN_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota / private mode */
  }
}

export function hasSeenSajuEntry(slug: SajuLandingSlug): boolean {
  return Boolean(readMap()[slug]);
}

export function markSajuEntrySeen(slug: SajuLandingSlug) {
  const map = readMap();
  map[slug] = true;
  writeMap(map);
}

export function clearSajuEntrySeen(slug?: SajuLandingSlug) {
  if (!slug) {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(ENTRY_SEEN_KEY);
    }
    return;
  }
  const map = readMap();
  delete map[slug];
  writeMap(map);
}

export { ENTRY_SEEN_KEY };
