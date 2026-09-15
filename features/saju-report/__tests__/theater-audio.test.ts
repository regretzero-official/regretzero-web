import { describe, expect, it } from "vitest";

import {
  getSfxForEntryBeat,
  getSpeakLinesForEntryBeat,
  getTheaterVoiceProfile,
  isTheaterSpeechAvailable,
  LOADING_THEATER_SFX,
  pickTheaterSpeechVoice,
  SFX_BY_ENTRY_BEAT,
  THEATER_SFX_SRC,
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

describe("theater voice profiles", () => {
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

    // 백련: lower, slower, firm
    expect(baek.pitch).toBeLessThan(1);
    expect(baek.rate).toBeLessThan(1);
    // 서나리: warmer, slightly higher
    expect(nari.pitch).toBeGreaterThan(1);
    // 차유리: dry, medium-fast
    expect(yuri.rate).toBeGreaterThan(1);
    // 한보라: brighter, upbeat
    expect(bora.pitch).toBeGreaterThan(nari.pitch);
    expect(bora.rate).toBeGreaterThan(1);
    // 이도령: soft polite slower
    expect(doh.rate).toBeLessThan(1);
    expect(doh.preferFemale).toBe(false);
    // 한시우: cool lower
    expect(siwoo.pitch).toBeLessThan(1);
    // 강세온: warm mid
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

describe("speak lines by beat", () => {
  const entry = {
    shrineLine: "촛불이 흔들려.",
    lines: ["첫 줄", "둘째 줄"],
    inviteLine: "연을 알려주세요.",
  };

  it("speaks shrine, hook, invite — not selfId", () => {
    expect(getSpeakLinesForEntryBeat("shrine", entry)).toEqual(["촛불이 흔들려."]);
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
