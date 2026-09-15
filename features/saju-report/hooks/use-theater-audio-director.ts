"use client";

import { useCallback, useEffect, useRef } from "react";

import type { SajuCharacterId } from "@/features/saju-chat/types";
import type {
  SajuEntryBeatId,
  SajuEntryContent,
} from "@/features/saju-report/entry-experience";
import { useTheaterAmbient } from "@/features/saju-report/hooks/use-theater-ambient";
import {
  getSfxForEntryBeat,
  getSpeakLinesForEntryBeat,
  getTheaterVoiceProfile,
  isTheaterSpeechAvailable,
  LOADING_THEATER_SFX,
  pickTheaterSpeechVoice,
  THEATER_SFX_SRC,
  type TheaterSfxId,
  type TheaterVoiceLike,
} from "@/features/saju-report/theater-audio";

function preferOgg(el: HTMLAudioElement) {
  return (
    typeof el.canPlayType === "function" &&
    el.canPlayType('audio/ogg; codecs="vorbis"') !== ""
  );
}

function sfxSrc(id: TheaterSfxId, ogg: boolean) {
  const pair = THEATER_SFX_SRC[id];
  return ogg ? pair.ogg : pair.mp3;
}

type EntryFields = {
  beat: SajuEntryBeatId;
  entry: Pick<SajuEntryContent, "shrineLine" | "lines" | "inviteLine">;
};

type LoadingFields = {
  loadingLine: string;
};

export type TheaterAudioDirectorOpts = {
  active: boolean;
  characterId: SajuCharacterId | string | null | undefined;
} & (
  | ({ mode: "entry" } & EntryFields)
  | ({ mode: "loading" } & LoadingFields)
);

/**
 * Theater audio director: ambient bed + scene SFX + character Web Speech TTS.
 * No ElevenLabs — uses window.speechSynthesis with character pitch/rate profiles.
 * Silent fallback when TTS unavailable; SFX still play when sound is on.
 */
