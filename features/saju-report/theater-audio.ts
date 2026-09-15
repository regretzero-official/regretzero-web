import type { SajuCharacterId } from "@/features/saju-chat/types";
import type {
  SajuEntryBeatId,
  SajuEntryContent,
} from "@/features/saju-report/entry-experience";
import type { SajuLandingSlug } from "@/features/saju-report/product-landings";

export type TheaterSfxId = "candle" | "enter" | "chime";

export const THEATER_SFX_BASE = "/saju/audio/sfx";
export const THEATER_VOICE_BASE = "/saju/audio/voice";

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

/** ElevenLabs stock casting used by generate-saju-theater-voices.mjs */
export type TheaterElevenLabsCast = {
  characterId: SajuCharacterId;
  voiceName: string;
  voiceId: string;
  note: string;
  /** TTS stability 0–1 (higher = more stable / less expressive) */
  stability: number;
  similarityBoost: number;
  style: number;
};

export const THEATER_ELEVENLABS_CAST: Record<
  SajuCharacterId,
  TheaterElevenLabsCast
> = {
  "baek-ryeon": {
    characterId: "baek-ryeon",
    voiceName: "Lily",
    voiceId: "pFZP5JQG7iQjIQuC4Bku",
    note: "deep firm / mystical female",
    stability: 0.72,
    similarityBoost: 0.78,
    style: 0.12,
  },
  "seo-nari": {
    characterId: "seo-nari",
    voiceName: "Sarah",
    voiceId: "EXAVITQu4vr4xnSDxMaL",
    note: "warm soft female",
    stability: 0.5,
    similarityBoost: 0.75,
    style: 0.32,
  },
  "cha-yuri": {
    characterId: "cha-yuri",
    voiceName: "Laura",
    voiceId: "FGY2WhTYpPnrIDTdsKH5",
    note: "dry sharp female",
    stability: 0.55,
    similarityBoost: 0.8,
    style: 0.22,
  },
  "han-bora": {
    characterId: "han-bora",
    voiceName: "Jessica",
    voiceId: "cgSgspJ2msm6WN1Q7bA",
    note: "bright young female",
    stability: 0.32,
    similarityBoost: 0.7,
    style: 0.55,
  },
  "lee-doryeong": {
    characterId: "lee-doryeong",
    voiceName: "George",
    voiceId: "JBFqnCBsd6RMkjVDRZzb",
    note: "soft polite male",
    stability: 0.62,
    similarityBoost: 0.75,
    style: 0.18,
  },
  "han-siwoo": {
    characterId: "han-siwoo",
    voiceName: "Callum",
    voiceId: "N2lVS1w4EtoT3dr4eOWO",
    note: "cool male",
    stability: 0.55,
    similarityBoost: 0.75,
    style: 0.28,
  },
  "kang-seon": {
    characterId: "kang-seon",
    voiceName: "Brian",
    voiceId: "nPczCjzI2devNBz1zQrb",
    note: "warm male",
    stability: 0.5,
    similarityBoost: 0.75,
    style: 0.35,
  },
};

/**
 * Pre-generated ElevenLabs clip path.
 * Entry: /saju/audio/voice/{characterId}/{slug}/{beat}.mp3
 * Loading: /saju/audio/voice/{characterId}/loading.mp3
 */
export function getTheaterVoiceClipSrc(opts: {
  characterId: string;
  kind: "loading";
}): string;
export function getTheaterVoiceClipSrc(opts: {
  characterId: string;
  kind: "entry";
  slug: SajuLandingSlug;
  beat: "shrine" | "invite" | `hook-${number}`;
}): string;
export function getTheaterVoiceClipSrc(opts: {
  characterId: string;
  kind: "loading" | "entry";
  slug?: SajuLandingSlug;
  beat?: string;
}): string {
  if (opts.kind === "loading") {
    return `${THEATER_VOICE_BASE}/${opts.characterId}/loading.mp3`;
  }
  return `${THEATER_VOICE_BASE}/${opts.characterId}/${opts.slug}/${opts.beat}.mp3`;
}

/** Resolve ordered clip URLs for an entry beat (empty if nothing to speak). */
export function getTheaterVoiceClipSrcsForEntryBeat(
  characterId: string | null | undefined,
  slug: SajuLandingSlug | null | undefined,
  beat: SajuEntryBeatId,
  entry: Pick<SajuEntryContent, "shrineLine" | "lines" | "inviteLine">,
): string[] {
  if (!characterId || !slug) return [];
  const lines = getSpeakLinesForEntryBeat(beat, entry);
  if (!lines.length) return [];
  if (beat === "hook") {
    return lines.map((_, i) =>
      getTheaterVoiceClipSrc({
        characterId,
        kind: "entry",
        slug,
        beat: `hook-${i}`,
      }),
    );
  }
  if (beat === "shrine" || beat === "invite") {
    return [
      getTheaterVoiceClipSrc({
        characterId,
        kind: "entry",
        slug,
        beat,
      }),
    ];
  }
  return [];
}

export type TheaterVoiceProfile = {
  characterId: SajuCharacterId;
  /** speechSynthesis pitch 0–2 (1 = default) — last-resort fallback only */
  pitch: number;
  /** speechSynthesis rate ~0.1–10 (1 = default) */
  rate: number;
  preferredNameFilters: string[];
  preferFemale: boolean;
};

/**
 * Web Speech prefs — last-resort fallback when an ElevenLabs mp3 is missing.
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
