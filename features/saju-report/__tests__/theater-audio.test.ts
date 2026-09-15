import { describe, expect, it } from "vitest";

import {
  CHARACTER_AMBIENT_IDS,
  getCharacterAmbientSrc,
  getSfxForEntryBeat,
  getSpeakLinesForEntryBeat,
  getTheaterVoiceClipSrc,
  getTheaterVoiceClipSrcsForEntryBeat,
  getTheaterVoiceProfile,
  isTheaterSpeechAvailable,
  LOADING_THEATER_SFX,
  pickTheaterSpeechVoice,
  SFX_BY_ENTRY_BEAT,
  THEATER_ELEVENLABS_CAST,
  THEATER_SFX_SRC,
  THEATER_VOICE_AUTOPLAY_ENABLED,
  THEATER_VOICE_PROFILES,
} from "../theater-audio";
import type { SajuCharacterId } from "@/features/saju-chat/types";

describe("theater SFX map", () => {
  it("maps entry beats to scene one-shots", () => {
    expect(getSfxForEntryBeat("shrine")).toBe("candle");
    expect(getSfxForEntryBeat("hook")).toBe("enter");
    expect(getSfxForEntryBeat("selfId")).toBe("chime");
    expect(getSfxForEntryBeat("invite")).toBe("chime");
    expect(LOADING_THEATER_SFX).toBe("enter");
  });

  it("exposes mp3 and ogg paths for every sfx id", () => {
    for (const id of Object.values(SFX_BY_ENTRY_BEAT)) {
      expect(THEATER_SFX_SRC[id].mp3).toMatch(/\/saju\/audio\/sfx\/.+\.mp3$/);
      expect(THEATER_SFX_SRC[id].ogg).toMatch(/\/saju\/audio\/sfx\/.+\.ogg$/);
    }
  });
});

describe("character ambient beds", () => {
  it("covers all seven counselors with distinct ambient paths", () => {
    expect(CHARACTER_AMBIENT_IDS).toHaveLength(7);
    for (const id of CHARACTER_AMBIENT_IDS) {
      expect(getCharacterAmbientSrc(id, "mp3")).toBe(
        `/saju/audio/character/${id}.mp3`,
      );
      expect(getCharacterAmbientSrc(id, "ogg")).toBe(
        `/saju/audio/character/${id}.ogg`,
      );
    }
  });

  it("falls back to generic shrine ambient when character is missing", () => {
    expect(getCharacterAmbientSrc(null, "mp3")).toBe(
      "/saju/audio/ambient-shrine.mp3",
    );
    expect(getCharacterAmbientSrc("unknown", "ogg")).toBe(
      "/saju/audio/ambient-shrine.ogg",
    );
  });

  it("keeps voice autoplay fully disabled (BGM-only theater)", () => {
    expect(THEATER_VOICE_AUTOPLAY_ENABLED).toBe(false);
  });
});

describe("ElevenLabs cast + clip paths (kept on disk unused)", () => {
  it("covers all seven counselors with distinct stock voices", () => {
    const ids = Object.keys(THEATER_ELEVENLABS_CAST) as SajuCharacterId[];
    expect(ids).toHaveLength(7);
    const voiceIds = new Set(ids.map((id) => THEATER_ELEVENLABS_CAST[id].voiceId));
    expect(voiceIds.size).toBe(7);
  });

  it("builds voice clip urls for entry beats and loading (not autoplayed)", () => {
    expect(
      getTheaterVoiceClipSrc({ characterId: "baek-ryeon", kind: "loading" }),
    ).toBe("/saju/audio/voice/baek-ryeon/loading.mp3");
    expect(
      getTheaterVoiceClipSrc({
        characterId: "seo-nari",
        kind: "entry",
        slug: "heart",
        beat: "shrine",
      }),
    ).toBe("/saju/audio/voice/seo-nari/heart/shrine.mp3");

    const entry = {
      shrineLine: "촛불이 포근해.",
      lines: ["첫 줄", "둘째 줄"],
      inviteLine: "연을 알려주세요.",
    };
    expect(
      getTheaterVoiceClipSrcsForEntryBeat("baek-ryeon", "reunion", "hook", entry),
    ).toEqual([
      "/saju/audio/voice/baek-ryeon/reunion/hook-0.mp3",
      "/saju/audio/voice/baek-ryeon/reunion/hook-1.mp3",
    ]);
    expect(
      getTheaterVoiceClipSrcsForEntryBeat("baek-ryeon", "reunion", "selfId", entry),
    ).toEqual([]);
  });
});