export function useTheaterAudioDirector(opts: TheaterAudioDirectorOpts) {
  const ambient = useTheaterAmbient(opts.active);
  const { soundOn, setVoiceDucking, mute: ambientMute } = ambient;

  const sfxPoolRef = useRef<Partial<Record<TheaterSfxId, HTMLAudioElement>>>({});
  const lastBeatRef = useRef<SajuEntryBeatId | null>(null);
  const loadingFiredRef = useRef(false);
  const cancelledRef = useRef(false);

  const mode = opts.mode;
  const characterId = opts.characterId;
  const beat = mode === "entry" ? opts.beat : null;
  const entry = mode === "entry" ? opts.entry : null;
  const loadingLine = mode === "loading" ? opts.loadingLine : null;

  const cancelSpeech = useCallback(() => {
    setVoiceDucking(false);
    if (typeof window === "undefined") return;
    try {
      window.speechSynthesis?.cancel();
    } catch {
      /* ignore */
    }
  }, [setVoiceDucking]);

  const playSfx = useCallback(
    async (id: TheaterSfxId) => {
      if (!soundOn || typeof window === "undefined") return;
      try {
        let el = sfxPoolRef.current[id];
        if (!el) {
          el = new Audio();
          el.preload = "auto";
          el.src = sfxSrc(id, preferOgg(el));
          sfxPoolRef.current[id] = el;
        }
        el.volume = 0.72;
        el.currentTime = 0;
        await el.play();
      } catch {
        /* autoplay / decode — ignore; UI must not break */
      }
    },
    [soundOn],
  );

  const speakLines = useCallback(
    async (lines: string[], id: string | null | undefined) => {
      if (!soundOn || !lines.length || typeof window === "undefined") return;
      if (!isTheaterSpeechAvailable(window.speechSynthesis)) return;

      cancelSpeech();
      const profile = getTheaterVoiceProfile(id);
      const synth = window.speechSynthesis;

      let voices = synth.getVoices() as TheaterVoiceLike[];
      if (!voices.length) {
        await new Promise<void>((resolve) => {
          const done = () => resolve();
          synth.addEventListener("voiceschanged", done, { once: true });
          window.setTimeout(done, 400);
        });
        voices = synth.getVoices() as TheaterVoiceLike[];
      }
      if (cancelledRef.current || !soundOn) return;

      const picked = pickTheaterSpeechVoice(voices, profile);
      setVoiceDucking(true);

      const queue = [...lines];
      const speakNext = () => {
        if (cancelledRef.current || !soundOn) {
          setVoiceDucking(false);
          return;
        }
        const text = queue.shift();
        if (!text) {
          setVoiceDucking(false);
          return;
        }
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "ko-KR";
        u.pitch = profile.pitch;
        u.rate = profile.rate;
        u.volume = 1;
        if (picked) {
          const match = synth
            .getVoices()
            .find((v) => v.name === picked.name && v.lang === picked.lang);
          if (match) u.voice = match;
        }
        u.onend = () => speakNext();
        u.onerror = () => {
          setVoiceDucking(false);
        };
        try {
          synth.speak(u);
        } catch {
          setVoiceDucking(false);
        }
      };
      speakNext();
    },
    [cancelSpeech, setVoiceDucking, soundOn],
  );

  // Entry: beat change → SFX + optional character lines
  useEffect(() => {
    if (mode !== "entry" || !beat || !entry) return;
    if (!opts.active || !soundOn) return;

    if (lastBeatRef.current === beat) return;
    lastBeatRef.current = beat;

    const sfx = getSfxForEntryBeat(beat);
    void playSfx(sfx);

    const lines = getSpeakLinesForEntryBeat(beat, entry);
    if (!lines.length) return;

    const t = window.setTimeout(() => {
      void speakLines(lines, characterId);
    }, 180);
    return () => window.clearTimeout(t);
  }, [
    beat,
    characterId,
    entry,
    mode,
    opts.active,
    playSfx,
    soundOn,
    speakLines,
  ]);

  // Loading: enter SFX + counselor one-liner once when sound is on
  useEffect(() => {
    if (mode !== "loading") return;
    if (!opts.active || !soundOn) return;
    if (loadingFiredRef.current) return;
    loadingFiredRef.current = true;

    void playSfx(LOADING_THEATER_SFX);
    const line = loadingLine?.trim();
    if (!line) return;

    const t = window.setTimeout(() => {
      void speakLines([line], characterId);
    }, 220);
    return () => window.clearTimeout(t);
  }, [
    characterId,
    loadingLine,
    mode,
    opts.active,
    playSfx,
    soundOn,
    speakLines,
  ]);

  // When sound turns off, stop voice + one-shots; allow replay on re-enable
  useEffect(() => {
    if (!soundOn) {
      cancelSpeech();
      lastBeatRef.current = null;
      loadingFiredRef.current = false;
      for (const el of Object.values(sfxPoolRef.current)) {
        if (!el) continue;
        el.pause();
      }
    }
  }, [cancelSpeech, soundOn]);

  // Inactive reset + unmount cleanup
  useEffect(() => {
    if (!opts.active) {
      cancelSpeech();
      lastBeatRef.current = null;
      loadingFiredRef.current = false;
    }
  }, [cancelSpeech, opts.active]);

  useEffect(() => {
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
      cancelSpeech();
      for (const el of Object.values(sfxPoolRef.current)) {
        if (!el) continue;
        el.pause();
        try {
          el.currentTime = 0;
        } catch {
          /* ignore */
        }
      }
      sfxPoolRef.current = {};
    };
  }, [cancelSpeech]);

  const mute = useCallback(() => {
    cancelSpeech();
    ambientMute();
  }, [ambientMute, cancelSpeech]);

  return {
    ...ambient,
    mute,
    cancelSpeech,
    playSfx,
  };
}
