import type { SajuCharacterId } from "@/features/saju-chat/types";
import type { SajuEntryBeatId, SajuEntryContent } from "@/features/saju-report/entry-experience";

export type TheaterSfxId = "candle" | "enter" | "chime";

export const THEATER_SFX_BASE = "/saju/audio/sfx";

export const THEATER_SFX_SRC: Record<
  TheaterSfxId,
  { mp3: string; ogg: string }
> = {
  candle: {
    mp3: `${THEATER_SFX_BASE}/candle.mp3`,
    ogg: `${THEATER_SFX_BASE}/candle.ogg`,
  },
  enter: {
    mp3: `${THEATER_SFX_BASE}/enter.mp3`,
    ogg: `${THEATER_SFX_BASE}/enter.ogg`,
  },
  chime: {
    mp3: `${THEATER_SFX_BASE}/chime.mp3`,
    ogg: `${THEATER_SFX_BASE}/chime.ogg`,
  },
};

/** Beat → one-shot SFX (scene cue, not ambient drone). */
export const SFX_BY_ENTRY_BEAT: Record<SajuEntryBeatId, TheaterSfxId> = {
  shrine: "candle",
  hook: "enter",
  selfId: "chime",
  invite: "chime",
};

export function getSfxForEntryBeat(beat: SajuEntryBeatId): TheaterSfxId {
  return SFX_BY_ENTRY_BEAT[beat];
}

/** Loading theater uses a brief enter whoosh when sound starts. */
export const LOADING_THEATER_SFX: TheaterSfxId = "enter";

export type TheaterVoiceProfile = {
  characterId: SajuCharacterId;
  /** speechSynthesis pitch 0–2 (1 = default) */
  pitch: number;
  /** speechSynthesis rate ~0.1–10 (1 = default) */
  rate: number;
  /** Prefer these substrings in voice.name / voice.voiceURI (case-insensitive) */
  preferredNameFilters: string[];
  /** Prefer female-leaning vs male-leaning Korean voices when names are ambiguous */
  preferFemale: boolean;
};

/**
 * Character-matching Web Speech prefs (no ElevenLabs).
 * Pitch/rate differentiate counselors when the same ko-KR system voice is used.
 */
export const THEATER_VOICE_PROFILES: Record<SajuCharacterId, TheaterVoiceProfile> = {
  "baek-ryeon": {
    characterId: "baek-ryeon",
    pitch: 0.82,
    rate: 0.86,
    preferredNameFilters: ["yuna", "sunhi", "female", "woman", "google"],
    preferFemale: true,
  },
  "seo-nari": {
    characterId: "seo-nari",
    pitch: 1.12,
    rate: 0.98,
    preferredNameFilters: ["yuna", "sunhi", "female", "woman", "google"],
    preferFemale: true,
  },
  "cha-yuri": {
    characterId: "cha-yuri",
    pitch: 1.0,
    rate: 1.12,
    preferredNameFilters: ["yuna", "heami", "female", "woman"],
    preferFemale: true,
  },
  "han-bora": {
    characterId: "han-bora",
    pitch: 1.18,
    rate: 1.08,
    preferredNameFilters: ["yuna", "sunhi", "female", "woman", "google"],
    preferFemale: true,
  },
  "lee-doryeong": {
    characterId: "lee-doryeong",
    pitch: 0.94,
    rate: 0.9,
    preferredNameFilters: ["jinho", "injoon", "male", "man", "google"],
    preferFemale: false,
  },
  "han-siwoo": {
    characterId: "han-siwoo",
    pitch: 0.86,
    rate: 0.96,
    preferredNameFilters: ["jinho", "injoon", "male", "man"],
    preferFemale: false,
  },
  "kang-seon": {
    characterId: "kang-seon",
    pitch: 1.02,
    rate: 1.0,
    preferredNameFilters: ["jinho", "injoon", "male", "man", "google"],
    preferFemale: false,
  },
};

const DEFAULT_VOICE_PROFILE: TheaterVoiceProfile = {
  characterId: "seo-nari",
  pitch: 1,
  rate: 1,
  preferredNameFilters: ["ko", "korean"],
  preferFemale: true,
};

export function getTheaterVoiceProfile(
  characterId: string | null | undefined,
): TheaterVoiceProfile {
  if (characterId && characterId in THEATER_VOICE_PROFILES) {
    return THEATER_VOICE_PROFILES[characterId as SajuCharacterId];
  }
  return DEFAULT_VOICE_PROFILE;
}

/** Minimal voice shape so Node unit tests do not need SpeechSynthesisVoice. */
export type TheaterVoiceLike = {
  name: string;
  lang: string;
  voiceURI?: string;
};

function scoreVoice(voice: TheaterVoiceLike, profile: TheaterVoiceProfile): number {
  const name = `${voice.name} ${voice.voiceURI ?? ""}`.toLowerCase();
  const lang = voice.lang.toLowerCase();
  let score = 0;
  if (lang.startsWith("ko")) score += 100;
  else if (lang.includes("ko")) score += 40;
  else return -1;

  for (const filter of profile.preferredNameFilters) {
    if (name.includes(filter.toLowerCase())) score += 25;
  }

  const femaleHints = ["female", "woman", "yuna", "sunhi", "heami", "sora"];
  const maleHints = ["male", "man", "jinho", "injoon", "wavenet-c", "wavenet-d"];
  const looksFemale = femaleHints.some((h) => name.includes(h));
  const looksMale = maleHints.some((h) => name.includes(h));
  if (profile.preferFemale) {
    if (looksFemale) score += 15;
    if (looksMale) score -= 10;
  } else {
    if (looksMale) score += 15;
    if (looksFemale) score -= 10;
  }
  return score;
}

/** Pick best available system voice for a character profile (pure). */
export function pickTheaterSpeechVoice(
  voices: readonly TheaterVoiceLike[],
  profile: TheaterVoiceProfile,
): TheaterVoiceLike | null {
  if (!voices.length) return null;
  let best: TheaterVoiceLike | null = null;
  let bestScore = -1;
  for (const voice of voices) {
    const s = scoreVoice(voice, profile);
    if (s > bestScore) {
      bestScore = s;
      best = voice;
    }
  }
  return bestScore >= 0 ? best : null;
}

/**
 * Lines the character should speak on a beat.
 * shrine / hook / invite speak; selfId is chips-only (SFX only).
 */
export function getSpeakLinesForEntryBeat(
  beat: SajuEntryBeatId,
  entry: Pick<SajuEntryContent, "shrineLine" | "lines" | "inviteLine">,
): string[] {
  switch (beat) {
    case "shrine":
      return entry.shrineLine ? [entry.shrineLine] : [];
    case "hook":
      return entry.lines.filter(Boolean);
    case "invite":
      return entry.inviteLine ? [entry.inviteLine] : [];
    case "selfId":
      return [];
    default:
      return [];
  }
}

export function isTheaterSpeechAvailable(
  speechSynthesis: { getVoices?: () => unknown } | null | undefined,
): boolean {
  return !!speechSynthesis && typeof speechSynthesis.getVoices === "function";
}