describe("theater voice profiles (legacy Web Speech helpers)", () => {
  it("covers all seven counselors with distinct pitch/rate vibes", () => {
    const ids = Object.keys(THEATER_VOICE_PROFILES) as SajuCharacterId[];
    expect(ids).toHaveLength(7);

    const baek = getTheaterVoiceProfile("baek-ryeon");
    const nari = getTheaterVoiceProfile("seo-nari");
    const yuri = getTheaterVoiceProfile("cha-yuri");
    const bora = getTheaterVoiceProfile("han-bora");
    const doh = getTheaterVoiceProfile("lee-doryeong");
    const siwoo = getTheaterVoiceProfile("han-siwoo");
    const seon = getTheaterVoiceProfile("kang-seon");

    expect(baek.pitch).toBeLessThan(1);
    expect(baek.rate).toBeLessThan(1);
    expect(nari.pitch).toBeGreaterThan(1);
    expect(yuri.rate).toBeGreaterThan(1);
    expect(bora.pitch).toBeGreaterThan(nari.pitch);
    expect(bora.rate).toBeGreaterThan(1);
    expect(doh.rate).toBeLessThan(1);
    expect(doh.preferFemale).toBe(false);
    expect(siwoo.pitch).toBeLessThan(1);
    expect(seon.pitch).toBeGreaterThan(0.95);
    expect(seon.pitch).toBeLessThan(1.1);

    expect(getTheaterVoiceProfile("unknown").pitch).toBe(1);
  });

  it("picks Korean voices matching gender preference", () => {
    const voices = [
      { name: "Google US English", lang: "en-US" },
      { name: "Google 한국어", lang: "ko-KR" },
      { name: "Yuna", lang: "ko-KR" },
      { name: "InJoon", lang: "ko-KR" },
    ];
    const female = pickTheaterSpeechVoice(voices, getTheaterVoiceProfile("seo-nari"));
    const male = pickTheaterSpeechVoice(voices, getTheaterVoiceProfile("han-siwoo"));
    expect(female?.name).toBe("Yuna");
    expect(male?.name).toBe("InJoon");
    expect(pickTheaterSpeechVoice([], getTheaterVoiceProfile("seo-nari"))).toBeNull();
  });
});

describe("speak lines by beat (copy helpers; not autoplayed as voice)", () => {
  const entry = {
    shrineLine: "촛불이 포근해.",
    lines: ["첫 줄", "둘째 줄"],
    inviteLine: "연을 알려주세요.",
  };

  it("returns shrine, hook, invite — not selfId", () => {
    expect(getSpeakLinesForEntryBeat("shrine", entry)).toEqual(["촛불이 포근해."]);
    expect(getSpeakLinesForEntryBeat("hook", entry)).toEqual(["첫 줄", "둘째 줄"]);
    expect(getSpeakLinesForEntryBeat("selfId", entry)).toEqual([]);
    expect(getSpeakLinesForEntryBeat("invite", entry)).toEqual(["연을 알려주세요."]);
  });
});

describe("speech availability helper", () => {
  it("detects missing synthesis without throwing", () => {
    expect(isTheaterSpeechAvailable(null)).toBe(false);
    expect(isTheaterSpeechAvailable(undefined)).toBe(false);
    expect(isTheaterSpeechAvailable({ getVoices: () => [] })).toBe(true);
  });
});
